/** Abwechslungsreiche Farben pro Land (Top-Länder). */
const COUNTRY_PALETTE = [
  "#b5542a",
  "#0b0d10",
  "#c4896e",
  "#5c7a8a",
  "#8b5a2b",
  "#6b4c9a",
  "#c25b4a",
  "#4a6741",
  "#8b6914",
  "#3d6b8e",
];

export function buildCountryColorMap(rows) {
  const map = {};
  rows.forEach((r, i) => {
    const key = r.id ?? r.label;
    if (!key) return;
    map[key] = COUNTRY_PALETTE[i % COUNTRY_PALETTE.length];
  });
  return map;
}

export function resolveChartColors(rows, colors) {
  if (colors && Object.keys(colors).length > 0) return colors;
  return buildCountryColorMap(rows);
}
