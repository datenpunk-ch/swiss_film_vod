from __future__ import annotations

import numpy as np
import pymc as pm

from ..bayes_common import HAS_PYMC, analysis_result, fallback_analysis, mcmc_block, sample_model
from ..bayes_plots import plot_forecast, plot_forest_list, plot_mcmc_trace
from ..bayes_utils import HDI_LABEL, extract_mcmc_diagnostics, hdi_bounds, posterior_row, posterior_table_rows
from ..data import COVID_YEARS, CinemaContext, save_figure
from ..plots import apply_style, pct_de

FORECAST_YEARS = np.array([2026, 2027, 2028])

MODEL = {
    "title": "Trendmodell mit Posterior-Prognose",
    "likelihood": "yₜ ~ Binomial(Nₜ, pₜ) für Schätzjahre",
    "link": "logit(pₜ) = α + β · (Jahr − Jahr̄)",
    "priors": ["α ~ Normal(0, 1,5), β ~ Normal(0, 0,2)"],
    "notes": f"Prognose für {', '.join(str(int(y)) for y in FORECAST_YEARS)} aus posterior pₜ (nicht Beobachtung).",
}

VARIABLES = [
    {"symbol": "pₜ", "name": "CH-Anteil", "description": "Latenter Besuchsanteil; extrapoliert für Zukunftsjahre."},
    {"symbol": "β", "name": "Trend", "description": "Treibt Prognose auf logit-Skala."},
]


def run(ctx: CinemaContext) -> dict:
    if not HAS_PYMC:
        return fallback_analysis(id="ch_forecast_bayes")
    return _run(ctx)


def _run(ctx: CinemaContext) -> dict:
    apply_style()
    df = ctx.px_yearly.sort_values("year")
    fit_df = df[~df["is_covid"]].copy()
    years = fit_df["year"].values
    year_mean = float(years.mean())
    year_c = years - year_mean
    ch = fit_df["ch_admissions"].values.astype(float)
    total = fit_df["market_admissions"].values.astype(float)

    with pm.Model() as model:
        alpha = pm.Normal("alpha", 0, 1.5)
        beta = pm.Normal("beta", 0, 0.2)
        logit_p = alpha + beta * year_c
        p = pm.Deterministic("p", pm.math.invlogit(logit_p))
        pm.Binomial("ch_adm", n=total, p=p, observed=ch)
        idata = sample_model(model)

    post = idata.posterior
    alpha_s = post["alpha"].values.flatten()
    beta_s = post["beta"].values.flatten()
    row = posterior_row("β", "Trend pro Jahr", beta_s, pd_positive=True)
    table = posterior_table_rows([row])
    diag = extract_mcmc_diagnostics(idata, ["alpha", "beta"])

    logit_hist = alpha_s[:, None] + beta_s[:, None] * year_c[None, :]
    p_hist = 1 / (1 + np.exp(-logit_hist))

    year_c_fut = FORECAST_YEARS - year_mean
    logit_fut = alpha_s[:, None] + beta_s[:, None] * year_c_fut[None, :]
    p_fut = 1 / (1 + np.exp(-logit_fut))

    fig1 = save_figure(
        ctx,
        "05_forecast.png",
        plot_forecast(
            years,
            p_hist,
            fit_df["ch_share_admissions"].values * 100,
            FORECAST_YEARS,
            p_fut,
        ),
    )
    fig2 = save_figure(ctx, "05_forecast_forest.png", plot_forest_list([("β", "Trend", beta_s)]))
    fig3 = save_figure(ctx, "05_forecast_trace.png", plot_mcmc_trace(idata, ["alpha", "beta"]))

    return analysis_result(
        id="ch_forecast_bayes",
        figures=[
            {"src": fig1, "caption": f"Schätzung + Prognose ({HDI_LABEL}, grau)."},
            {"src": fig2, "caption": "Forest-Plot Trend β."},
            {"src": fig3, "caption": "MCMC-Trace."},
        ],
        tables=[table],
        diagnostics=diag,
        mcmc=mcmc_block(fit_years=[int(y) for y in years], year_center=year_mean),
    )
