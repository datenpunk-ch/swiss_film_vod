from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np

from ..data import COVID_YEARS, CinemaContext, save_figure
from ..plots import apply_style, finalize_figure, int_de, PALETTE


def run(ctx: CinemaContext) -> dict:
    apply_style()
    prof = ctx.season_profile.sort_values("week")
    ch = ctx.season_ch.sort_values("week")
    years_label = ", ".join(str(y) for y in ctx.season_years)
    excluded_label = ", ".join(str(y) for y in sorted(COVID_YEARS))

    fig, axes = plt.subplots(2, 1, figsize=(9, 6.5), sharex=True)
    for ax, data, color, title in [
        (axes[0], prof, PALETTE["ink"], "Alle Herkünfte"),
        (axes[1], ch, PALETTE["accent"], "Schweizer Filme"),
    ]:
        y = data["mean_admissions"].values
        ax.bar(data["week"], y, color=color, width=0.85, alpha=0.9)
        ax.set_ylabel("Ø Besuche / Woche")
        ax.set_title(title)
    axes[0].set_xlabel("Kinowoche")
    axes[1].set_xlabel("Kinowoche")
    fig.suptitle(f"Kinosaison (P4), Mittel {years_label}", y=1.02, fontsize=12, fontweight="bold")
    finalize_figure(fig)

    peak_all = prof.loc[prof["mean_admissions"].idxmax()]
    peak_ch = ch.loc[ch["mean_admissions"].idxmax()]
    fig_path = save_figure(ctx, "05_kinosaison_p4.png", fig)

    return {
        "id": "cinema_season",
        "title": "Kinosaison nach Wochen (P4)",
        "question": "Wann ist das Kino am vollsten — und folgen Schweizer Filme dem gleichen Muster?",
        "data": (
            f"BFS Kinostatistik P4, gemittelt über {years_label}. "
            f"Pandemiejahre {excluded_label} sind ausgeschlossen (Schliessungen, "
            "gestörtes Programm — kein typisches Saisonprofil)."
        ),
        "method": (
            "Mittlere Besuche pro Kinowoche über die Basisjahre; CH-Filme separat "
            "(Herkunft och). Ziel: übliches Kalendermuster, nicht Krisenjahre."
        ),
        "findings": [
            f"Stärkste Woche gesamt: KW {int(peak_all['week'])} ({peak_all.get('month_label', '')}), Ø {int_de(peak_all['mean_admissions'])} Besuche.",
            f"Stärkste Woche CH: KW {int(peak_ch['week'])}, Ø {int_de(peak_ch['mean_admissions'])} Besuche.",
            "Hochphase Dezember/Jahreswechsel; Frühling (z. B. KW 17) zweiter Schwerpunkt.",
        ],
        "figures": [
            {
                "src": fig_path,
                "caption": (
                    f"Oben Gesamtmarkt, unten CH-Filme. Basisjahre {years_label}; "
                    f"ohne {excluded_label}."
                ),
            }
        ],
        "tables": [],
        "limits": [
            "Kein Genre in P4; nur aggregierte Wochenprofile.",
            f"2020–2021 bewusst ausgeschlossen; 2022 ist erstes Nach-Pandemie-Jahr (leichte Restverzerrung möglich).",
            "Mittel über wenige Basisjahre — nicht jedes Kalenderjahr einzeln.",
        ],
    }
