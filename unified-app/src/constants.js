/** Gemeinsames Farbschema für alle Dashboard-Grafiken. */
export const PALETTE = {
  ink: "#0b0d10",
  accent: "#b5542a",
  sand: "#c4896e",
  sandLight: "#e5d4c8",
  sandPale: "#e8ddd6",
  slate: "#5c7a8a",
  muted: "#55606a",
  grid: "#e0e0e0",
  gridLight: "#e8e8e8",
  axis: "#b0b0b0",
};

/** Erste Kategorie schwarz, zweite rostrot — für Vergleichsreihen. */
export const SERIES_PAIR = {
  first: PALETTE.ink,
  second: PALETTE.accent,
};

/** Nachfrage / Angebot / Intensität. */
export const METRIC_COLORS = {
  demand: SERIES_PAIR.first,
  supply: SERIES_PAIR.first,
  intensity: PALETTE.slate,
};

/** CH rostrot, Europa beige, übrige Welt schwarz. */
export const ORIGIN_COLORS = { ch: PALETTE.accent, eu: PALETTE.sandLight, ww: PALETTE.ink };
export const GENRE_COLORS = { fic: SERIES_PAIR.first, doc: SERIES_PAIR.second, ani: PALETTE.sand };

export const CHART_MARGIN = { top: 16, right: 20, left: 12, bottom: 12 };

export const AXIS = {
  tick: { fontSize: 11, fill: PALETTE.muted },
  tickMargin: 8,
};

export const TOOLTIP_WRAPPER_STYLE = {
  zIndex: 100000,
  pointerEvents: "none",
  outline: "none",
};

export function legendRightProps(seriesCount = 2) {
  return {
    layout: "vertical",
    align: "right",
    verticalAlign: "middle",
    iconType: "line",
    wrapperStyle: { paddingLeft: 22, lineHeight: "1.55" },
    width: Math.max(92, seriesCount * 54),
  };
}

export function chartMarginWithLegendRight(seriesCount = 2, base = CHART_MARGIN) {
  const legendW = Math.max(108, seriesCount * 58);
  return { ...base, left: 72, bottom: 36, right: legendW + 16, top: 16 };
}

export const Y_AXIS_LABEL_PROPS = {
  angle: -90,
  position: "left",
  style: { fontSize: 11, fill: PALETTE.muted, textAnchor: "middle" },
};

/** Angebot zuerst, dann Nachfrage. */
export const METRICS = [
  { id: "supply", label: "Angebot (Filme)", title: "Angebot" },
  { id: "demand", label: "Nachfrage (Besuche / Views)", title: "Nachfrage" },
  { id: "intensity", label: "Ø Besuche je Film", title: "Intensität" },
];
