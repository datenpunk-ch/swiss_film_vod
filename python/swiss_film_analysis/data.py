from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
UNIFIED_PATH = ROOT / "data" / "unified.json"
FIGURES_DIR = ROOT / "assets" / "analysis" / "figures"
REPORT_JSON = ROOT / "data" / "analysis_report.json"
REPORT_HTML = ROOT / "analysis.html"

# Jahre mit stark gestörtem Kinobetrieb (Sensitivität / Kovariate)
COVID_YEARS = {2020, 2021}


@dataclass
class CinemaContext:
    root: Path
    unified: dict
    px_yearly: pd.DataFrame
    px_series: dict
    season_profile: pd.DataFrame
    season_ch: pd.DataFrame
    season_years: list[int]
    figures_dir: Path


def load_unified(path: Path | None = None) -> dict:
    path = path or UNIFIED_PATH
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _yearly_px_rows(unified: dict) -> list[dict]:
    rows = []
    for y in unified["primary"]["px"]["yearly"]:
        ch = next(o for o in y["origins"] if o["id"] == "ch")
        m = y["market"]
        rows.append(
            {
                "year": y["year"],
                "market_admissions": m["demand"],
                "market_films": m["supply"],
                "ch_admissions": ch["demand"],
                "ch_films": ch["supply"],
                "ch_share_admissions": ch["share_demand"],
                "ch_share_films": ch["share_supply"],
                "ch_intensity": ch["intensity"],
                "market_intensity": m["intensity"],
                "intensity_ratio": ch["intensity"] / m["intensity"] if m["intensity"] else None,
                "is_covid": y["year"] in COVID_YEARS,
            }
        )
    return rows


def build_context(root: Path | None = None) -> CinemaContext:
    root = root or ROOT
    unified = load_unified(root / "data" / "unified.json")
    px_yearly = pd.DataFrame(_yearly_px_rows(unified))

    season = unified["supplementary"]["cinema_p4"]["season"]
    season_profile = pd.DataFrame(season["profile"])
    season_ch = pd.DataFrame(season["ch_profile"])

    series = {}
    for key, points in unified["primary"]["px"]["series"].items():
        series[key] = pd.DataFrame(points).set_index("year")["value"]

    figures_dir = root / "assets" / "analysis" / "figures"
    figures_dir.mkdir(parents=True, exist_ok=True)

    return CinemaContext(
        root=root,
        unified=unified,
        px_yearly=px_yearly,
        px_series=series,
        season_profile=season_profile,
        season_ch=season_ch,
        season_years=list(season.get("years", [])),
        figures_dir=figures_dir,
    )


def fig_path(ctx: CinemaContext, name: str) -> str:
    """Relativer Pfad für HTML (ab Site-Root)."""
    return f"./assets/analysis/figures/{name}"


def save_figure(ctx: CinemaContext, name: str, fig) -> str:
    out = ctx.figures_dir / name
    fig.savefig(out, dpi=144, bbox_inches="tight", facecolor="white")
    import matplotlib.pyplot as plt

    plt.close(fig)
    return fig_path(ctx, name)
