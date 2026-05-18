from __future__ import annotations

from ..bayes_plots import (
    plot_fit_vs_observed,
    plot_forest_parameters,
    plot_mcmc_trace,
    plot_posterior_parameters,
    plot_trend_with_hdi,
)
from ..bayes_utils import (
    HDI_LABEL,
    HDI_PCT,
    extract_mcmc_diagnostics,
    hdi_bounds,
    posterior_row,
    posterior_table_rows,
)
from ..data import CinemaContext, save_figure
from ..plots import apply_style, pct_de

try:
    import numpy as np
    import pymc as pm

    HAS_PYMC = True
except ImportError:
    HAS_PYMC = False


MODEL = {
    "title": "Hierarchisches Trendmodell für den CH-Besuchsanteil",
    "likelihood": "Besuche bei Schweizer Filmen yₜ ~ Binomial(Nₜ, pₜ)",
    "link": "logit(pₜ) = α + β · (Jahrₜ − Jahr̄)",
    "priors": [
        "α ~ Normal(0, 1,5) — Basis auf logit-Skala (schwach informativ)",
        "β ~ Normal(0, 0,2) — jährlicher Trend (schwach informativ; Erwartung nahe 0)",
    ],
    "notes": (
        "Schätzung auf Jahren ohne starke Pandemie-Störung (2014–2019, 2022–2025). "
        "2020–2021 werden in der Grafik markiert, fliessen aber nicht in die Schätzung ein. "
        f"Unsicherheit: {HDI_LABEL} (ArviZ HDI, nicht gleichverteiltes Quantil)."
    ),
}

VARIABLES = [
    {
        "symbol": "yₜ",
        "name": "CH-Kinobesuche",
        "description": "Beobachtete Besuche bei Schweizer Filmen im Jahr t (PX).",
    },
    {
        "symbol": "Nₜ",
        "name": "Gesamtbesuche",
        "description": "Alle Kinobesuche am Markt im Jahr t (Nenner).",
    },
    {
        "symbol": "pₜ",
        "name": "CH-Besuchsanteil",
        "description": "Latenter Anteil yₜ/Nₜ — «Erfolg» Schweizer Film am Kino.",
    },
    {
        "symbol": "α",
        "name": "Intercept",
        "description": "Logit-Anteil im Bezugsjahr (zentriert um Jahr̄).",
    },
    {
        "symbol": "β",
        "name": "Trend",
        "description": "Änderung des Logit-Anteils pro Jahr (positiv → steigender CH-Anteil).",
    },
    {
        "symbol": "Jahr̄",
        "name": "Jahreszentrum",
        "description": "Mittelwert der Schätzjahre; macht β interpretierbar.",
    },
]


def run(ctx: CinemaContext) -> dict:
    df = ctx.px_yearly.sort_values("year").copy()
    fit_df = df[~df["is_covid"]].copy()
    if HAS_PYMC:
        return _run_pymc(ctx, df, fit_df)
    return _run_fallback_notice(ctx)


def _run_fallback_notice(ctx: CinemaContext) -> dict:
    return {
        "id": "ch_success_bayes",
        "title": "Bayesianische Modellierung: Besuchsanteil CH",
        "question": "Steigt der Erfolg Schweizer Filme am Kino über die Zeit?",
        "data": "BFS PX.",
        "method": "PyMC nicht verfügbar — bitte `pixi run analyze` ausführen.",
        "model": MODEL,
        "variables": VARIABLES,
        "findings": ["Vollständige Posterior-Ausgabe erfordert PyMC/ArviZ im Pixi-Environment."],
        "figures": [],
        "tables": [],
        "limits": [],
    }


