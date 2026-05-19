from __future__ import annotations

import numpy as np
import pymc as pm
import pytensor.tensor as pt

from ..bayes_common import (
    GENRE_IDS,
    GENRE_LABELS,
    HAS_PYMC,
    analysis_result,
    fallback_analysis,
    mcmc_block,
    sample_model,
)
from ..bayes_plots import (
    plot_ch_contribution_stack,
    plot_decomposition_bars,
    plot_forest_list,
    plot_genre_mix_trends,
    plot_mcmc_trace,
)
from ..bayes_utils import HDI_LABEL, extract_mcmc_diagnostics, posterior_row, posterior_table_rows
from ..data import COVID_YEARS, CinemaContext, save_figure
from ..plots import apply_style, pct_de

MODEL = {
    "title": "Logit-Linear-Trend für den Genre-Mix (Multinomial)",
    "likelihood": "n_{g,t} ~ Multinomial(N_t, p_t) mit p_t = softmax(η_t)",
    "link": "η_{fic,t}=0 (Referenz), η_{doc,t}=α_doc+β_doc·(Jahr−Jahr̄), η_{ani,t}=α_ani+β_ani·(Jahr−Jahr̄)",
    "priors": ["α, β ~ Normal(0, 1) je Genre (doc, ani); Fiktion als Referenzkategorie"],
    "notes": (
        "Zwei gekoppelte Mix-Modelle: Besuchs-Mix (Eintritte) und Programm-Mix (Filme). "
        "Gesamt-CH-Anteil = Σ_g w_g · p_g (Mix × Erfolg im Genre); Zerlegung Mix vs. Erfolg."
    ),
}

VARIABLES = [
    {"symbol": "w_{g,t}", "name": "Genre-Mix", "description": "Anteil Genre g an Marktbesuchen bzw. -filmen."},
    {"symbol": "p_{g,t}", "name": "CH-Erfolg im Genre", "description": "CH-Besuche in g / Marktbesuche in g (beobachtet)."},
    {"symbol": "β_doc, β_ani", "name": "Mix-Trend", "description": "Änderung des logit-Anteils pro Jahr (doc/ani vs. Fiktion)."},
    {
        "symbol": "Σ_g w_g·p_g",
        "name": "Beitrag zum CH-Gesamtanteil",
        "description": "Identität: CH-Besuchsanteil = Summe der Genre-Beiträge.",
    },
]


def _softmax_mix(alpha_doc, beta_doc, alpha_ani, beta_ani, year_c):
    eta_doc = alpha_doc + beta_doc * year_c
    eta_ani = alpha_ani + beta_ani * year_c
    eta = pt.stack([pt.zeros_like(eta_doc), eta_doc, eta_ani], axis=1)
    return pm.math.softmax(eta, axis=1)


def _decompose_change(
    w0: np.ndarray,
    w1: np.ndarray,
    p0: np.ndarray,
    p1: np.ndarray,
) -> dict[str, float]:
    mix = float(np.sum((w1 - w0) * p0))
    within = float(np.sum(w1 * (p1 - p0)))
    interaction = float(np.sum((w1 - w0) * (p1 - p0)))
    total = float(np.sum(w1 * p1) - np.sum(w0 * p0))
    return {"mix": mix, "within": within, "interaction": interaction, "total": total}


def run(ctx: CinemaContext) -> dict:
    if not HAS_PYMC or ctx.px_genre_mix_yearly.empty:
        return fallback_analysis(id="ch_genremix_bayes")
    return _run(ctx)


