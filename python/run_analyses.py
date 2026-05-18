#!/usr/bin/env python3
"""Alle Kino-Analysen ausführen und analysis.html erzeugen."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "python"))

from swiss_film_analysis.analyses import ALL  # noqa: E402
from swiss_film_analysis.data import build_context  # noqa: E402
from swiss_film_analysis.report import write_report  # noqa: E402


def main() -> int:
    ctx = build_context(ROOT)
    analyses = []
    for fn in ALL:
        print(f"→ {fn.__module__.split('.')[-1]} …")
        analyses.append(fn(ctx))
    write_report(ROOT, analyses)
    print(f"✓ {len(analyses)} Analysen → data/analysis_report.json, analysis.html")
    print(f"✓ Grafiken → assets/analysis/figures/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
