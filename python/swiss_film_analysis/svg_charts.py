"""Einfache SVG-Grafiken ohne matplotlib (stdlib)."""
from __future__ import annotations

from pathlib import Path


def _esc(s: str) -> str:
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def line_chart(
    path: Path,
    *,
    title: str,
    x_labels: list,
    series: list[dict],
    width: int = 900,
    height: int = 420,
    y_suffix: str = "",
) -> None:
    pad_l, pad_r, pad_t, pad_b = 56, 24, 48, 52
    plot_w = width - pad_l - pad_r
    plot_h = height - pad_t - pad_b
    xs = list(range(len(x_labels)))
    all_y = [v for s in series for v in s["values"] if v is not None]
    y_min, y_max = min(all_y), max(all_y)
    if y_max == y_min:
        y_max += 1

    def x_px(i: int) -> float:
        return pad_l + (i / max(len(xs) - 1, 1)) * plot_w

    def y_px(v: float) -> float:
        return pad_t + plot_h - (v - y_min) / (y_max - y_min) * plot_h

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img">',
        f'<rect width="100%" height="100%" fill="#fff"/>',
        f'<text x="{width/2}" y="28" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0b0d10">{_esc(title)}</text>',
    ]
    for i in range(5):
        gy = pad_t + plot_h * i / 4
        parts.append(f'<line x1="{pad_l}" y1="{gy}" x2="{width-pad_r}" y2="{gy}" stroke="#e0e0e0" stroke-dasharray="4"/>')
    for s in series:
        pts = []
        for i, v in enumerate(s["values"]):
            if v is None:
                continue
            pts.append(f"{x_px(i):.1f},{y_px(v):.1f}")
        if pts:
            parts.append(
                f'<polyline fill="none" stroke="{s["color"]}" stroke-width="2.5" points="{" ".join(pts)}"/>'
            )
            for i, v in enumerate(s["values"]):
                if v is not None:
                    parts.append(
                        f'<circle cx="{x_px(i):.1f}" cy="{y_px(v):.1f}" r="4" fill="{s["color"]}"/>'
                    )
    step = max(1, len(x_labels) // 12)
    for i, lab in enumerate(x_labels):
        if i % step and i != len(x_labels) - 1:
            continue
        parts.append(
            f'<text x="{x_px(i):.1f}" y="{height-18}" text-anchor="middle" font-size="11" fill="#55606a">{_esc(lab)}</text>'
        )
    parts.append("</svg>")
    path.write_text("\n".join(parts), encoding="utf-8")
