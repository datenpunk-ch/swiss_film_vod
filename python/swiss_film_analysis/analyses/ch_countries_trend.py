from __future__ import annotations

from ..bayes_common import analysis_result
from ..data import CinemaContext, save_figure
from ..plots import PALETTE, apply_legend_right, apply_style, finalize_figure, pct_de

COUNTRY_COLORS = {
    "ch": PALETTE["accent"],
    "us": "#0b0d10",
    "fr": "#8b5a2b",
    "de": "#6b4c9a",
    "uk": "#3d6b8e",
    "it": "#4a6741",
    "other": PALETTE["muted"],
}


def _country_series(unified: dict) -> list[dict]:
    return unified.get("primary", {}).get("px", {}).get("country_series") or []


def _plot_share_trends(country_series: list[dict], *, field: str, title: str, ylabel: str):
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(9.5, 5.2))
    for row in country_series:
        cid = row.get("id", "")
        points = row.get(field) or []
        years = [p["year"] for p in points if p.get("value") is not None]
        vals = [float(p["value"]) * 100 for p in points if p.get("value") is not None]
        if not years:
            continue
        lw = 2.4 if cid == "ch" else 1.6
        z = 4 if cid == "ch" else 2
        ax.plot(
            years,
            vals,
            label=row.get("label", cid),
            color=COUNTRY_COLORS.get(cid, PALETTE["ink"]),
            linewidth=lw,
            zorder=z,
        )
    for y in (2020, 2021):
        ax.axvspan(y - 0.5, y + 0.5, color=PALETTE["sand"], alpha=0.45, zorder=0)
    ax.set_xlabel("Jahr")
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    finalize_figure(fig, bottom=0.14)
    apply_legend_right(ax)
    return fig


def _summary_table(country_series: list[dict], years: list[int]) -> dict:
    if not years:
        return {"caption": "Anteile Kernländer", "headers": ["Land", "Jahr A", "Jahr B"], "rows": []}
    y0, y1 = min(years), max(years)

    def share_at(row: dict, year: int) -> str:
        pt = next((p for p in row.get("demand_share") or [] if p.get("year") == year), None)
        if pt is None or pt.get("value") is None:
            return "—"
        return pct_de(float(pt["value"]))

    rows = []
    for row in country_series:
        if row.get("id") == "other":
            continue
        rows.append([row.get("label", ""), share_at(row, y0), share_at(row, y1)])
    return {
        "caption": f"Besuchsanteil am Gesamtkino ({y0} vs. {y1})",
        "headers": ["Land", str(y0), str(y1)],
        "rows": rows,
    }


def run(ctx: CinemaContext) -> dict:
    apply_style()
    country_series = _country_series(ctx.unified)
    years = ctx.unified.get("primary", {}).get("px", {}).get("years") or []

    if not country_series:
        return analysis_result(id="ch_countries_trend", figures=[], tables=[])

    fig1 = save_figure(
        ctx,
        "08_countries_demand_share.png",
        _plot_share_trends(
            country_series,
            field="demand_share",
            title="Top-Länder: Anteil an den Kinobesuchen (PX)",
            ylabel="Anteil an Kinobesuchen (%)",
        ),
    )
    fig2 = save_figure(
        ctx,
        "08_countries_supply_share.png",
        _plot_share_trends(
            country_series,
            field="supply_share",
            title="Top-Länder: Anteil am Kinoprogramm (PX)",
            ylabel="Anteil an Filmen im Programm (%)",
        ),
    )

    table = _summary_table(country_series, years)
    metrics = [
        {
            "label": "Datenquelle",
            "value": "unified.json · country_series",
            "note": "Kein MCMC — deskriptive PX-Zeitreihen",
            "ok": True,
        },
        {
            "label": "Länder",
            "value": str(len([c for c in country_series if c.get("id") != "other"])),
            "note": "Kernländer + Übrige",
            "ok": True,
        },
    ]

    return analysis_result(
        id="ch_countries_trend",
        figures=[
            {"src": fig1, "caption": "Besuchsanteile der Kernländer 2014–2025 (PX, Genre-Total)."},
            {"src": fig2, "caption": "Programmanteile der Kernländer 2014–2025."},
        ],
        tables=[table],
        metrics=metrics,
    )
