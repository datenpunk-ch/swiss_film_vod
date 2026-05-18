from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

from .bayes_common import mcmc_settings_for
CACHE_DIR_NAME = "analysis_cache"


def _file_digest(path: Path) -> str:
    if not path.is_file():
        return "missing"
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()[:16]


def _module_digest(module_name: str) -> str:
    spec = importlib.util.find_spec(module_name)
    if spec is None or not spec.origin:
        return "missing"
    return _file_digest(Path(spec.origin))


def analysis_fingerprint(root: Path, analysis_id: str) -> str:
    """Ändert sich bei Daten-, Code- oder MCMC-Parametern — nicht bei analysis.md."""
    unified = root / "data" / "unified.json"
    p4 = root / "data" / "raw" / "ts-x-16.02.01-P4.csv"
    mod_name = f"swiss_film_analysis.analyses.{analysis_id}"

    parts = [
        _file_digest(unified),
        _file_digest(p4),
        _module_digest(mod_name),
        _module_digest("swiss_film_analysis.bayes_common"),
    ]
    mcmc = mcmc_settings_for(analysis_id)
    parts.append(json.dumps(mcmc, sort_keys=True))
    parts.append(analysis_id)

    return hashlib.sha256("|".join(parts).encode()).hexdigest()[:24]


def cache_path(root: Path, analysis_id: str) -> Path:
    d = root / "data" / CACHE_DIR_NAME
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{analysis_id}.json"


def load_cached(root: Path, analysis_id: str, fingerprint: str) -> dict | None:
    path = cache_path(root, analysis_id)
    if not path.is_file():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    if payload.get("fingerprint") != fingerprint:
        return None
    return payload.get("result")


def save_cached(root: Path, analysis_id: str, fingerprint: str, result: dict) -> None:
    path = cache_path(root, analysis_id)
    path.write_text(
        json.dumps({"fingerprint": fingerprint, "result": result}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
