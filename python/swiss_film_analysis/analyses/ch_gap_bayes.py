from __future__ import annotations

import numpy as np
import pymc as pm

from ..bayes_common import HAS_PYMC, analysis_result, fallback_analysis, mcmc_block, sample_model
from ..bayes_chart_export import export_gap_forecast
from ..bayes_plots import plot_forest_list, plot_gap_forecast, plot_gap_trend, plot_mcmc_trace
from ..bayes_utils import (
    HDI_PCT,
    extract_mcmc_diagnostics,
    fmt_num,
    forecast_half_year_times,
    format_time_period,
    hdi_bounds,
    posterior_row,
    posterior_table_rows,
    prob_pct,
)
from ..data import COVID_YEARS, CinemaContext, save_figure
from ..plots import apply_style, pp_de

FORECAST_YEARS = np.array([2026, 2027, 2028, 2029, 2030])
HORIZON_END = int(FORECAST_YEARS[-1])

MODEL = {
    "title": "Trendmodell für die Angebot–Nachfrage-Lücke",
    "likelihood": "Lücke_t ~ Normal(μ_t, σ)",
    "link": "μ_t = α + β · (Jahr − Jahr̄)",
    "priors": ["α ~ Normal(0, 5), β ~ Normal(0, 1), σ ~ HalfNormal(3)"],
    "notes": (
        "Lücke = Angebotsanteil CH − Besuchsanteil CH in Prozentpunkten (Differenz von Prozentwerten). "
        "Prognose: lineare Extrapolation μ_t; P(Lücke ≤ 0) und Jahr der Null-Kreuzung aus Posterior."
    ),
}

VARIABLES = [
    {
        "symbol": "Lücke_t",
        "name": "Programm-Lücke",
        "description": "Anteil CH-Filme minus Anteil CH-Besuche (Prozentpunkte, nicht % Wachstum).",
    },
    {"symbol": "β", "name": "Trend", "description": "Änderung der Lücke pro Jahr (negativ → Annäherung)."},
]

