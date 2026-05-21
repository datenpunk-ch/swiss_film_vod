from __future__ import annotations

import numpy as np
import pymc as pm

from ..bayes_common import (
    COUNTRY_IDS,
    COUNTRY_LABELS,
    HAS_PYMC,
    analysis_result,
    fallback_analysis,
    mcmc_block,
    sample_model,
)
from ..bayes_chart_export import export_country_shares
from ..bayes_plots import plot_country_trends, plot_forest_list, plot_mcmc_trace
from ..bayes_utils import (
    extract_mcmc_diagnostics,
    fmt_pp_trend,
    posterior_row,
    posterior_table_rows,
    pp_per_year_from_logit,
    prob_pct,
)
from ..data import COVID_YEARS, CinemaContext, save_figure
from ..plots import apply_style

MODEL = {
    "title": "Hierarchisches Binomialmodell nach Herkunftsland",
    "likelihood": "y_{c,t} ~ Binomial(N_t, p_{c,t})",
    "link": "logit(p_{c,t}) = α_c + β_c · (Jahr − Jahr̄)",
    "priors": [
        "α_c, β_c mit Hyperpriors (Partial Pooling über Kernländer)",
        "μ_α ~ Normal(0, 1), σ_α ~ HalfNormal(0,8)",
        "μ_β ~ Normal(0, 0,1), σ_β ~ HalfNormal(0,15)",
    ],
    "notes": (
        "Je Kernland: Besuche des Landes ÷ Gesamt-Kinobesuche. "
        f"Schätzjahre ohne {min(COVID_YEARS)}–{max(COVID_YEARS)}. "
        "Unabhängige Binomialen pro Land (vereinfacht; Anteile summieren nicht exakt zu 1)."
    ),
}


def run(ctx: CinemaContext) -> dict:
    if not HAS_PYMC or ctx.px_country_yearly.empty:
        return fallback_analysis(id="ch_countries_bayes")
    return _run(ctx)