def _run(ctx: CinemaContext) -> dict:
    apply_style()
    df = ctx.px_genre_mix_yearly.sort_values("year")
    fit_df = df[~df["is_covid"]].copy()
    years = fit_df["year"].values.astype(float)
    year_mean = float(years.mean())
    year_c = years - year_mean

    adm_counts = fit_df[[f"market_adm_{g}" for g in GENRE_IDS]].values.astype(np.int64)
    film_counts = fit_df[[f"market_films_{g}" for g in GENRE_IDS]].values.astype(np.int64)
    total_adm = adm_counts.sum(axis=1)
    total_films = film_counts.sum(axis=1)

    with pm.Model() as model:
        alpha_doc_d = pm.Normal("alpha_doc_d", 0, 1)
        beta_doc_d = pm.Normal("beta_doc_d", 0, 0.15)
        alpha_ani_d = pm.Normal("alpha_ani_d", 0, 1)
        beta_ani_d = pm.Normal("beta_ani_d", 0, 0.15)
        p_demand = _softmax_mix(alpha_doc_d, beta_doc_d, alpha_ani_d, beta_ani_d, year_c)
        pm.Multinomial("demand_mix", n=total_adm, p=p_demand, observed=adm_counts)

        alpha_doc_s = pm.Normal("alpha_doc_s", 0, 1)
        beta_doc_s = pm.Normal("beta_doc_s", 0, 0.15)
        alpha_ani_s = pm.Normal("alpha_ani_s", 0, 1)
        beta_ani_s = pm.Normal("beta_ani_s", 0, 0.15)
        p_supply = _softmax_mix(alpha_doc_s, beta_doc_s, alpha_ani_s, beta_ani_s, year_c)
        pm.Multinomial("supply_mix", n=total_films, p=p_supply, observed=film_counts)

        idata = sample_model(model)

    post = idata.posterior
    n_draws = post.sizes["chain"] * post.sizes["draw"]

    def mix_draws(prefix: str) -> np.ndarray:
        """(draws, years, 3) für fic, doc, ani."""
        ad = post[f"alpha_doc_{prefix}"].values.reshape(n_draws)
        bd = post[f"beta_doc_{prefix}"].values.reshape(n_draws)
        aa = post[f"alpha_ani_{prefix}"].values.reshape(n_draws)
        ba = post[f"beta_ani_{prefix}"].values.reshape(n_draws)
        out = np.zeros((n_draws, len(years), 3))
        for i, yc in enumerate(year_c):
            eta = np.stack([np.zeros(n_draws), ad + bd * yc, aa + ba * yc], axis=1)
            e = np.exp(eta - eta.max(axis=1, keepdims=True))
            out[:, i, :] = e / e.sum(axis=1, keepdims=True)
        return out

    w_demand = mix_draws("d")  # posterior mix Besuche
    w_supply = mix_draws("s")

    # Beobachteter CH-Erfolg je Genre
    p_obs = fit_df[[f"ch_share_{g}" for g in GENRE_IDS]].values  # (T, 3)
    w_obs = fit_df[[f"market_share_adm_{g}" for g in GENRE_IDS]].values

    contrib_draws: dict[str, np.ndarray] = {}
    for j, gid in enumerate(GENRE_IDS):
        contrib_draws[gid] = w_demand[:, :, j] * p_obs[:, j][None, :]

    ch_total_obs = (fit_df[[f"ch_adm_{g}" for g in GENRE_IDS]].sum(axis=1) / total_adm).values

    # Zerlegung 2014 vs. letztes Jahr (Posterior Mix + beob. p)
    i0, i1 = 0, len(years) - 1
    decomp_draws = {"mix": [], "within": [], "interaction": [], "total": []}
    for d in range(n_draws):
        eff = _decompose_change(w_demand[d, i0], w_demand[d, i1], p_obs[i0], p_obs[i1])
        for k in decomp_draws:
            decomp_draws[k].append(eff[k])
    decomp_mean = {k: float(np.mean(v)) * 100 for k, v in decomp_draws.items()}
    decomp_pp = {
        "Mix-Effekt": decomp_mean["mix"],
        "Erfolg im Genre": decomp_mean["within"],
        "Interaktion": decomp_mean["interaction"],
    }

    rows = [
        posterior_row("β_doc (Besuche)", "Trend Dokumentar-Mix", post["beta_doc_d"].values.flatten(), pd_positive=True),
        posterior_row("β_ani (Besuche)", "Trend Animation-Mix", post["beta_ani_d"].values.flatten(), pd_positive=True),
        posterior_row("β_doc (Filme)", "Trend Dokumentar-Programm", post["beta_doc_s"].values.flatten(), pd_positive=True),
        posterior_row("β_ani (Filme)", "Trend Animation-Programm", post["beta_ani_s"].values.flatten(), pd_positive=True),
    ]
    table = posterior_table_rows(rows)
    diag = extract_mcmc_diagnostics(
        idata,
        ["alpha_doc_d", "beta_doc_d", "alpha_ani_d", "beta_ani_d", "alpha_doc_s", "beta_doc_s", "alpha_ani_s", "beta_ani_s"],
    )

    observed_adm = {g: fit_df[f"market_share_adm_{g}"].values for g in GENRE_IDS}
    observed_films = {g: fit_df[f"market_share_films_{g}"].values for g in GENRE_IDS}
    share_demand_draws = {GENRE_IDS[i]: w_demand[:, :, i] for i in range(3)}
    share_supply_draws = {GENRE_IDS[i]: w_supply[:, :, i] for i in range(3)}

    y0, y1 = int(years[i0]), int(years[i1])

    fig1 = save_figure(
        ctx,
        "06_genremix_demand.png",
        plot_genre_mix_trends(
            years,
            share_demand_draws,
            observed_adm,
            labels=GENRE_LABELS,
            ylabel="Anteil an Kinobesuchen (%)",
            title="Genre-Anteile an Kinobesuchen über die Jahre",
        ),
    )
    fig2 = save_figure(
        ctx,
        "06_genremix_supply.png",
        plot_genre_mix_trends(
            years,
            share_supply_draws,
            observed_films,
            labels=GENRE_LABELS,
            ylabel="Anteil an Kinofilmen (%)",
            title=f"Posterior Genre-Mix Programm ({HDI_LABEL})",
        ),
    )
    fig3 = save_figure(
        ctx,
        "06_genremix_contrib.png",
        plot_ch_contribution_stack(years, contrib_draws, labels=GENRE_LABELS),
    )
    fig4 = save_figure(
        ctx,
        "06_genremix_decomp.png",
        plot_decomposition_bars(
            decomp_pp,
            title=f"Zerlegung CH-Gesamtanteil: {y0} → {y1} (Prozentpunkte)",
        ),
    )
    fig5 = save_figure(
        ctx,
        "06_genremix_forest.png",
        plot_forest_list(
            [
                ("β_doc", "Mix Besuche: Dokumentar", post["beta_doc_d"].values.flatten()),
                ("β_ani", "Mix Besuche: Animation", post["beta_ani_d"].values.flatten()),
            ]
        ),
    )
    fig6 = save_figure(
        ctx,
        "06_genremix_trace.png",
        plot_mcmc_trace(idata, ["beta_doc_d", "beta_ani_d"]),
    )

    return analysis_result(
        id="ch_genremix_bayes",
        figures=[
            {"src": fig1, "caption": "Genre-Anteile an Kinobesuchen über die Jahre."},
            {"src": fig2, "caption": "Genre-Anteile im Kinoprogramm über die Jahre."},
            {"src": fig3, "caption": "Beitrag je Genre zum CH-Gesamtanteil (Mix × Erfolg)."},
            {"src": fig4, "caption": f"Warum der CH-Gesamtanteil steigt: Mix vs. Erfolg ({y0}–{y1}, Prozentpunkte)."},
            {"src": fig5, "caption": "Forest-Plot Mix-Trends (Besuche)."},
            {"src": fig6, "caption": "MCMC-Trace Mix-Trends Besuche."},
        ],
        tables=[table],
        diagnostics=diag,
        mcmc=mcmc_block(fit_years=[int(y) for y in years], year_center=year_mean),
    )
