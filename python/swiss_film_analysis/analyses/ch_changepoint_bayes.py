from __future__ import annotations

import numpy as np
import pymc as pm

from ..bayes_common import (
    CHANGEPOINT_MCMC_KWARGS,
    HAS_PYMC,
    analysis_result,
    fallback_analysis,
    mcmc_block,
    sample_model,
)
from ..bayes_plots import plot_changepoint, plot_forest_list, plot_mcmc_trace
from ..bayes_utils import HDI_LABEL, extract_mcmc_diagnostics, posterior_row, posterior_table_rows
from ..data import COVID_YEARS, CinemaContext, save_figure
from ..plots import apply_style, pct_de

BREAK_YEAR = 2022

MODEL = {
    "title": "Change-Point-Modell für den CH-Besuchsanteil",
    "likelihood": "yₜ ~ Binomial(Nₜ, pₜ)",
    "link": "logit(pₜ) = α + β₁·(Jahr−Jahr̄) + β₂·(Jahr−Jahr̄)·𝟙[Jahr ≥ τ]",
    "priors": [
        "α, β₁, β₂ ~ Normal(0, schwach informativ)",
        f"τ = {BREAK_YEAR} (Übergang Post-Pandemie / Erholung)",
    ],
    "notes": f"Zwei Phasen: Trend vor und zusätzliche Änderung ab τ. {HDI_LABEL}.",
}

VARIABLES = [
    {"symbol": "τ", "name": "Break-Jahr", "description": "Jahr des Strukturbruchs (fixiert)."},
    {"symbol": "β₁", "name": "Trend Phase 1", "description": "logit-Änderung pro Jahr vor τ."},
    {"symbol": "β₂", "name": "Trend-Sprung ab τ", "description": "Zusätzliche logit-Änderung pro Jahr nach τ."},
]


def run(ctx: CinemaContext) -> dict:
    if not HAS_PYMC:
        return fallback_analysis(id="ch_changepoint_bayes")
    return _run(ctx)


def _run(ctx: CinemaContext) -> dict:
    apply_style()
    df = ctx.px_yearly.sort_values("year")
    fit_df = df[~df["is_covid"]].copy()
    years = fit_df["year"].values
    year_mean = float(years.mean())
    year_c = years - year_mean
    post = (years >= BREAK_YEAR).astype(float)
    ch = fit_df["ch_admissions"].values.astype(float)
    total = fit_df["market_admissions"].values.astype(float)

    with pm.Model() as model:
        alpha = pm.Normal("alpha", 0, 1.5)
        beta1 = pm.Normal("beta1", 0, 0.2)
        beta2 = pm.Normal("beta2", 0, 0.2)
        logit_p = alpha + beta1 * year_c + beta2 * (year_c * post)
        p = pm.Deterministic("p", pm.math.invlogit(logit_p))
        pm.Binomial("ch_adm", n=total, p=p, observed=ch)
        idata = sample_model(model, **CHANGEPOINT_MCMC_KWARGS)

    post_s = idata.posterior
    b1 = post_s["beta1"].values.flatten()
    b2 = post_s["beta2"].values.flatten()
    rows = [
        posterior_row("β₁", "Trend vor/nach τ (Basis)", b1, pd_positive=True),
        posterior_row("β₂", f"Zusatz-Trend ab {BREAK_YEAR}", b2, pd_positive=True),
    ]
    table = posterior_table_rows(rows)
    diag = extract_mcmc_diagnostics(idata, ["alpha", "beta1", "beta2"])

    all_years = df["year"].values
    year_c_all = all_years - year_mean
    post_all = (all_years >= BREAK_YEAR).astype(float)
    alpha_s = post_s["alpha"].values.flatten()
    b1s = post_s["beta1"].values.flatten()
    b2s = post_s["beta2"].values.flatten()
    logit = (
        alpha_s[:, None]
        + b1s[:, None] * year_c_all[None, :]
        + b2s[:, None] * (year_c_all * post_all)[None, :]
    )
    p_draws = 1 / (1 + np.exp(-logit))

    fig1 = save_figure(
        ctx,
        "02_changepoint.png",
        plot_changepoint(
            all_years,
            p_draws,
            df["ch_share_admissions"].values * 100,
            break_year=BREAK_YEAR,
        ),
    )
    fig2 = save_figure(ctx, "02_changepoint_forest.png", plot_forest_list([("β₁", "Basis-Trend", b1), ("β₂", "Sprung ab τ", b2)]))
    fig3 = save_figure(ctx, "02_changepoint_trace.png", plot_mcmc_trace(idata, ["beta1", "beta2"]))

    return analysis_result(
        id="ch_changepoint_bayes",
        figures=[
            {"src": fig1, "caption": f"CH-Anteil mit Change-Point bei {BREAK_YEAR} ({HDI_LABEL})."},
            {"src": fig2, "caption": "Forest-Plot β₁ und β₂."},
            {"src": fig3, "caption": "MCMC-Trace."},
        ],
        tables=[table],
        diagnostics=diag,
        mcmc=mcmc_block(
            analysis_id="ch_changepoint_bayes",
            fit_years=[int(y) for y in years],
            year_center=year_mean,
            extra={"break_year": BREAK_YEAR},
        ),
    )
