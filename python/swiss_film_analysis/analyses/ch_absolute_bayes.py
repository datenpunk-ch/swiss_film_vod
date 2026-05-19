from __future__ import annotations

import numpy as np
import pymc as pm

from ..bayes_common import HAS_PYMC, analysis_result, fallback_analysis, mcmc_block, sample_model
from ..bayes_plots import (
    plot_absolute_counts,
    plot_forest_list,
    plot_market_vs_ch,
    plot_mcmc_trace,
    plot_rate_from_offset,
)
from ..bayes_utils import HDI_LABEL, extract_mcmc_diagnostics, posterior_row, posterior_table_rows
from ..data import COVID_YEARS, CinemaContext, save_figure
from ..plots import apply_style

MODEL = {
    "title": "Poisson-Modell mit Markt-Offset (absolute CH-Besuche)",
    "likelihood": "yₜ ~ Poisson(μₜ)",
    "link": "log(μₜ) = log(Nₜ) + α + β·(Jahr − Jahr̄)  ⟺  μₜ = Nₜ · exp(α + β·(Jahr − Jahr̄))",
    "priors": ["α ~ Normal(-3, 1), β ~ Normal(0, 0,2)"],
    "notes": (
        "Offset log(Nₜ): Marktgrösse skaliert die erwarteten CH-Besuche; "
        "β ist Trend der CH-Rate (Anteil) bei gegebenem Markt. "
        f"{HDI_LABEL}."
    ),
}


def run(ctx: CinemaContext) -> dict:
    if not HAS_PYMC:
        return fallback_analysis(id="ch_absolute_bayes")
    return _run(ctx)


def _run(ctx: CinemaContext) -> dict:
    apply_style()
    df = ctx.px_yearly.sort_values("year")
    fit_df = df[~df["is_covid"]].copy()
    years = fit_df["year"].values.astype(float)
    year_mean = float(years.mean())
    year_c = years - year_mean
    ch = fit_df["ch_admissions"].values.astype(float)
    market = fit_df["market_admissions"].values.astype(float)
    log_market = np.log(market)

    log_rate_prior = float(np.log((ch / market).mean()))
    with pm.Model() as model:
        alpha = pm.Normal("alpha", log_rate_prior, 0.35)
        beta = pm.Normal("beta", 0, 0.15)
        log_rate = alpha + beta * year_c
        log_mu = log_market + log_rate
        mu = pm.Deterministic("mu", pm.math.exp(log_mu))
        pm.Poisson("ch_adm", mu=mu, observed=ch)
        idata = sample_model(model)

    post = idata.posterior
    alpha_s = post["alpha"].values.flatten()
    beta_s = post["beta"].values.flatten()
    mu_s = post["mu"].values.reshape(-1, len(years))

    rows = [
        posterior_row("β", "Trend log-Rate / Jahr", beta_s, pd_positive=True),
        posterior_row("α", "Intercept log-Rate", alpha_s, pd_positive=True),
    ]
    table = posterior_table_rows(rows)
    diag = extract_mcmc_diagnostics(idata, ["alpha", "beta"])

    all_years = df["year"].values.astype(float)
    year_c_all = all_years - year_mean
    log_rate_all = alpha_s[:, None] + beta_s[:, None] * year_c_all[None, :]
    rate_draws = np.exp(log_rate_all)

    all_market = df["market_admissions"].values.astype(float)
    mu_all = all_market[None, :] * rate_draws

    fig1 = save_figure(
        ctx,
        "07_absolute_ch.png",
        plot_absolute_counts(all_years, mu_all, df["ch_admissions"].values.astype(float)),
    )
    fig2 = save_figure(
        ctx,
        "07_absolute_market_ch.png",
        plot_market_vs_ch(
            all_years,
            all_market,
            df["ch_admissions"].values.astype(float),
            mu_all,
        ),
    )
    fig3 = save_figure(
        ctx,
        "07_absolute_rate.png",
        plot_rate_from_offset(all_years, rate_draws, df["ch_share_admissions"].values),
    )
    fig4 = save_figure(ctx, "07_absolute_forest.png", plot_forest_list([("β", "Trend log-Rate", beta_s)]))
    fig5 = save_figure(ctx, "07_absolute_trace.png", plot_mcmc_trace(idata, ["alpha", "beta"]))

    return analysis_result(
        id="ch_absolute_bayes",
        figures=[
            {"src": fig1, "caption": "Schweizer Kinobesuche über die Jahre (Modell mit Schätzbereich)."},
            {"src": fig2, "caption": "Kinobesuche in Millionen — Gesamtmarkt und Schweizer Film."},
            {"src": fig3, "caption": "CH-Anteil, abgeleitet aus dem Offset-Modell."},
            {"src": fig4, "caption": "Forest-Plot Trend β (log-Rate)."},
            {"src": fig5, "caption": "MCMC-Trace α, β."},
        ],
        tables=[table],
        diagnostics=diag,
        mcmc=mcmc_block(fit_years=[int(y) for y in years], year_center=year_mean),
    )
