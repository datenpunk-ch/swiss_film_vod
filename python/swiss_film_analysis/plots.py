from __future__ import annotations

import matplotlib.pyplot as plt

PALETTE = {
    "ink": "#0b0d10",
    "accent": "#b5542a",
    "muted": "#55606a",
    "grid": "#e0e0e0",
    "sand": "#e5d4c8",
}


def apply_style():
    plt.rcParams.update(
        {
            "font.family": "sans-serif",
            "font.sans-serif": ["Segoe UI", "Arial", "DejaVu Sans"],
            "axes.edgecolor": PALETTE["ink"],
            "axes.labelcolor": PALETTE["ink"],
            "axes.titlecolor": PALETTE["ink"],
            "axes.titleweight": "bold",
            "axes.grid": True,
            "grid.color": PALETTE["grid"],
            "grid.linestyle": "--",
            "grid.alpha": 0.7,
            "figure.facecolor": "white",
            "axes.facecolor": "white",
        }
    )


def pct_de(x: float) -> str:
    return f"{x * 100:.1f} %".replace(".", ",")


def int_de(x: float) -> str:
    return f"{int(round(x)):,}".replace(",", "’")


def finalize_figure(fig=None, *, bottom: float = 0.12, left: float = 0.1) -> None:
    """Sichert sichtbare Achsenbeschriftungen nach tight_layout."""
    if fig is None:
        import matplotlib.pyplot as plt

        fig = plt.gcf()
    for ax in fig.get_axes():
        if not ax.get_xlabel():
            ax.set_xlabel("X")
        if not ax.get_ylabel():
            ax.set_ylabel("Y")
    fig.tight_layout(rect=[0, bottom, 1, 0.98])