WARNINGS = [
    "Prognose = linearer Trend — kein garantiertes Schliessen; Trend kann abflachen.",
    "Lücke in Prozentpunkten (pp): Differenz zweier Anteile — nicht mit «%» Relativänderung verwechseln.",
    "Negative Lücke möglich (Publikum > Programm); Modell erlaubt das, Interpretation dann «Überholung».",
    "Nur Jahresaggregate; Programm- und Besuchsanteil können sich unabhängig bewegen.",
    f"Kreuzungsjahr T* nur sinnvoll bei β < 0; sonst keine Null-Kreuzung im Modell.",
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


def _crossing_year(alpha_s: np.ndarray, beta_s: np.ndarray, year_mean: float) -> np.ndarray:
    """Jahr, in dem μ_t = 0 (kontinuierlich), nur wo β < 0."""
    t_star = np.full(alpha_s.shape, np.nan, dtype=float)
    neg = beta_s < 0
    t_star[neg] = year_mean - alpha_s[neg] / beta_s[neg]
    return t_star


def _forecast_table(gap_fut: np.ndarray, years: np.ndarray) -> dict:
    rows = []
    for j, y in enumerate(years):
        g = gap_fut[:, j]
        lo, hi = hdi_bounds(g)
        p_close = float(np.mean(g <= 0))
        rows.append(
            [
                format_time_period(float(y)),
                pp_de(float(np.mean(g)), decimals=1),
                f"{pp_de(lo, decimals=1)} – {pp_de(hi, decimals=1)}",
                prob_pct(p_close),
            ]
        )
    return {
        "caption": f"Prognose Lücke bis {HORIZON_END} (halbjährlich, lineare Extrapolation)",
        "headers": [
            "Periode",
            "Median Lücke",
            f"{95} %-HDI (höchst. Dichtheitsintervall)",
            "Wahrscheinlichkeit: Lücke ausgeglichen",
        ],
        "rows": rows,
    }


def _crossing_table(t_star: np.ndarray, beta_s: np.ndarray, *, last_obs_year: int) -> dict:
    future = t_star[np.isfinite(t_star) & (t_star > last_obs_year) & (t_star < 2045)]
    if future.size == 0:
        return {
            "caption": "Null-Kreuzung (Lücke = 0)",
            "headers": ["Grösse", "Wert"],
            "rows": [["T* (Median)", "—"], ["P(T* ≤ 2030)", "≈ 0 %"]],
        }
    lo, hi = hdi_bounds(future)
    med = float(np.median(future))
    p_by_2030 = float(np.mean(future <= HORIZON_END))
    return {
        "caption": "Null-Kreuzung der Programm-Lücke (kontinuierlich, μ_t = 0)",
        "headers": ["Grösse", "Wert"],
        "rows": [
            ["T* (Median)", f"{med:.1f}".replace(".", ",")],
            [f"T* ({95} %-HDI, höchst. Dichtheitsintervall)", f"{lo:.1f} – {hi:.1f}".replace(".", ",")],
            [f"Wahrscheinlichkeit Kreuzung bis {HORIZON_END}", prob_pct(p_by_2030)],
            ["Wahrscheinlichkeit: Trend sinkt", prob_pct(float(np.mean(beta_s < 0)))],
        ],
    }


def _warning_metrics(
    t_star: np.ndarray,
    gap_fut: np.ndarray,
    *,
    last_gap: float,
) -> list[dict]:
    future_cross = t_star[np.isfinite(t_star) & (t_star > 2025)]
    p_close_2030 = float(np.mean(gap_fut[:, -1] <= 0)) if gap_fut.size else 0.0
    items = [
        {
            "label": f"Chance: Lücke im Jahr {HORIZON_END} ausgeglichen",
            "value": prob_pct(p_close_2030),
            "note": "Nicht dasselbe wie das Kreuzungsjahr auf der Grafik",
            "ok": None,
        },
    ]
    if future_cross.size:
        items.append(
            {
                "label": "Median T* (Kreuzung)",
                "value": f"{float(np.median(future_cross)):.1f}".replace(".", ","),
                "note": f"Kreuzung bis {HORIZON_END}: {prob_pct(float(np.mean(future_cross <= HORIZON_END)))}",
                "ok": None,
            }
        )
    for w in WARNINGS:
        items.append({"label": "Hinweis", "value": "—", "note": w, "ok": False})
    return items


def _run(ctx: CinemaContext) -> dict:
    apply_style()
    df = ctx.px_yearly.sort_values("year")
    fit_df = df[~df["is_covid"]].copy()
    years = fit_df["year"].values.astype(float)
    year_mean = float(years.mean())
    year_c = years - year_mean
    gap = (fit_df["ch_share_films"] - fit_df["ch_share_admissions"]).values * 100
    last_obs_year = int(fit_df["year"].max())
    last_gap = float(gap[-1])

    with pm.Model() as model:
        alpha = pm.Normal("alpha", 0, 5)
        beta = pm.Normal("beta", 0, 1)
        sigma = pm.HalfNormal("sigma", 3)
        mu = alpha + beta * year_c
        pm.Normal("gap", mu=mu, sigma=sigma, observed=gap)
        idata = sample_model(model)

    post = idata.posterior
    beta_s = post["beta"].values.flatten()
    alpha_s = post["alpha"].values.flatten()
    row = posterior_row("β", "Trend Lücke (Pp./Jahr)", beta_s, pd_positive=False)
    table = posterior_table_rows([row])
    diag = extract_mcmc_diagnostics(idata, ["alpha", "beta", "sigma"])

    gap_draws = alpha_s[:, None] + beta_s[:, None] * year_c[None, :]
    forecast_times = forecast_half_year_times(last_obs_year, end_year=HORIZON_END)
    year_c_f = forecast_times - year_mean
    gap_fut = alpha_s[:, None] + beta_s[:, None] * year_c_f[None, :]
    t_star = _crossing_year(alpha_s, beta_s, year_mean)

    all_years = df["year"].values.astype(float)
    all_gap = (df["ch_share_films"] - df["ch_share_admissions"]).values * 100
    fig1 = save_figure(
        ctx, "03_gap_trend.png", plot_gap_trend(years, gap_draws, gap, all_years=all_years, all_observed_gap=all_gap)
    )
    fig2 = save_figure(ctx, "03_gap_forest.png", plot_forest_list([("β", "Trend", beta_s)]))
    fig3 = save_figure(ctx, "03_gap_trace.png", plot_mcmc_trace(idata, ["beta"]))
    fig4 = save_figure(
        ctx,
        "03_gap_forecast.png",
        plot_gap_forecast(
            years,
            gap_draws,
            gap,
            forecast_times,
            gap_fut,
            t_star,
            last_obs_year=last_obs_year,
        ),
    )

    forecast_table = _forecast_table(gap_fut, forecast_times)
    crossing_table = _crossing_table(t_star, beta_s, last_obs_year=last_obs_year)
    metrics = _warning_metrics(t_star, gap_fut, last_gap=last_gap)

    charts = export_gap_forecast(
        years,
        gap_draws,
        gap,
        forecast_times,
        gap_fut,
        all_years=all_years,
        all_observed_gap=all_gap,
        t_star_draws=t_star,
        last_obs_year=last_obs_year,
    )

    return analysis_result(
        id="ch_gap_bayes",
        figures=[
            {"src": fig1, "caption": "Programm-Lücke in Prozentpunkten (Angebot minus Besuche)."},
            {"src": fig2, "caption": "Forest-Plot Trend β."},
            {"src": fig3, "caption": "MCMC-Trace β."},
            {
                "src": fig4,
                "caption": (
                    f"Prognose der Programm-Lücke bis {HORIZON_END}; markiertes Kreuzungsjahr = Median T* "
                    f"(Programm- und Besuchsanteil gleich). Lineare Extrapolation — Aussagekraft begrenzt."
                ),
            },
        ],
        tables=[table, forecast_table, crossing_table],
        diagnostics=diag,
        metrics=metrics,
        mcmc=mcmc_block(
            fit_years=[int(y) for y in years],
            year_center=year_mean,
            extra={"forecast_times": [float(y) for y in forecast_times]},
        ),
        charts=charts,
    )