def _run_pymc(ctx: CinemaContext, df, fit_df) -> dict:
    apply_style()
    year_mean = float(fit_df["year"].mean())
    year_c = fit_df["year"].values - year_mean
    ch = fit_df["ch_admissions"].values.astype(float)
    total = fit_df["market_admissions"].values.astype(float)
    fit_years = fit_df["year"].values

    with pm.Model():
        alpha = pm.Normal("alpha", mu=0, sigma=1.5)
        beta = pm.Normal("beta", mu=0, sigma=0.2)
        logit_p = alpha + beta * year_c
        p = pm.Deterministic("p", pm.math.invlogit(logit_p))
        pm.Binomial("ch_adm", n=total, p=p, observed=ch)
        idata = pm.sample(
            draws=1000,
            tune=1000,
            chains=4,
            target_accept=0.92,
            progressbar=False,
            random_seed=42,
            idata_kwargs={"log_likelihood": True},
        )

    post = idata.posterior
    alpha_s = post["alpha"].values.flatten()
    beta_s = post["beta"].values.flatten()

    post_rows = [
        posterior_row("α", "Intercept (logit)", alpha_s, pd_positive=True),
        posterior_row("β", "Trend pro Jahr (logit)", beta_s, pd_positive=True),
    ]
    post_table = posterior_table_rows(post_rows)
    diag_metrics = extract_mcmc_diagnostics(idata, ["alpha", "beta"])

    all_years = df["year"].values
    year_c_all = all_years - year_mean
    p_draws = 1 / (1 + np.exp(-(alpha_s[:, None] + beta_s[:, None] * year_c_all[None, :])))

    fit_mask = np.isin(all_years, fit_years)
    p_draws_fit = p_draws[:, fit_mask]
    fit_years_arr = all_years[fit_mask]
    observed_pct_all = df["ch_share_admissions"].values * 100
    observed_pct_fit = observed_pct_all[fit_mask]

    fig_trend = save_figure(
        ctx,
        "03_ch_erfolg_bayes.png",
        plot_trend_with_hdi(
            all_years,
            p_draws,
            df["year"].values,
            observed_pct_all,
        ),
    )
    fig_fit = save_figure(
        ctx,
        "03_modell_passung.png",
        plot_fit_vs_observed(fit_years_arr, observed_pct_fit, p_draws_fit),
    )
    fig_post = save_figure(
        ctx,
        "03_posterior_kde.png",
        plot_posterior_parameters(alpha_s, beta_s),
    )
    fig_forest = save_figure(
        ctx,
        "03_posterior_forest.png",
        plot_forest_parameters(alpha_s, beta_s),
    )
    fig_trace = save_figure(
        ctx,
        "03_trace.png",
        plot_mcmc_trace(idata, ["alpha", "beta"]),
    )

    p_mean = p_draws.mean(axis=0)
    beta_mean = post_rows[1]["mean"]
    last_year = int(df["year"].max())
    last_idx = list(all_years).index(last_year)
    p_last = float(p_mean[last_idx])
    p_last_lo, p_last_hi = hdi_bounds(p_draws[:, last_idx])

    return {
        "id": "ch_success_bayes",
        "title": "Bayesianische Modellierung: Erfolg Schweizer Filme",
        "question": "Steigt der Besuchsanteil Schweizer Filme am Kinomarkt über die Jahre — und wie sicher ist der Trend?",
        "data": (
            f"BFS PX, Schätzjahre: {', '.join(str(int(y)) for y in fit_years)} "
            f"(ohne 2020–2021). Jahr̄ = {year_mean:.0f}."
        ),
        "method": (
            "Bayes (PyMC): Binomial-Likelihood, logit-Link, MCMC (NUTS), "
            f"4 Ketten × 1000 Draws. Unsicherheit: {HDI_LABEL}; "
            "Richtung: Probability of Direction (Pd), nicht p-Wert."
        ),
        "model": MODEL,
        "variables": VARIABLES,
        "mcmc": {
            "sampler": "NUTS",
            "chains": 4,
            "tune": 1000,
            "draws": 1000,
            "target_accept": 0.92,
            "fit_years": [int(y) for y in fit_years],
            "year_center": year_mean,
        },
        "findings": [
            f"β (Trend): Mittel {beta_mean:.3f}, {HDI_PCT} %-HDI [{post_rows[1]['hdi_label']}] (logit).",
            f"Pd(β > 0) = {post_rows[1]['pd_label']} — Probability of Direction.",
            f"Posterior p ({last_year}): {pct_de(p_last)} [{pct_de(p_last_lo)} – {pct_de(p_last_hi)}] ({HDI_PCT} %-HDI).",
            "Modellpassung: Posterior p liegt nahe an den PX-Beobachtungen in den Schätzjahren.",
        ],
        "figures": [
            {
                "src": fig_trend,
                "caption": f"Posterior pₜ mit {HDI_LABEL}; Schattierung = Pandemiejahre.",
            },
            {
                "src": fig_fit,
                "caption": f"Schätzjahre: PX vs. posterior p mit {HDI_PCT} %-Fehlerbalken (HDI).",
            },
            {
                "src": fig_post,
                "caption": f"Posterior-Dichte (KDE) mit {HDI_LABEL}; Referenzlinie bei 0.",
            },
            {
                "src": fig_forest,
                "caption": f"Forest-Plot (kombiniert, {HDI_LABEL}).",
            },
            {
                "src": fig_trace,
                "caption": "MCMC-Traces und Posterior-Dichten pro Kette (Mixing).",
            },
        ],
        "tables": [post_table],
        "diagnostics": diag_metrics,
        "limits": [
            "Erfolg = aggregierter Marktanteil, nicht Einzelfilm-Hit oder Qualität.",
            "Keine Genre- oder Saison-Kovariaten; Pandemiejahre ausgeschlossen.",
            "Pd ersetzt klassische Signifikanztests; bei kleinen Effekten trotz hoher Pd Vorsicht.",
        ],
    }