def _run(ctx: CinemaContext) -> dict:
    apply_style()
    cdf = ctx.px_country_yearly[~ctx.px_country_yearly["is_covid"]].copy()
    if cdf.empty:
        return fallback_analysis(id="ch_countries_bayes")

    years = np.sort(cdf["year"].unique())
    year_mean = float(years.mean())
    n_countries = len(COUNTRY_IDS)
    country_idx = {c: i for i, c in enumerate(COUNTRY_IDS)}

    with pm.Model() as model:
        mu_alpha = pm.Normal("mu_alpha", 0, 1)
        sigma_alpha = pm.HalfNormal("sigma_alpha", 0.8)
        mu_beta = pm.Normal("mu_beta", 0, 0.1)
        sigma_beta = pm.HalfNormal("sigma_beta", 0.15)
        alpha = pm.Normal("alpha", mu=mu_alpha, sigma=sigma_alpha, shape=n_countries)
        beta = pm.Normal("beta", mu=mu_beta, sigma=sigma_beta, shape=n_countries)

        for cid in COUNTRY_IDS:
            sub = cdf[cdf["country"] == cid].sort_values("year")
            if sub.empty:
                continue
            yc = sub["year"].values - year_mean
            pm.Binomial(
                f"adm_{cid}",
                n=sub["market_admissions"].values.astype(float),
                p=pm.math.invlogit(alpha[country_idx[cid]] + beta[country_idx[cid]] * yc),
                observed=sub["admissions"].values.astype(float),
            )

        idata = sample_model(model)

    post = idata.posterior
    alpha_s = post["alpha"].values.reshape(-1, n_countries)
    beta_s = post["beta"].values.reshape(-1, n_countries)

    rows = []
    for i, cid in enumerate(COUNTRY_IDS):
        rows.append(
            posterior_row(
                f"β_{cid}",
                f"Trend {COUNTRY_LABELS[cid]}",
                beta_s[:, i],
                pd_positive=(cid == "ch"),
            )
        )
    post_table = posterior_table_rows(rows)
    diag = extract_mcmc_diagnostics(idata, ["mu_alpha", "mu_beta", "alpha", "beta"])

    full_cdf = ctx.px_country_yearly.sort_values(["country", "year"])
    p_draws: dict[str, np.ndarray] = {}
    observed: dict[str, np.ndarray] = {}
    observed_all: dict[str, dict[str, np.ndarray]] = {}
    for cid in COUNTRY_IDS:
        sub = cdf[cdf["country"] == cid].sort_values("year")
        if sub.empty:
            continue
        yc = sub["year"].values - year_mean
        i = country_idx[cid]
        logit = alpha_s[:, i][:, None] + beta_s[:, i][:, None] * yc[None, :]
        p_draws[cid] = 1 / (1 + np.exp(-logit))
        observed[cid] = sub["share_demand"].values
        sub_all = full_cdf[full_cdf["country"] == cid].sort_values("year")
        observed_all[cid] = {
            "years": sub_all["year"].values.astype(float),
            "value": sub_all["share_demand"].values.astype(float) * 100.0,
        }

    fig1 = save_figure(
        ctx,
        "08_countries_bayes_demand.png",
        plot_country_trends(
            years,
            p_draws,
            observed,
            labels=COUNTRY_LABELS,
            title="Top-Länder: Anteil an Kinobesuchen (Posterior)",
            ylabel="Anteil an Kinobesuchen (%)",
        ),
    )
    forest_params = [
        (f"β_{cid}", COUNTRY_LABELS[cid], beta_s[:, country_idx[cid]]) for cid in COUNTRY_IDS
    ]
    fig2 = save_figure(ctx, "08_countries_bayes_forest.png", plot_forest_list(forest_params))
    fig3 = save_figure(ctx, "08_countries_bayes_trace.png", plot_mcmc_trace(idata, ["mu_alpha", "mu_beta"]))

    ch_alpha = alpha_s[:, country_idx["ch"]]
    us_alpha = alpha_s[:, country_idx["us"]]
    ch_beta = beta_s[:, country_idx["ch"]]
    us_beta = beta_s[:, country_idx["us"]]
    ch_pp = pp_per_year_from_logit(ch_alpha, ch_beta)
    us_pp = pp_per_year_from_logit(us_alpha, us_beta)
    metrics = [
        {
            "label": "Trend",
            "value": fmt_pp_trend(ch_pp),
            "note": f"Wahrscheinlichkeit: {prob_pct((ch_pp > 0).mean())}",
            "country_id": "ch",
            "ok": True,
        },
        {
            "label": "Trend",
            "value": fmt_pp_trend(us_pp),
            "note": f"Wahrscheinlichkeit: {prob_pct((us_pp < 0).mean())}",
            "country_id": "us",
            "ok": True,
        },
    ]

    y0, y1 = int(years.min()), int(years.max())

    def share_at(cid: str, year: int) -> str:
        sub = cdf[(cdf["country"] == cid) & (cdf["year"] == year)]
        if sub.empty:
            return "—"
        return f"{float(sub['share_demand'].iloc[0]) * 100:.1f} %".replace(".", ",")

    summary_table = {
        "caption": f"Besuchsanteil Kernländer ({y0} vs. {y1}, beobachtet)",
        "headers": ["Land", str(y0), str(y1)],
        "rows": [[COUNTRY_LABELS[cid], share_at(cid, y0), share_at(cid, y1)] for cid in COUNTRY_IDS],
    }

    charts = export_country_shares(
        years, p_draws, observed, COUNTRY_LABELS, observed_all=observed_all
    )

    return analysis_result(
        id="ch_countries_bayes",
        figures=[
            {
                "src": fig1,
                "caption": "Posterior-Mittel und 95 %-HDI: Anteil je Kernland am Gesamtmarkt (Besuche).",
            },
            {"src": fig2, "caption": "Forest-Plot: Trend β je Land (logit-Skala)."},
            {"src": fig3, "caption": "MCMC-Trace Hyperpriors (Partial Pooling)."},
        ],
        tables=[post_table, summary_table],
        diagnostics=diag,
        metrics=metrics,
        mcmc=mcmc_block(fit_years=[int(y) for y in years], year_center=year_mean),
        charts=charts,
    )
