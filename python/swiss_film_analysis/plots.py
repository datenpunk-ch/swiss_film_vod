from __future__ import annotations

import matplotlib.pyplot as plt

PALETTE = {
    "ink": "#0b0d10",
    "accent": "#b5542a",
    "muted": "#55606a",
    "grid": "#e0e0e0",
    "sand": "#e5d4c8",
}

# Einheitliche Trend-Grafiken (Breite × Höhe in Zoll)
STANDARD_TREND_FIGSIZE = (11.5, 5.2)
LEGEND_FONTSIZE = 9


def apply_style():
    plt.rcParams.update(
        {
            "font.family": "sans-serif",
            "font.sans-serif": ["Segoe UI", "Arial", "DejaVu Sans"],
            "axes.edgecolor": PALETTE["ink"],
            "axes.labelcolor": PALETTE["ink"],
            "axes.titlecolor": PALETTE["ink"],
            "axes.titleweight": "bold",
            "axes.titlesize": 12,
            "axes.labelsize": 10,
            "axes.grid": True,
            "grid.color": PALETTE["grid"],
            "grid.linestyle": "--",
            "grid.alpha": 0.7,
            "figure.facecolor": "white",
            "axes.facecolor": "white",
            "legend.fontsize": LEGEND_FONTSIZE,
        }
    )


def pct_de(x: float) -> str:
    return f"{x * 100:.1f} %".replace(".", ",")


def pp_de(x: float, *, decimals: int = 2) -> str:
    """Differenz von Anteilen in Pp. (Dezimalpunkt)."""
    return f"{x:.{decimals}f} Pp."


def int_de(x: float) -> str:
    return f"{int(round(x)):,}".replace(",", "’")


def apply_legend_right(
    ax,
    *,
    fontsize: int = LEGEND_FONTSIZE,
    title: str | None = None,
) -> None:
    """Legende rechts neben dem Plot; Plotfläche in Zoll bleibt unverändert."""
    handles, labels = ax.get_legend_handles_labels()
    if not labels:
        return

    fig = ax.figure
    pos = ax.get_position()
    w_in, h_in = fig.get_size_inches()

    n = len(labels)
    max_len = max(len(s) for s in labels)
    extra_in = 0.35 + max(0, n - 3) * 0.24 + max(0, max_len - 22) * 0.018
    if title:
        extra_in += 0.2
    extra_in = min(2.8, extra_in)

    new_w = w_in + extra_in
    fig.set_size_inches(new_w, h_in, forward=True)
    ax.set_position([pos.x0, pos.y0, pos.width * w_in / new_w, pos.height])

    kw: dict = dict(
        frameon=False,
        loc="center left",
        bbox_to_anchor=(1.01, 0.5),
        borderaxespad=0.35,
        fontsize=fontsize,
        labelspacing=0.35,
        handlelength=1.2,
    )
    if title:
        kw["title"] = title
        kw["title_fontsize"] = fontsize
    ax.legend(**kw)


def finalize_figure(
    fig=None,
    *,
    bottom: float = 0.12,
    left: float = 0.1,
    right: float = 1.0,
) -> None:
    """Sichert sichtbare Achsenbeschriftungen nach tight_layout."""
    if fig is None:
        fig = plt.gcf()
    for ax in fig.get_axes():
        if not ax.get_xlabel():
            ax.set_xlabel("X")
        if not ax.get_ylabel():
            ax.set_ylabel("Y")
    # right wird nur noch für Grafiken ohne apply_legend_right genutzt
    fig.tight_layout(rect=[left, bottom, min(right, 0.98), 0.96])
