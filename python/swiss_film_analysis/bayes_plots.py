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


def plot_forest_list(params: list[tuple[str, str, np.ndarray]]) -> plt.Figure:
    """params: [(symbol, label, samples), ...]"""
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


def plot_forest_parameters(alpha_s: np.ndarray, beta_s: np.ndarray) -> plt.Figure:
    return plot_forest_list([("α", "Intercept", alpha_s), ("β", "Trend / Jahr", beta_s)])


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


GENRE_COLORS = {
    "fic": PALETTE["ink"],
    "doc": PALETTE["accent"],
    "ani": "#c4896e",
}


def plot_genre_trends(
    years: np.ndarray,
    p_draws_by_genre: dict[str, np.ndarray],
    observed: dict[str, np.ndarray],
    *,
    labels: dict[str, str] | None = None,
) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(9.5, 5))
    for gid, draws in p_draws_by_genre.items():
        lo, hi = hdi_per_column(draws)
        mean = draws.mean(axis=0) * 100
        color = GENRE_COLORS.get(gid, PALETTE["accent"])
        ax.fill_between(years, lo * 100, hi * 100, color=color, alpha=0.15)
        ax.plot(years, mean, color=color, linewidth=2, label=(labels or {}).get(gid, gid))
        if gid in observed:
            ax.scatter(years, observed[gid] * 100, color=color, s=40, zorder=3)
    ax.set_xlabel("Jahr")
    ax.set_ylabel("CH-Anteil am Genre-Markt (%)")
    ax.set_title(f"Posterior p nach Genre ({HDI_LABEL})")
    ax.legend(frameon=False, title="Genre")
    finalize_figure(fig)
    return fig


def plot_changepoint(
    years: np.ndarray,
    p_draws: np.ndarray,
    observed_pct: np.ndarray,
    *,
    break_year: float,
) -> plt.Figure:
    fig = plot_trend_with_hdi(years, p_draws, years, observed_pct)
    ax = fig.axes[0]
    ax.axvline(break_year, color=PALETTE["muted"], linestyle="--", linewidth=1.2, label=f"Break ≈ {int(break_year)}")
    ax.set_title(f"Change-Point: CH-Anteil ({HDI_LABEL})")
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    return fig


def plot_weekly_profile(
    weeks: np.ndarray,
    p_mean: np.ndarray,
    p_lo: np.ndarray,
    p_hi: np.ndarray,
) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(10, 4.5))
    ax.fill_between(weeks, p_lo * 100, p_hi * 100, color=PALETTE["accent"], alpha=0.28, label=f"{HDI_PCT} %-HDI")
    ax.plot(weeks, p_mean * 100, color=PALETTE["accent"], linewidth=2, label="Posterior-Mittel")
    ax.set_xlabel("Kinowoche")
    ax.set_ylabel("CH-Anteil an Wochenbesuchen (%)")
    ax.set_title(f"Kinosaison-Profil (modelliert, {HDI_LABEL})")
    ax.legend(frameon=False)
    finalize_figure(fig)
    return fig


def plot_gap_trend(
    years: np.ndarray,
    gap_draws: np.ndarray,
    observed_gap: np.ndarray,
) -> plt.Figure:
    lo, hi = hdi_per_column(gap_draws)
    mean = gap_draws.mean(axis=0)
    fig, ax = plt.subplots(figsize=(9, 4.5))
    ax.fill_between(years, lo, hi, color=PALETTE["accent"], alpha=0.28, label=f"{HDI_PCT} %-HDI")
    ax.plot(years, mean, color=PALETTE["accent"], linewidth=2, label="Posterior-Mittel")
    ax.scatter(years, observed_gap, color=PALETTE["ink"], s=50, zorder=3, label="Beobachtet (PX)")
    ax.axhline(0, color=PALETTE["muted"], linestyle="--", linewidth=1)
    ax.set_xlabel("Jahr")
    ax.set_ylabel("Lücke Angebot − Nachfrage (Prozentpunkte)")
    ax.set_title(f"Programm-Lücke CH ({HDI_LABEL})")
    ax.legend(frameon=False, loc="upper right")
    finalize_figure(fig)
    return fig


