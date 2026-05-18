from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np
from scipy import stats

from .bayes_utils import HDI_LABEL, HDI_PCT, HDI_PROB, hdi_bounds, hdi_per_column
from .plots import PALETTE, finalize_figure


def plot_trend_with_hdi(
    years: np.ndarray,
    p_draws: np.ndarray,
    observed_years,
    observed_pct,
    *,
    covid_years: tuple[int, ...] = (2020, 2021),
) -> plt.Figure:
    """Posterior pₜ: Mittelwert, 95 %-HDI-Band, Beobachtungen."""
    p_lo, p_hi = hdi_per_column(p_draws)
    p_mean = p_draws.mean(axis=0)
    pct = 100.0

    fig, ax = plt.subplots(figsize=(9.5, 5))
    ax.fill_between(
        years,
        p_lo * pct,
        p_hi * pct,
        color=PALETTE["accent"],
        alpha=0.28,
        label=f"{HDI_PCT} %-HDI",
    )
    ax.plot(years, p_mean * pct, color=PALETTE["accent"], linewidth=2.2, label="Posterior-Mittel")
    ax.scatter(
        observed_years,
        observed_pct,
        color=PALETTE["ink"],
        s=52,
        zorder=4,
        label="Beobachtet (PX)",
    )
    for y in covid_years:
        ax.axvspan(y - 0.5, y + 0.5, color=PALETTE["sand"], alpha=0.5, zorder=0)
    ax.set_xlabel("Jahr")
    ax.set_ylabel("Anteil CH an Kinobesuchen (%)")
    ax.set_title(f"Posterior pₜ mit {HDI_LABEL}")
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    finalize_figure(fig)
    return fig


def plot_fit_vs_observed(
    fit_years: np.ndarray,
    observed_pct: np.ndarray,
    p_draws_fit: np.ndarray,
) -> plt.Figure:
    """Modell vs. Daten in Schätzjahren (95 %-HDI als Fehlerbalken)."""
    p_lo, p_hi = hdi_per_column(p_draws_fit)
    p_mean = p_draws_fit.mean(axis=0) * 100.0
    yerr = np.vstack([p_mean - p_lo * 100, p_hi * 100 - p_mean])

    fig, ax = plt.subplots(figsize=(9, 4.5))
    ax.errorbar(
        fit_years,
        p_mean,
        yerr=yerr,
        fmt="s",
        color=PALETTE["accent"],
        ecolor=PALETTE["accent"],
        elinewidth=2,
        capsize=4,
        capthick=1.5,
        markersize=7,
        label=f"Posterior p ({HDI_PCT} %-HDI)",
        zorder=3,
    )
    ax.scatter(
        fit_years,
        observed_pct,
        color=PALETTE["ink"],
        s=60,
        zorder=4,
        label="Beobachtet (PX)",
    )
    ax.set_xlabel("Jahr")
    ax.set_ylabel("Anteil CH an Kinobesuchen (%)")
    ax.set_title("Modellpassung: beobachtet vs. posterior p")
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    finalize_figure(fig)
    return fig


def _plot_posterior_kde(ax, samples: np.ndarray, *, title: str, xlabel: str) -> None:
    samples = np.asarray(samples).flatten()
    lo, hi = hdi_bounds(samples)
    mean = float(samples.mean())
    xs = np.linspace(samples.min(), samples.max(), 300)
    kde = stats.gaussian_kde(samples)
    ys = kde(xs)

    ax.fill_between(xs, 0, ys, color=PALETTE["accent"], alpha=0.2)
    mask = (xs >= lo) & (xs <= hi)
    ax.fill_between(
        xs[mask],
        0,
        ys[mask],
        color=PALETTE["accent"],
        alpha=0.55,
        label=f"{HDI_PCT} %-HDI",
    )
    ax.plot(xs, ys, color=PALETTE["accent"], linewidth=1.8)
    ax.axvline(mean, color=PALETTE["ink"], linewidth=1.5, label="Mittelwert")
    ax.axvline(0, color=PALETTE["muted"], linestyle="--", linewidth=1, label="0")
    ax.axvline(lo, color="#5c7a8a", linestyle=":", linewidth=1.3)
    ax.axvline(hi, color="#5c7a8a", linestyle=":", linewidth=1.3)
    ax.set_title(title)
    ax.set_xlabel(xlabel)
    ax.set_ylabel("Posterior-Dichte")
    ax.legend(frameon=False, fontsize=8, loc="upper right")


