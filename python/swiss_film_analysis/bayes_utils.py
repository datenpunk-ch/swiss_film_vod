from __future__ import annotations

import numpy as np

HDI_PROB = 0.95
HDI_PCT = int(HDI_PROB * 100)
# Vollform mindestens einmal in Beschriftungen; danach Abkürzung HDI.
HDI_LABEL = f"{HDI_PCT} %-höchstes Dichtheitsintervall (HDI)"
HDI_COL = f"{HDI_PCT} %-HDI"
PD_COL = "Pd (Richtungswahrscheinlichkeit)"


def pp_per_year_from_logit(alpha_draws: np.ndarray, beta_draws: np.ndarray) -> np.ndarray:
    """Jährliche Änderung des Besuchsanteils in Prozentpunkten (Ableitung der logit-Kurve)."""
    alpha = np.asarray(alpha_draws).flatten()
    beta = np.asarray(beta_draws).flatten()
    p = 1 / (1 + np.exp(-alpha))
    return beta * p * (1 - p) * 100


def fmt_pp_trend(pp_samples: np.ndarray) -> str:
    """Median-Trend als «↑ 0,4 Pp. / Jahr» (de-CH)."""
    med = float(np.median(np.asarray(pp_samples).flatten()))
    if not np.isfinite(med):
        return "—"
    arrow = "↑" if med > 1e-6 else "↓" if med < -1e-6 else ""
    val = f"{abs(med):.2f}".replace(".", ",")
    return f"{arrow} {val} Pp. / Jahr".strip()


def probability_of_direction(samples: np.ndarray, *, positive: bool = True) -> float:
    """Probability of Direction (Pd): Anteil der Posterior-Draws in eine Richtung."""
    s = np.asarray(samples).flatten()
    if positive:
        return float(np.mean(s > 0))
    return float(np.mean(s < 0))


def hdi_bounds(samples: np.ndarray, prob: float = HDI_PROB) -> tuple[float, float]:
    """Höchste Dichteschwelle (HDI), nicht gleichverteiltes Quantil."""
    import arviz as az

    s = np.asarray(samples).flatten()
    h = az.hdi(s, prob=prob)
    return float(h[0]), float(h[1])


def hdi_per_column(samples: np.ndarray, prob: float = HDI_PROB) -> tuple[np.ndarray, np.ndarray]:
    """HDI je Spalte für Shape (n_draws, n_cols)."""
    import arviz as az

    if samples.ndim != 2:
        raise ValueError("samples must be 2-D (draws × columns)")
    lo = np.empty(samples.shape[1])
    hi = np.empty(samples.shape[1])
    for j in range(samples.shape[1]):
        h = az.hdi(samples[:, j], prob=prob)
        lo[j], hi[j] = float(h[0]), float(h[1])
    return lo, hi


def posterior_row(name: str, label: str, samples: np.ndarray, *, pd_positive: bool | None = None) -> dict:
    mean = float(np.mean(samples))
    sd = float(np.std(samples, ddof=0))
    lo, hi = hdi_bounds(samples)
    row = {
        "parameter": name,
        "label": label,
        "mean": mean,
        "sd": sd,
        "hdi_low": lo,
        "hdi_high": hi,
        "hdi_label": f"{fmt_num(lo)} – {fmt_num(hi)}",
    }
    if pd_positive is not None:
        pd = probability_of_direction(samples, positive=pd_positive)
        row["pd"] = pd
        row["pd_label"] = pct(pd)
    return row


def prob_pct(x: float) -> str:
    return f"{x * 100:.2f} %".replace(".", ",")


def pct(x: float) -> str:
    return f"{x * 100:.1f} %".replace(".", ",")


def extract_mcmc_diagnostics(idata, var_names: list[str]) -> list[dict]:
    import arviz as az

    summary = az.summary(idata, var_names=var_names)
    metrics = []

    if "r_hat" in summary.columns:
        rhat = summary["r_hat"].astype(float)
        metrics.append(
            {
                "label": "R̂ max",
                "value": f"{rhat.max():.3f}",
                "note": "Ziel < 1,01",
                "ok": bool(rhat.max() < 1.01),
            }
        )
    for col, label, target in [
        ("ess_bulk", "ESS bulk (min)", "400"),
        ("ess_tail", "ESS tail (min)", "400"),
    ]:
        if col in summary.columns:
            v = summary[col].astype(float).min()
            metrics.append(
                {
                    "label": label,
                    "value": f"{int(v)}",
                    "note": f"Ziel ≥ {target}",
                    "ok": bool(v >= float(target)),
                }
            )

    try:
        div = int(idata.sample_stats["diverging"].sum().values)
        metrics.append(
            {
                "label": "Divergenzen",
                "value": str(div),
                "note": "Ziel = 0",
                "ok": div == 0,
            }
        )
    except (KeyError, AttributeError):
        pass

    try:
        bfmi = float(idata.sample_stats["bfmi"].min().values)
        metrics.append(
            {
                "label": "BFMI (min)",
                "value": f"{bfmi:.2f}",
                "note": "Ziel > 0,2",
                "ok": bfmi > 0.2,
            }
        )
    except (KeyError, AttributeError):
        pass

    metrics.append(
        {
            "label": "Ketten × Draws",
            "value": f"{idata.posterior.dims.get('chain', '?')} × {idata.posterior.dims.get('draw', '?')}",
            "note": "MCMC-Stichprobe",
            "ok": True,
        }
    )
    return metrics


def posterior_table_rows(rows: list[dict]) -> dict:
    headers = ["Parameter", "Bedeutung", "Mittelwert", "SD", f"{HDI_COL} (höchstes Dichtheitsintervall)", PD_COL]
    body = []
    for r in rows:
        pd_val = r.get("pd_label", "—")
        body.append(
            [
                r["parameter"],
                r["label"],
                fmt_num(r["mean"]),
                fmt_num(r["sd"], decimals=4),
                r["hdi_label"],
                pd_val,
            ]
        )
    return {"caption": "Posterior-Zusammenfassung", "headers": headers, "rows": body}


def fmt_num(x: float, *, decimals: int = 3) -> str:
    return f"{x:.{decimals}f}".replace(".", ",")


def forecast_half_year_times(
    last_obs_year: int,
    *,
    end_year: int | None = None,
    years_ahead: int = 3,
) -> np.ndarray:
    """Halbjahresschritte ab Jan des Jahres nach last_obs_year (…, Jul, Jan+1, …)."""
    start = float(int(last_obs_year) + 1)
    end = float(end_year if end_year is not None else int(last_obs_year) + years_ahead) + 0.5
    n = int(round((end - start) / 0.5)) + 1
    return start + 0.5 * np.arange(max(n, 1), dtype=float)


def format_time_period(t: float) -> str:
    """Lesbare Periode für Tabellen (Jahreswerte vs. Jul-Halbjahr)."""
    y = int(t)
    if abs(t - y) < 1e-6:
        return str(y)
    return f"Jul {y}"


def format_time_tick(t: float) -> str:
    """Achsenbeschriftung: nur Kalenderjahre (Halbjahre wie Jul 2026 nur in Tabellen)."""
    return str(int(round(t)))
