from __future__ import annotations

import numpy as np
import pymc as pm

from ..bayes_common import HAS_PYMC, analysis_result, fallback_analysis, mcmc_block, sample_model
from ..bayes_plots import plot_forest_list, plot_gap_trend, plot_mcmc_trace
from ..bayes_utils import HDI_LABEL, extract_mcmc_diagnostics, posterior_row, posterior_table_rows
from ..data import COVID_YEARS, CinemaContext, save_figure
from ..plots import apply_style

MODEL = {
    "title": "Trendmodell für die Angebot–Nachfrage-Lücke",
    "likelihood": "Lücke_t ~ Normal(μ_t, σ)",
    "link": "μ_t = α + β · (Jahr − Jahr̄)",
    "priors": ["α ~ Normal(0, 5), β ~ Normal(0, 1), σ ~ HalfNormal(3)"],
    "notes": "Lücke = Angebotsanteil CH − Besuchsanteil CH (Prozentpunkte). Schliesst sie sich?",
}

VARIABLES = [
    {"symbol": "Lücke_t", "name": "Programm-Lücke", "description": "Anteil CH-Filme minus Anteil CH-Besuche (pp)."},
    {"symbol": "β", "name": "Trend", "description": "Änderung der Lücke pro Jahr (negativ → Annäherung)."},
]


def run(ctx: CinemaContext) -> dict:
    if not HAS_PYMC:
        return fallback_analysis(
            id="ch_gap_bayes",
            title="Bayes: Angebot–Nachfrage-Lücke",
            question="Schliesst sich die Lücke zwischen Programm und Publikum?",
            model=MODEL,
            variables=VARIABLES,
        )
    return _run(ctx)


def _run(ctx: CinemaContext) -> dict:
    apply_style()
    df = ctx.px_yearly.sort_values("year")
    fit_df = df[~df["is_covid"]].copy()
    years = fit_df["year"].values.astype(float)
    year_mean = float(years.mean())
    year_c = years - year_mean
    gap = (fit_df["ch_share_films"] - fit_df["ch_share_admissions"]).values * 100

    with pm.Model() as model:
        alpha = pm.Normal("alpha", 0, 5)
        beta = pm.Normal("beta", 0, 1)
        sigma = pm.HalfNormal("sigma", 3)
        mu = alpha + beta * year_c
        pm.Normal("gap", mu=mu, sigma=sigma, observed=gap)
        idata = sample_model(model)

    post = idata.posterior
    beta_s = post["beta"].values.flatten()
    row = posterior_row("β", "Trend Lücke (pp/Jahr)", beta_s, pd_positive=False)
    table = posterior_table_rows([row])
    diag = extract_mcmc_diagnostics(idata, ["alpha", "beta", "sigma"])

    alpha_s = post["alpha"].values.flatten()
    gap_draws = alpha_s[:, None] + beta_s[:, None] * year_c[None, :]

    fig1 = save_figure(ctx, "03_gap_trend.png", plot_gap_trend(years, gap_draws, gap))
    fig2 = save_figure(ctx, "03_gap_forest.png", plot_forest_list([("β", "Trend", beta_s)]))
    fig3 = save_figure(ctx, "03_gap_trace.png", plot_mcmc_trace(idata, ["beta"]))

    return analysis_result(
        id="ch_gap_bayes",
        figures=[
            {"src": fig1, "caption": f"Posterior der Lücke ({HDI_LABEL})."},
            {"src": fig2, "caption": "Forest-Plot Trend β."},
            {"src": fig3, "caption": "MCMC-Trace β."},
        ],
        tables=[table],
        diagnostics=diag,
        mcmc=mcmc_block(fit_years=[int(y) for y in years], year_center=year_mean),
    )