def plot_genre_mix_trends(
    years: np.ndarray,
    share_draws: dict[str, np.ndarray],
    observed: dict[str, np.ndarray],
    *,
    labels: dict[str, str],
    ylabel: str,
    title: str,
) -> plt.Figure:
    """Posterior Genre-Anteile (Mix) als Linien + Beobachtung."""
    fig, ax = plt.subplots(figsize=(9.5, 5))
    for gid, draws in share_draws.items():
        lo, hi = hdi_per_column(draws)
        mean = draws.mean(axis=0) * 100
        color = GENRE_COLORS.get(gid, PALETTE["accent"])
        ax.fill_between(years, lo * 100, hi * 100, color=color, alpha=0.12)
        ax.plot(years, mean, color=color, linewidth=2, label=labels.get(gid, gid))
        if gid in observed:
            ax.scatter(years, observed[gid] * 100, color=color, s=40, zorder=3)
    ax.set_xlabel("Jahr")
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.legend(frameon=False, title="Genre", loc="center left", bbox_to_anchor=(1.02, 0.5))
    finalize_figure(fig)
    return fig


def plot_ch_contribution_stack(
    years: np.ndarray,
    contrib_draws: dict[str, np.ndarray],
    *,
    labels: dict[str, str],
) -> plt.Figure:
    """Gestapelter Beitrag je Genre zum Gesamt-CH-Besuchsanteil (Posterior-Mittel)."""
    means = {gid: d.mean(axis=0) * 100 for gid, d in contrib_draws.items()}
    fig, ax = plt.subplots(figsize=(9.5, 5))
    bottom = np.zeros(len(years))
    for gid in contrib_draws:
        vals = means[gid]
        ax.bar(
            years,
            vals,
            bottom=bottom,
            width=0.65,
            label=labels.get(gid, gid),
            color=GENRE_COLORS.get(gid, PALETTE["accent"]),
            alpha=0.88,
        )
        bottom = bottom + vals
    ax.plot(years, bottom, color=PALETTE["ink"], linewidth=1.5, linestyle="--", label="Σ Beiträge")
    ax.set_xlabel("Jahr")
    ax.set_ylabel("Beitrag zum CH-Gesamtanteil (Prozentpunkte)")
    ax.set_title("Zerlegung: Genre-Mix × CH-Erfolg im Genre")
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    finalize_figure(fig)
    return fig


def plot_decomposition_bars(
    effects_pp: dict[str, float],
    *,
    title: str,
) -> plt.Figure:
    """Balken: Mix-, Erfolgs- und Interaktionseffekt (Prozentpunkte)."""
    names = list(effects_pp.keys())
    vals = [effects_pp[k] for k in names]
    colors = [PALETTE["accent"], PALETTE["ink"], "#5c7a8a"][: len(names)]
    fig, ax = plt.subplots(figsize=(8, 4.5))
    bars = ax.bar(names, vals, color=colors, alpha=0.85)
    ax.axhline(0, color=PALETTE["muted"], linewidth=1)
    for bar, v in zip(bars, vals):
        y = bar.get_height()
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            y + (0.02 if y >= 0 else -0.08),
            f"{v:+.2f} pp",
            ha="center",
            fontsize=10,
            color=PALETTE["ink"],
        )
    ax.set_ylabel("Änderung CH-Gesamtanteil (pp)")
    ax.set_title(title)
    finalize_figure(fig)
    return fig


def plot_absolute_counts(
    years: np.ndarray,
    mu_draws: np.ndarray,
    observed: np.ndarray,
    *,
    covid_years: tuple[int, ...] = (2020, 2021),
    ylabel: str = "CH-Kinobesuche",
) -> plt.Figure:
    """Posterior erwartete CH-Besuche (absolut), 95 %-HDI."""
    lo, hi = hdi_per_column(mu_draws)
    mean = mu_draws.mean(axis=0)
    scale = 1e6
    fig, ax = plt.subplots(figsize=(9.5, 5))
    ax.fill_between(
        years,
        lo / scale,
        hi / scale,
        color=PALETTE["accent"],
        alpha=0.28,
        label=f"{HDI_PCT} %-HDI",
    )
    ax.plot(years, mean / scale, color=PALETTE["accent"], linewidth=2.2, label="Posterior-Mittel")
    ax.scatter(years, observed / scale, color=PALETTE["ink"], s=52, zorder=4, label="Beobachtet (PX)")
    for y in covid_years:
        ax.axvspan(y - 0.5, y + 0.5, color=PALETTE["sand"], alpha=0.5, zorder=0)
    ax.set_xlabel("Jahr")
    ax.set_ylabel(f"{ylabel} (Mio.)")
    ax.set_title(f"Posterior CH-Besuche mit Markt-Offset ({HDI_LABEL})")
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    finalize_figure(fig)
    return fig