def plot_posterior_parameters(
    alpha_s: np.ndarray,
    beta_s: np.ndarray,
) -> plt.Figure:
    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    _plot_posterior_kde(axes[0], alpha_s, title="Posterior: α", xlabel="Intercept (logit-Skala)")
    _plot_posterior_kde(axes[1], beta_s, title="Posterior: β", xlabel="Trend pro Jahr (logit-Skala)")
    fig.suptitle(HDI_LABEL, y=1.02, fontweight="bold", fontsize=12)
    finalize_figure(fig)
    return fig


def plot_forest_parameters(
    alpha_s: np.ndarray,
    beta_s: np.ndarray,
) -> plt.Figure:
    params = [
        ("α", "Intercept", alpha_s),
        ("β", "Trend / Jahr", beta_s),
    ]
    y_pos = np.arange(len(params))
    means, los, his = [], [], []
    for _, _, s in params:
        means.append(float(s.mean()))
        lo, hi = hdi_bounds(s)
        los.append(lo)
        his.append(hi)

    fig, ax = plt.subplots(figsize=(8.5, 3.4))
    ax.hlines(y_pos, los, his, color=PALETTE["accent"], linewidth=4, alpha=0.45, label=f"{HDI_PCT} %-HDI")
    ax.scatter(means, y_pos, color=PALETTE["accent"], s=70, zorder=3, label="Posterior-Mittel")
    ax.axvline(0, color=PALETTE["ink"], linestyle="--", linewidth=1)
    for i, (lo, hi, m) in enumerate(zip(los, his, means)):
        ax.text(hi, y_pos[i] + 0.12, f"[{lo:.3f}, {hi:.3f}]", fontsize=8, color=PALETTE["muted"])
    ax.set_yticks(y_pos, [f"{a} ({b})" for a, b, _ in params])
    ax.set_xlabel("Parameterwert (logit-Skala)")
    ax.set_ylabel("Parameter")
    ax.set_title(f"Forest-Plot: {HDI_LABEL}")
    ax.legend(frameon=False, loc="lower right", fontsize=8)
    finalize_figure(fig)
    return fig


def plot_mcmc_trace(idata, var_names: list[str]) -> plt.Figure:
    """Trace pro Kette + marginaler KDE (kompakt)."""
    n = len(var_names)
    fig, axes = plt.subplots(n, 2, figsize=(9, 2.8 * n), squeeze=False)
    post = idata.posterior

    for row, name in enumerate(var_names):
        vals = post[name].values  # (chain, draw)
        ax_trace, ax_dens = axes[row, 0], axes[row, 1]
        for c in range(vals.shape[0]):
            ax_trace.plot(vals[c], alpha=0.55, linewidth=0.6, color=PALETTE["accent"])
        ax_trace.set_ylabel(name)
        ax_trace.set_xlabel("Draw")
        if row == 0:
            ax_trace.set_title("MCMC-Trace")

        flat = vals.flatten()
        _plot_posterior_kde(ax_dens, flat, title=f"Posterior: {name}", xlabel="Wert (logit)")
        if row == 0:
            ax_dens.set_title("Posterior (KDE)")

    fig.suptitle("MCMC: Mixing und Posterior", y=1.01, fontweight="bold", fontsize=12)
    finalize_figure(fig, bottom=0.1)
    return fig
