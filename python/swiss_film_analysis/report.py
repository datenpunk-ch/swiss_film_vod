from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

RESULT_KEYS = ("id", "figures", "tables", "diagnostics", "mcmc", "metrics")


def slim_analysis(a: dict) -> dict:
    """Nur rechnerische Ergebnisse fürs Frontend — Text steht in content/analysis.md."""
    return {k: a[k] for k in RESULT_KEYS if k in a and a[k] is not None}


def write_report(root: Path, analyses: list[dict], generated_at: str | None = None) -> None:
    generated_at = generated_at or datetime.now(timezone.utc).isoformat()
    payload = {
        "generated_at": generated_at,
        "locale": "de-CH",
        "scope": "Kino (BFS PX + P4)",
        "analyses": [slim_analysis(a) for a in analyses],
    }
    json_path = root / "data" / "analysis_report.json"
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
