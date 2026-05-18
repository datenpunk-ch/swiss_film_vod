from __future__ import annotations

import numpy as np
import pymc as pm

from ..bayes_common import HAS_PYMC, analysis_result, fallback_analysis, mcmc_block, sample_model
from ..bayes_plots import plot_mcmc_trace, plot_weekly_profile
from ..bayes_utils import HDI_LABEL, HDI_PCT, extract_mcmc_diagnostics, hdi_per_column
from ..data import COVID_YEARS, SEASON_YEARS, CinemaContext, save_figure
from ..plots import apply_style, int_de

MODEL = {
    "title": "Wochenmodell mit Saison (Fourier) und Jahrestrend",
    "likelihood": "y_{w} ~ Binomial(N_{w}, p_{w})",
    "link": "logit(p) = α + β·Jahr + Σ γ sin/cos(2πk·Woche/52)",
    "priors": ["Schwach informative Normalen auf allen Koeffizienten"],
    "notes": f"P4-Wochen (adm), Jahre {SEASON_YEARS}, ohne 2020–2021. {HDI_LABEL}.",
}

VARIABLES = [
    {"symbol": "p_w", "name": "CH-Wochenanteil", "description": "Latenter CH-Anteil an Besuchen in Kinowoche w."},
    {"symbol": "γ", "name": "Saisonkoeffizienten", "description": "Fourier-Terme für jährliche Saisonalität."},
]


def run(ctx: CinemaContext) -> dict:
    if not HAS_PYMC or ctx.p4_weekly.empty:
        return fallback_analysis(id="ch_weekly_bayes")
    return _run(ctx)


def _run(ctx: CinemaContext) -> dict:
    apply_style()
    df = ctx.p4_weekly[(~ctx.p4_weekly["is_covid"]) & ctx.p4_weekly["year"].isin(SEASON_YEARS)].copy()
    week = df["week"].values.astype(float)
    year = df["year"].values.astype(float)
    year_mean = float(year.mean())
    year_c = year - year_mean
    w = 2 * np.pi * week / 52.0
    ch = df["ch_adm"].values.astype(float)
    total = df["market_adm"].values.astype(float)

    with pm.Model() as model:
        alpha = pm.Normal("alpha", 0, 1.5)
        beta_y = pm.Normal("beta_y", 0, 0.15)
        sin1 = pm.Normal("sin1", 0, 0.5)
        cos1 = pm.Normal("cos1", 0, 0.5)
        sin2 = pm.Normal("sin2", 0, 0.3)
        cos2 = pm.Normal("cos2", 0, 0.3)
        logit_p = (
            alpha
            + beta_y * year_c
            + sin1 * pm.math.sin(w)
            + cos1 * pm.math.cos(w)
            + sin2 * pm.math.sin(2 * w)
            + cos2 * pm.math.cos(2 * w)
        )
        p = pm.Deterministic("p", pm.math.invlogit(logit_p))
        pm.Binomial("ch", n=total, p=p, observed=ch)
        idata = sample_model(model)

    diag = extract_mcmc_diagnostics(idata, ["alpha", "beta_y", "sin1", "cos1"])

    post = idata.posterior
    alpha_s = post["alpha"].values.flatten()
    beta_s = post["beta_y"].values.flatten()
    sin1_s = post["sin1"].values.flatten()
    cos1_s = post["cos1"].values.flatten()
    sin2_s = post["sin2"].values.flatten()
    cos2_s = post["cos2"].values.flatten()

    weeks_grid = np.arange(1, 54)
    w_grid = 2 * np.pi * weeks_grid / 52.0
    year_ref = year_mean
    logit_grid = (
        alpha_s[:, None]
        + beta_s[:, None] * (year_ref - year_mean)
        + sin1_s[:, None] * np.sin(w_grid)[None, :]
        + cos1_s[:, None] * np.cos(w_grid)[None, :]
        + sin2_s[:, None] * np.sin(2 * w_grid)[None, :]
        + cos2_s[:, None] * np.cos(2 * w_grid)[None, :]
    )
    p_grid = 1 / (1 + np.exp(-logit_grid))
    p_lo, p_hi = hdi_per_column(p_grid)
    p_mean = p_grid.mean(axis=0)
    peak_w = int(weeks_grid[np.argmax(p_mean)])

    fig1 = save_figure(
        ctx,
        "04_weekly_season.png",
        plot_weekly_profile(weeks_grid, p_mean, p_lo, p_hi),
    )
    fig2 = save_figure(ctx, "04_weekly_trace.png", plot_mcmc_trace(idata, ["sin1", "cos1", "beta_y"]))

    return analysis_result(
        id="ch_weekly_bayes",
        figures=[
            {"src": fig1, "caption": f"Gemitteltes Saisonprofil CH-Anteil ({HDI_PCT} %-HDI)."},
            {"src": fig2, "caption": "MCMC-Trace Saison/Trend."},
        ],
        diagnostics=diag,
        mcmc=mcmc_block(fit_years=SEASON_YEARS, year_center=year_mean, extra={"n_weeks": int(len(df))}),
    )
