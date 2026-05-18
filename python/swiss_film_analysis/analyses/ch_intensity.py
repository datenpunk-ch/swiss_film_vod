from __future__ import annotations

import matplotlib.pyplot as plt

from ..data import CinemaContext, save_figure
from ..plots import apply_style, finalize_figure, PALETTE


def run(ctx: CinemaContext) -> dict:
    apply_style()
    df = ctx.px_yearly.sort_values("year")

    fig, ax = plt.subplots(figsize=(9, 4.2))
    ax.plot(df["year"], df["market_intensity"], marker="o", linewidth=2, color=PALETTE["ink"], label="Gesamtmarkt")
    ax.plot(df["year"], df["ch_intensity"], marker="s", linewidth=2, color=PALETTE["accent"], label="Schweizer Filme")
    ax.set_xlabel("Jahr")
    ax.set_ylabel("Ø Kinobesuche pro Film")
    ax.set_title("Reichweite pro Film: CH vs. Gesamtmarkt")
    ax.legend(frameon=False)
    for y in (2020, 2021):
        ax.axvspan(y - 0.5, y + 0.5, color=PALETTE["sand"], alpha=0.35, zorder=0)
    finalize_figure(fig)

    last = df.iloc[-1]
    ratio = last["ch_intensity"] / last["market_intensity"]
    fig_path = save_figure(ctx, "04_ch_intensitaet.png", fig)

    return {
        "id": "ch_intensity",
        "title": "Besuche pro Film (Intensität)",
        "question": "Erzielen Schweizer Filme pro Titel mehr oder weniger Besuche als der Markt?",
        "data": "BFS PX: Besuche / Anzahl Filme je Herkunft.",
        "method": "Intensität = Kinobesuche ÷ Filme im Programm (jährlich).",
        "findings": [
            f"2025: CH {last['ch_intensity']:,.0f} vs. Markt {last['market_intensity']:,.0f} Besuche/Film (Faktor {ratio:.2f}).".replace(",", "’"),
            "In Pandemiejahren fallen beide Niveaus stark; CH 2021 besonders tief.",
            "Seit 2022 steigt die CH-Intensität wieder, bleibt meist unter dem Gesamtmarkt.",
        ],
        "figures": [
            {
                "src": fig_path,
                "caption": "Höhere Linie = mehr Besuche pro gelistetem Film.",
            }
        ],
        "tables": [],
        "limits": [
            "Ein Film zählt einmal pro Jahr im Programm; Blockbuster und Langläufer werden nicht separat gewichtet.",
        ],
    }
