from __future__ import annotations

import numpy as np
import pymc as pm

from ..bayes_common import (
    GENRE_IDS,
    GENRE_LABELS,
    HAS_PYMC,
    analysis_result,
    fallback_analysis,
    mcmc_block,
    sample_model,
)
from ..bayes_plots import plot_forest_list, plot_genre_trends, plot_mcmc_trace
from ..bayes_utils import (
    HDI_LABEL,
    HDI_PCT,
    extract_mcmc_diagnostics,
    posterior_row,
    posterior_table_rows,
)
from ..data import COVID_YEARS, CinemaContext, save_figure
from ..plots import apply_style

MODEL = {
    "title": "Hierarchisches Binomialmodell nach Genre",
    "likelihood": "y_{g,t} ~ Binomial(N_{g,t}, p_{g,t})",
    "link": "logit(p_{g,t}) = α_g + β_g · (Jahr − Jahr̄)",
    "priors": [
        "α_g ~ Normal(μ_α, σ_α), β_g ~ Normal(μ_β, σ_β) mit Hyperpriors (Partial Pooling)",
        "μ_α ~ Normal(0, 1), σ_α ~ HalfNormal(0,8)",
        "μ_β ~ Normal(0, 0,1), σ_β ~ HalfNormal(0,15)",
    ],
    "notes": f"Je Genre (Fiktion, Dokumentar, Animation): CH-Anteil am Genre-Markt. {HDI_LABEL}.",
}

VARIABLES = [
    {"symbol": "p_{g,t}", "name": "CH-Anteil Genre", "description": "CH-Besuche im Genre g / Marktbesuche im Genre g."},
    {"symbol": "α_g", "name": "Intercept Genre", "description": "Basisniveau auf logit-Skala je Genre."},
    {"symbol": "β_g", "name": "Trend Genre", "description": "Jährliche Änderung des logit-Anteils je Genre."},
    {"symbol": "μ_α, μ_β", "name": "Hyperpriors", "description": "Gemeinsame Mittelwerte über Genres (Shrinkage)."},
]


def run(ctx: CinemaContext) -> dict:
    if not HAS_PYMC or ctx.px_genre_yearly.empty:
        return fallback_analysis(id="ch_genre_bayes")
    return _run(ctx)


def _run(ctx: CinemaContext) -> dict:
    apply_style()
    gdf = ctx.px_genre_yearly[~ctx.px_genre_yearly["is_covid"]].copy()
    years = np.sort(gdf["year"].unique())
    year_mean = float(years.mean())
    genre_idx = {g: i for i, g in enumerate(GENRE_IDS)}

    with pm.Model() as model:
        mu_alpha = pm.Normal("mu_alpha", 0, 1)
        sigma_alpha = pm.HalfNormal("sigma_alpha", 0.8)
        mu_beta = pm.Normal("mu_beta", 0, 0.1)
        sigma_beta = pm.HalfNormal("sigma_beta", 0.15)
        alpha = pm.Normal("alpha", mu=mu_alpha, sigma=sigma_alpha, shape=3)
        beta = pm.Normal("beta", mu=mu_beta, sigma=sigma_beta, shape=3)

        for gid in GENRE_IDS:
            sub = gdf[gdf["genre"] == gid].sort_values("year")
            yc = sub["year"].values - year_mean
            pm.Binomial(
                f"ch_{gid}",
                n=sub["market_admissions"].values.astype(float),
                p=pm.math.invlogit(alpha[genre_idx[gid]] + beta[genre_idx[gid]] * yc),
                observed=sub["ch_admissions"].values.astype(float),
            )

        idata = sample_model(model)

    post = idata.posterior
    alpha_s = post["alpha"].values.reshape(-1, 3)
    beta_s = post["beta"].values.reshape(-1, 3)

    rows = []
    for i, gid in enumerate(GENRE_IDS):
        rows.append(posterior_row(f"β_{gid}", f"Trend {GENRE_LABELS[gid]}", beta_s[:, i], pd_positive=True))
    post_table = posterior_table_rows(rows)
    diag = extract_mcmc_diagnostics(idata, ["mu_alpha", "mu_beta", "alpha", "beta"])

    p_draws_by_genre = {}
    observed = {}
    for gid in GENRE_IDS:
        sub = gdf[gdf["genre"] == gid].sort_values("year")
        yc = sub["year"].values - year_mean
        i = genre_idx[gid]
        logit = alpha_s[:, i][:, None] + beta_s[:, i][:, None] * yc[None, :]
        p_draws_by_genre[gid] = 1 / (1 + np.exp(-logit))
        observed[gid] = sub["ch_share"].values

    fig1 = save_figure(
        ctx,
        "01_genre_trend.png",
        plot_genre_trends(years, p_draws_by_genre, observed, labels=GENRE_LABELS),
    )
    forest_params = [
        (f"β_{gid}", GENRE_LABELS[gid], beta_s[:, genre_idx[gid]]) for gid in GENRE_IDS
    ]
    fig2 = save_figure(ctx, "01_genre_forest.png", plot_forest_list(forest_params))
    # forest for all betas - extend plot_forest to accept list
    fig3 = save_figure(ctx, "01_genre_trace.png", plot_mcmc_trace(idata, ["mu_alpha", "mu_beta"]))

    return analysis_result(
        id="ch_genre_bayes",
        figures=[
            {"src": fig1, "caption": "CH-Anteil je Genre über die Jahre."},
            {"src": fig2, "caption": "Forest-Plot β (Auszug Fiktion/Dokumentar)."},
            {"src": fig3, "caption": "MCMC-Trace Hyperpriors."},
        ],
        tables=[post_table],
        diagnostics=diag,
        mcmc=mcmc_block(fit_years=[int(y) for y in years], year_center=year_mean),
    )
