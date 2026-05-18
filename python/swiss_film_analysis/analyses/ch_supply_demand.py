from __future__ import annotations

import matplotlib.pyplot as plt

from ..data import CinemaContext, save_figure
from ..plots import apply_style, finalize_figure, pct_de, PALETTE


def run(ctx: CinemaContext) -> dict:
    apply_style()
    df = ctx.px_yearly.sort_values("year")

    fig, ax = plt.subplots(figsize=(9, 4.2))
    ax.plot(df["year"], df["ch_share_films"] * 100, marker="o", linewidth=2, color=PALETTE["accent"], label="Anteil Angebot (Filme)")
    ax.plot(df["year"], df["ch_share_admissions"] * 100, marker="s", linewidth=2, color=PALETTE["ink"], label="Anteil Nachfrage (Besuche)")
    ax.set_xlabel("Jahr")
    ax.set_ylabel("Anteil am Kinomarkt (%)")
    ax.set_title("Schweizer Filme: Angebot vs. Nachfrage")
    ax.legend(frameon=False, loc="upper right")
    for y in (2020, 2021):
        ax.axvspan(y - 0.5, y + 0.5, color=PALETTE["sand"], alpha=0.35, zorder=0)
    finalize_figure(fig)

    last = df.iloc[-1]
    gap_pp = (last["ch_share_films"] - last["ch_share_admissions"]) * 100
    fig_path = save_figure(ctx, "02_ch_angebot_nachfrage.png", fig)

    return {
        "id": "ch_supply_demand",
        "title": "Schweizer Filme: Programmplatz vs. Publikum",
        "question": "Kommen Schweizer Filme beim Publikum proportional zu ihrem Platz im Programm an?",
        "data": "BFS PX, Herkunft Schweiz vs. Gesamtmarkt.",
        "method": "Jährliche Anteile an gelisteten Filmen (Angebot) und Kinobesuchen (Nachfrage).",
        "findings": [
            f"2025: {pct_de(last['ch_share_films'])} der Filme, aber nur {pct_de(last['ch_share_admissions'])} der Besuche.",
            f"Lücke Angebot–Nachfrage zuletzt: {gap_pp:.1f} Prozentpunkte (mehr Filme im Programm als Besuchsanteil).",
            "Seit 2022 liegt der Besuchsanteil höher als 2014–2019, der Angebotsanteil sinkt relativ.",
        ],
        "figures": [
            {
                "src": fig_path,
                "caption": "Rostrot = Angebotsanteil, Schwarz = Nachfrageanteil.",
            }
        ],
        "tables": [
            {
                "caption": "CH-Anteile je Jahr",
                "headers": ["Jahr", "Angebot", "Nachfrage", "Differenz (Pp.)"],
                "rows": [
                    [
                        int(r.year),
                        pct_de(r.ch_share_films),
                        pct_de(r.ch_share_admissions),
                        f"{(r.ch_share_films - r.ch_share_admissions) * 100:+.1f}".replace(".", ","),
                    ]
                    for r in df.itertuples()
                ],
            }
        ],
        "limits": [
            "Anteile beziehen sich auf den PX-Kinomarkt, nicht auf einzelne Filme.",
            "Co-Produktionen und Herkunftsregeln folgen der BFS-Klassifikation.",
        ],
    }
