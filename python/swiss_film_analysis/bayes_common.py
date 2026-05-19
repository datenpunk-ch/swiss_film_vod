from __future__ import annotations

from .bayes_utils import HDI_LABEL

try:
    import pymc as pm

    HAS_PYMC = True
except ImportError:
    HAS_PYMC = False

MCMC_KWARGS = dict(
    draws=800,
    tune=800,
    chains=4,
    target_accept=0.92,
    progressbar=False,
    random_seed=42,
)

CHANGEPOINT_MCMC_KWARGS = {**MCMC_KWARGS, "tune": 1000, "draws": 1000}

GENRE_IDS = ("fic", "doc", "ani")
GENRE_LABELS = {"fic": "Fiktion", "doc": "Dokumentar", "ani": "Animation"}


def mcmc_settings_for(analysis_id: str) -> dict:
    if analysis_id == "ch_changepoint_bayes":
        src = CHANGEPOINT_MCMC_KWARGS
    else:
        src = MCMC_KWARGS
    return {k: src[k] for k in ("tune", "draws", "chains", "target_accept", "random_seed")}


def mcmc_block(
    *,
    analysis_id: str | None = None,
    fit_years: list[int],
    year_center: float,
    extra: dict | None = None,
    tune: int | None = None,
    draws: int | None = None,
) -> dict:
    settings = mcmc_settings_for(analysis_id or "")
    block = {
        "sampler": "NUTS",
        "chains": settings["chains"],
        "tune": tune if tune is not None else settings["tune"],
        "draws": draws if draws is not None else settings["draws"],
        "target_accept": settings["target_accept"],
        "fit_years": fit_years,
        "year_center": year_center,
    }
    if extra:
        block.update(extra)
    return block


def analysis_result(
    *,
    id: str,
    figures: list[dict],
    tables: list[dict] | None = None,
    diagnostics: list[dict] | None = None,
    mcmc: dict | None = None,
    metrics: list[dict] | None = None,
) -> dict:
    """Schlankes Ergebnis für analysis_report.json (Fliesstext in content/analysis.md)."""
    out: dict = {"id": id, "figures": figures, "tables": tables or [], "diagnostics": diagnostics or []}
    if mcmc is not None:
        out["mcmc"] = mcmc
    if metrics is not None:
        out["metrics"] = metrics
    return out


def fallback_analysis(*, id: str, **_kwargs) -> dict:
    return analysis_result(id=id, figures=[], tables=[], diagnostics=[])


def standard_limits(*extra: str) -> list[str]:
    base = [
        "Aggregierte BFS-Daten (kein Film-Level).",
        "Pandemiejahre 2020–2021 in Jahresmodellen ausgeschlossen.",
        f"Unsicherheit als {HDI_LABEL}; Richtung als Richtungswahrscheinlichkeit (Pd), nicht p-Wert.",
    ]
    base.extend(extra)
    return base


def sample_model(model: pm.Model, **overrides):
    kwargs = {**MCMC_KWARGS, **overrides}
    with model:
        return pm.sample(**kwargs, idata_kwargs={"log_likelihood": True})