def plot_market_vs_ch(
    years: np.ndarray,
    market: np.ndarray,
    ch: np.ndarray,
    mu_draws: np.ndarray,
) -> plt.Figure:
    """Gesamtmarkt vs. CH-Besuche (Mio.) + posterior CH."""
    fig, ax1 = plt.subplots(figsize=(9.5, 5))
    scale = 1e6
    ax1.plot(years, market / scale, color=PALETTE["muted"], linewidth=2, label="Kinobesuche gesamt")
    ax1.scatter(years, market / scale, color=PALETTE["muted"], s=36, zorder=3)
    ax1.set_ylabel("Kinobesuche gesamt (Mio.)", color=PALETTE["muted"])
    ax1.tick_params(axis="y", labelcolor=PALETTE["muted"])

    ax2 = ax1.twinx()
    ch_mean = mu_draws.mean(axis=0)
    ax2.plot(years, ch / scale, "o", color=PALETTE["ink"], markersize=6, label="CH beobachtet")
    ax2.plot(years, ch_mean / scale, color=PALETTE["accent"], linewidth=2.2, label="CH posterior")
    ax2.set_ylabel("CH-Besuche (Mio.)", color=PALETTE["accent"])
    ax2.tick_params(axis="y", labelcolor=PALETTE["accent"])

    lines1, lab1 = ax1.get_legend_handles_labels()
    lines2, lab2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, lab1 + lab2, frameon=False, loc="upper left", fontsize=9)
    ax1.set_xlabel("Jahr")
    ax1.set_title("Marktgrösse und CH-Besuche (absolut)")
    finalize_figure(fig)
    return fig


def plot_rate_from_offset(
    years: np.ndarray,
    rate_draws: np.ndarray,
    observed_share: np.ndarray,
) -> plt.Figure:
    """Implizierter CH-Anteil aus log-Rate (exp(α+β·t)) — Vergleich zu Anteilsmodellen."""
    lo, hi = hdi_per_column(rate_draws)
    mean = rate_draws.mean(axis=0) * 100
    fig, ax = plt.subplots(figsize=(9.5, 4.5))
    ax.fill_between(years, lo * 100, hi * 100, color=PALETTE["accent"], alpha=0.22, label=f"{HDI_PCT} %-HDI")
    ax.plot(years, mean, color=PALETTE["accent"], linewidth=2, label="Posterior-Anteil (aus Offset)")
    ax.scatter(years, observed_share * 100, color=PALETTE["ink"], s=48, zorder=3, label="Beobachtet")
    ax.set_xlabel("Jahr")
    ax.set_ylabel("CH-Anteil an Kinobesuchen (%)")
    ax.set_title(f"Implizite Rate = μ/N ({HDI_LABEL})")
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    finalize_figure(fig)
    return fig


def plot_forecast(
    hist_years: np.ndarray,
    hist_p_draws: np.ndarray,
    hist_obs_pct: np.ndarray,
    fut_years: np.ndarray,
    fut_p_draws: np.ndarray,
) -> plt.Figure:
    p_lo, p_hi = hdi_per_column(hist_p_draws)
    p_mean = hist_p_draws.mean(axis=0)
    f_lo, f_hi = hdi_per_column(fut_p_draws)
    f_mean = fut_p_draws.mean(axis=0)
    pct = 100.0

    fig, ax = plt.subplots(figsize=(9.5, 5))
    ax.fill_between(hist_years, p_lo * pct, p_hi * pct, color=PALETTE["accent"], alpha=0.22)
    ax.plot(hist_years, p_mean * pct, color=PALETTE["accent"], linewidth=2, label="Posterior (Schätzung)")
    ax.scatter(hist_years, hist_obs_pct, color=PALETTE["ink"], s=45, zorder=3, label="Beobachtet")
    ax.fill_between(fut_years, f_lo * pct, f_hi * pct, color="#5c7a8a", alpha=0.25, label=f"Prognose {HDI_PCT} %-HDI")
    ax.plot(fut_years, f_mean * pct, color="#5c7a8a", linewidth=2, linestyle="--", label="Posterior-Prognose")
    ax.axvspan(2020 - 0.5, 2021 + 0.5, color=PALETTE["sand"], alpha=0.45, zorder=0)
    ax.set_xlabel("Jahr")
    ax.set_ylabel("Anteil CH an Kinobesuchen (%)")
    ax.set_title(f"Prognose CH-Besuchsanteil ({HDI_LABEL})")
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    finalize_figure(fig)
    return fig
