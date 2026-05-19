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
P4_CSV = ROOT / "data" / "raw" / "ts-x-16.02.01-P4.csv"

COVID_YEARS = {2020, 2021}
SEASON_YEARS = [2019, 2022, 2023, 2024]


@dataclass
class CinemaContext:
    root: Path
    unified: dict
    px_yearly: pd.DataFrame
    px_genre_yearly: pd.DataFrame
    px_genre_mix_yearly: pd.DataFrame
    px_country_yearly: pd.DataFrame
    p4_weekly: pd.DataFrame
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


def _genre_mix_yearly_rows(unified: dict) -> list[dict]:
    """Breite Jahrestabelle: Genre-Mix (Besuche/Filme) und CH-Erfolg je Genre."""
    rows = []
    for y in unified["primary"]["px"]["yearly"]:
        year = y["year"]
        genres = {g["id"]: g for g in y["genres"]}
        ch_by_id = {g["id"]: g for g in y.get("ch_genres", [])}
        row: dict = {"year": year, "is_covid": year in COVID_YEARS}
        for gid in ("fic", "doc", "ani"):
            g = genres.get(gid, {})
            cg = ch_by_id.get(gid, {})
            row[f"market_adm_{gid}"] = g.get("demand", 0)
            row[f"market_films_{gid}"] = g.get("supply", 0)
            row[f"market_share_adm_{gid}"] = g.get("share_demand", 0)
            row[f"market_share_films_{gid}"] = g.get("share_supply", 0)
            row[f"ch_adm_{gid}"] = cg.get("demand", 0)
            row[f"ch_share_{gid}"] = cg.get("share_demand", 0)
        rows.append(row)
    return rows


def _country_yearly_rows(unified: dict) -> list[dict]:
    """Kernländer: Besuche/Filme und Markt je Jahr (ohne «Übrige»)."""
    market_by_year = {
        y["year"]: y["market"]["demand"]
        for y in unified.get("primary", {}).get("px", {}).get("yearly", [])
    }
    market_films_by_year = {
        y["year"]: y["market"]["supply"]
        for y in unified.get("primary", {}).get("px", {}).get("yearly", [])
    }
    rows = []
    for cs in unified.get("primary", {}).get("px", {}).get("country_series") or []:
        cid = cs.get("id")
        if cid == "other":
            continue
        demand_by_year = {p["year"]: p.get("value") for p in cs.get("demand") or []}
        supply_by_year = {p["year"]: p.get("value") for p in cs.get("supply") or []}
        share_demand_by_year = {p["year"]: p.get("value") for p in cs.get("demand_share") or []}
        for year, n in market_by_year.items():
            adm = demand_by_year.get(year)
            if adm is None:
                continue
            nf = market_films_by_year.get(year) or 0
            sup = supply_by_year.get(year) or 0
            rows.append(
                {
                    "year": year,
                    "country": cid,
                    "country_label": cs.get("label", cid),
                    "admissions": float(adm),
                    "films": float(sup),
                    "market_admissions": float(n),
                    "market_films": float(nf),
                    "share_demand": float(share_demand_by_year.get(year) or (adm / n if n else 0)),
                    "is_covid": year in COVID_YEARS,
                }
            )
    return rows


def _genre_yearly_rows(unified: dict) -> list[dict]:
    rows = []
    for y in unified["primary"]["px"]["yearly"]:
        year = y["year"]
        market_by_id = {g["id"]: g for g in y["genres"]}
        ch_genres = y.get("ch_genres")
        if not ch_genres:
            continue
        for cg in ch_genres:
            gid = cg["id"]
            market = market_by_id.get(gid, {})
            rows.append(
                {
                    "year": year,
                    "genre": gid,
                    "genre_label": cg.get("label", gid),
                    "ch_admissions": cg["demand"],
                    "market_admissions": market.get("demand", 0),
                    "ch_share": cg.get("share_demand", 0),
                    "is_covid": year in COVID_YEARS,
                }
            )
    return rows


def _load_p4_weekly(path: Path) -> pd.DataFrame:
    raw = pd.read_csv(path)
    raw = raw[(raw["unit"] == "adm") & (raw["recent"] == "rall")].copy()
    raw["year"] = raw["year"].astype(int)
    raw["week"] = raw["week"].astype(int)
    market = raw[raw["origin"] == "oall"][["year", "week", "value"]].rename(columns={"value": "market_adm"})
    ch = raw[raw["origin"] == "och"][["year", "week", "value"]].rename(columns={"value": "ch_adm"})
    merged = market.merge(ch, on=["year", "week"], how="inner")
    merged["is_covid"] = merged["year"].isin(COVID_YEARS)
    return merged.sort_values(["year", "week"])


def build_context(root: Path | None = None) -> CinemaContext:
    root = root or ROOT
    unified = load_unified(root / "data" / "unified.json")
    px_yearly = pd.DataFrame(_yearly_px_rows(unified))
    px_genre_yearly = pd.DataFrame(_genre_yearly_rows(unified))
    px_genre_mix_yearly = pd.DataFrame(_genre_mix_yearly_rows(unified))
    px_country_yearly = pd.DataFrame(_country_yearly_rows(unified))

    season = unified["supplementary"]["cinema_p4"]["season"]
    season_profile = pd.DataFrame(season["profile"])
    season_ch = pd.DataFrame(season["ch_profile"])

    series = {}
    for key, points in unified["primary"]["px"]["series"].items():
        series[key] = pd.DataFrame(points).set_index("year")["value"]

    p4_path = root / "data" / "raw" / "ts-x-16.02.01-P4.csv"
    p4_weekly = _load_p4_weekly(p4_path) if p4_path.exists() else pd.DataFrame()

    figures_dir = root / "assets" / "analysis" / "figures"
    figures_dir.mkdir(parents=True, exist_ok=True)

    return CinemaContext(
        root=root,
        unified=unified,
        px_yearly=px_yearly,
        px_genre_yearly=px_genre_yearly,
        px_genre_mix_yearly=px_genre_mix_yearly,
        px_country_yearly=px_country_yearly,
        p4_weekly=p4_weekly,
        px_series=series,
        season_profile=season_profile,
        season_ch=season_ch,
        season_years=list(season.get("years", [])),
        figures_dir=figures_dir,
    )


def fig_path(ctx: CinemaContext, name: str) -> str:
    return f"./assets/analysis/figures/{name}"


def save_figure(ctx: CinemaContext, name: str, fig) -> str:
    out = ctx.figures_dir / name
    fig.savefig(out, dpi=144, bbox_inches="tight", facecolor="white")
    import matplotlib.pyplot as plt

    plt.close(fig)
    return fig_path(ctx, name)
