from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np

from ..data import CinemaContext, save_figure
from ..plots import apply_style, finalize_figure, int_de, PALETTE


def run(ctx: CinemaContext) -> dict:
    apply_style()
    df = ctx.px_yearly.sort_values("year")
    years = df["year"].values
    adm = df["market_admissions"].values
    films = df["market_films"].values

    fig, ax1 = plt.subplots(figsize=(9, 4.2))
    ax1.plot(years, adm, color=PALETTE["ink"], marker="o", linewidth=2, label="Kinobesuche")
    ax1.set_ylabel("Kinobesuche")
    ax1.set_xlabel("Jahr")
    ax1.set_title("Kinomarkt Schweiz (BFS PX): Besuche und Filme im Programm")
    for y in (2020, 2021):
        ax1.axvspan(y - 0.5, y + 0.5, color=PALETTE["sand"], alpha=0.35, zorder=0)

    ax2 = ax1.twinx()
    ax2.plot(years, films, color=PALETTE["accent"], marker="s", linewidth=2, linestyle="--", label="Filme")
    ax2.set_ylabel("Filme im Programm")
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left", frameon=False)
    finalize_figure(fig)

    pre = df[~df["is_covid"]]
    peak_adm = pre.loc[pre["market_admissions"].idxmax()]
    last = df.iloc[-1]
    cagr_films = (last["market_films"] / df.iloc[0]["market_films"]) ** (1 / (len(df) - 1)) - 1

    fig_path = save_figure(ctx, "01_markt_ueberblick.png", fig)

    return {
        "id": "market_overview",
        "title": "Kinomarkt: Besuche und Programmumfang",
        "question": "Wie entwickeln sich Kinobesuche und Angebot am Schweizer Kinomarkt über die Jahre?",
        "data": "BFS «Filmangebot und Nachfrage» (PX), Sprachgebiet Schweiz, 2014–2025.",
        "method": "Jährliche Aggregation; Markt aus allen vorgeführten Filmen. Schattierung: Pandemiejahre 2020–2021.",
        "findings": [
            f"Höchste Besuche vor der Pandemie: {int_de(peak_adm['market_admissions'])} ({int(peak_adm['year'])}).",
            f"Letztes Jahr ({int(last['year'])}): {int_de(last['market_admissions'])} Besuche, {int_de(last['market_films'])} Filme.",
            f"Filme im Programm wachsen im Mittel ~{cagr_films * 100:.1f} % pro Jahr (geometrisch über 2014–2025).",
        ],
        "figures": [
            {
                "src": fig_path,
                "caption": "Kinobesuche (schwarz) und Anzahl Filme (rostrot, rechte Achse).",
            }
        ],
        "tables": [
            {
                "caption": "Markt-Kennzahlen (Auszug)",
                "headers": ["Jahr", "Besuche", "Filme", "Besuche/Film"],
                "rows": [
                    [
                        int(r.year),
                        int_de(r.market_admissions),
                        int_de(r.market_films),
                        f"{r.market_intensity:,.0f}".replace(",", "’"),
                    ]
                    for r in df.itertuples()
                ],
            }
        ],
        "limits": [
            "Nur Kino (PX), kein VoD.",
            "2025 kann als laufendes Jahr in der BFS-Quelle noch revidiert werden.",
        ],
    }
