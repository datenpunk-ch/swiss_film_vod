"""Zeitreihen aus Posterior-Draws für interaktive Recharts-Embeds (analysis_report.json)."""
from __future__ import annotations

import numpy as np

from .bayes_plots import COUNTRY_COLORS, GENRE_COLORS
from .bayes_utils import hdi_bounds, hdi_per_column


def _tolist(arr: np.ndarray) -> list[float]:
    return [float(x) for x in np.asarray(arr).flatten()]


def band_from_draws(years: np.ndarray, draws: np.ndarray, *, scale: float = 1.0) -> dict:
    lo, hi = hdi_per_column(draws)
    mean = draws.mean(axis=0)
    return {
        "years": _tolist(years),
        "mean": _tolist(mean * scale),
        "lo": _tolist(lo * scale),
        "hi": _tolist(hi * scale),
    }


def export_share_forecast(
    hist_years: np.ndarray,
    p_hist: np.ndarray,
    all_obs_years: np.ndarray,
    all_obs_pct: np.ndarray,
    fut_times: np.ndarray,
    p_fut: np.ndarray,
) -> dict:
    return {
        "type": "share_forecast",
        "yFormat": "percent",
        "covidYears": [2020, 2021],
        "hist": band_from_draws(hist_years, p_hist, scale=100.0),
        "forecast": band_from_draws(fut_times, p_fut, scale=100.0),
        "observed": {"years": _tolist(all_obs_years), "value": _tolist(all_obs_pct)},
    }


def export_gap_forecast(
    hist_years: np.ndarray,
    hist_gap_draws: np.ndarray,
    observed_gap: np.ndarray,
    fut_years: np.ndarray,
    fut_gap_draws: np.ndarray,
    *,
    all_years: np.ndarray | None = None,
    all_observed_gap: np.ndarray | None = None,
    t_star_draws: np.ndarray | None = None,
    last_obs_year: int | None = None,
) -> dict:
    obs_x = np.asarray(all_years if all_years is not None else hist_years)
    obs_y = np.asarray(all_observed_gap if all_observed_gap is not None else observed_gap)
    out = {
        "type": "gap_forecast",
        "yFormat": "pp",
        "covidYears": [2020, 2021],
        "zeroLine": True,
        "hist": band_from_draws(hist_years, hist_gap_draws, scale=1.0),
        "forecast": band_from_draws(fut_years, fut_gap_draws, scale=1.0),
        "observed": {"years": _tolist(obs_x), "value": _tolist(obs_y)},
    }
    if t_star_draws is not None and last_obs_year is not None:
        future = t_star_draws[
            np.isfinite(t_star_draws) & (t_star_draws > last_obs_year) & (t_star_draws < 2045)
        ]
        if future.size:
            lo, hi = hdi_bounds(future)
            out["crossing"] = {
                "median": float(np.median(future)),
                "lo": float(lo),
                "hi": float(hi),
            }
    return out


def export_country_shares(
    years: np.ndarray,
    p_draws: dict[str, np.ndarray],
    observed: dict[str, np.ndarray],
    labels: dict[str, str],
    *,
    observed_all: dict[str, dict[str, np.ndarray]] | None = None,
) -> dict:
    series = []
    for cid, draws in p_draws.items():
        entry = {
            "id": cid,
            "label": labels.get(cid, cid),
            "color": COUNTRY_COLORS.get(cid),
            **band_from_draws(years, draws, scale=100.0),
        }
        if observed_all and cid in observed_all:
            obs = observed_all[cid]
            entry["observed"] = {
                "years": _tolist(obs["years"]),
                "value": _tolist(np.asarray(obs["value"])),
            }
        elif cid in observed:
            entry["observed"] = {
                "years": _tolist(years),
                "value": _tolist(np.asarray(observed[cid]) * 100.0),
            }
        series.append(entry)
    return {"type": "multi_share", "yFormat": "percent", "covidYears": [2020, 2021], "series": series}


def export_genre_shares(
    years: np.ndarray,
    p_draws: dict[str, np.ndarray],
    observed: dict[str, np.ndarray],
    labels: dict[str, str],
    *,
    observed_all: dict[str, dict[str, np.ndarray]] | None = None,
) -> dict:
    series = []
    for gid, draws in p_draws.items():
        entry = {
            "id": gid,
            "label": labels.get(gid, gid),
            "color": GENRE_COLORS.get(gid),
            **band_from_draws(years, draws, scale=100.0),
        }
        if observed_all and gid in observed_all:
            obs = observed_all[gid]
            entry["observed"] = {
                "years": _tolist(obs["years"]),
                "value": _tolist(np.asarray(obs["value"])),
            }
        elif gid in observed:
            entry["observed"] = {
                "years": _tolist(years),
                "value": _tolist(np.asarray(observed[gid]) * 100.0),
            }
        series.append(entry)
    return {"type": "multi_share", "yFormat": "percent", "covidYears": [2020, 2021], "series": series}
