import { PALETTE } from "../constants.js";

/** Feste Farben für Kernländer (Zeitreihen + Top-Länder). */
export const COUNTRY_COLORS = {
  us: PALETTE.ink,
  ch: PALETTE.accent,
  fr: "#3d6b8e",
  de: "#4a6741",
  uk: "#6b4c9a",
  it: "#c25b4a",
};

/** Weitere Länder / «Andere» — ohne Schwarz und Rostrot. */
const OTHER_COUNTRY_PALETTE = [
  "#8b6914",
  "#2d6a6a",
  "#9a6b4c",
  "#5c7a8a",
  "#8b5a2b",
  "#7a4a6a",
];

const US_IDS = new Set(["us", "usa", "vereinigte staaten", "united states"]);
const CH_IDS = new Set(["ch", "schweiz", "switzerland"]);

function normalizeCountryKey(id, label) {
  const raw = String(id ?? label ?? "")
    .trim()
    .toLowerCase();
  if (US_IDS.has(raw) || /vereinigte staaten|united states/.test(raw)) return "us";
  if (CH_IDS.has(raw) || raw === "schweiz") return "ch";
  return raw;
}

export function countryColorFor(id, label) {
  const key = normalizeCountryKey(id, label);
  if (COUNTRY_COLORS[key]) return COUNTRY_COLORS[key];
  return null;
}

export function buildCountryColorMap(rows) {
  const map = {};
  const seen = new Set();
  let otherIndex = 0;

  for (const r of rows ?? []) {
    const id = r.id ?? r.label;
    const key = normalizeCountryKey(id, r.label);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const fixed = countryColorFor(id, r.label);
    if (fixed) {
      map[id] = fixed;
      if (key !== id) map[key] = fixed;
      continue;
    }

    const color = OTHER_COUNTRY_PALETTE[otherIndex % OTHER_COUNTRY_PALETTE.length];
    otherIndex += 1;
    map[id] = color;
    if (key !== id) map[key] = color;
  }

  return map;
}

export function resolveChartColors(rows, colors) {
  if (colors && Object.keys(colors).length > 0) return colors;
  return buildCountryColorMap(rows);
}
