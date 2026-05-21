#!/usr/bin/env python3
"""Kino-Analysen ausführen → data/analysis_report.json (Text: content/analysis.md)."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "python"))

from swiss_film_analysis.analyses import RUNNERS  # noqa: E402
from swiss_film_analysis.cache import (  # noqa: E402
    analysis_fingerprint,
    load_cached,
    save_cached,
)
from swiss_film_analysis.data import build_context  # noqa: E402
from swiss_film_analysis.report import write_report  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Bayes-Kino-Analysen (mit Cache)")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Alle Modelle neu schätzen (MCMC), Cache ignorieren",
    )
    args = parser.parse_args()

    ctx = build_context(ROOT)
    analyses = []
    for aid, fn in RUNNERS:
        fp = analysis_fingerprint(ROOT, aid)
        if not args.force:
            cached = load_cached(ROOT, aid, fp)
            if cached is not None:
                print(f"→ {aid} … (Cache)")
                analyses.append(cached)
                continue
        print(f"→ {aid} …")
        result = fn(ctx)
        save_cached(ROOT, aid, fp, result)
        analyses.append(result)

    write_report(ROOT, analyses)
    print(f"✓ {len(analyses)} Analysen → data/analysis_report.json")
    print("  Fliesstext: content/analysis.md (manuell, wird nicht überschrieben)")
    print("  Seite: analysis.html lädt Markdown + JSON zur Laufzeit")
    print("  Cache: data/analysis_cache/  (--force zum Neu-Schätzen)")
    print("✓ Grafiken → assets/analysis/figures/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
