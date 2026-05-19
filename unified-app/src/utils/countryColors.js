import { PALETTE } from "../constants.js";

/** Eine Farbe pro Land (Top-Länder + «Andere»). */
const COUNTRY_PALETTE = [
  PALETTE.ink,
  PALETTE.accent,
  PALETTE.sand,
  PALETTE.slate,
  "#8b5a2b",
  "#6b4c9a",
  "#c25b4a",
  "#4a6741",
  "#8b6914",
  "#3d6b8e",
  "#9a6b4c",
  "#2d6a6a",
];

export function buildCountryColorMap(rows) {
  const map = {};
  const seen = new Set();
  let index = 0;
  for (const r of rows ?? []) {
    const key = r.id ?? r.label;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    map[key] = COUNTRY_PALETTE[index % COUNTRY_PALETTE.length];
    index += 1;
  }

  if (map.ch != null) map.ch = PALETTE.accent;
  if (map.Schweiz != null) map.Schweiz = PALETTE.accent;

  return map;
}

export function resolveChartColors(rows, colors) {
  if (colors && Object.keys(colors).length > 0) return colors;
  return buildCountryColorMap(rows);
}
