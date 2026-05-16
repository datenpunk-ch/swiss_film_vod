export const ORIGIN_COLORS = { ch: "#b5542a", eu: "#c4896e", ww: "#e5d4c8" };
export const GENRE_COLORS = { fic: "#0b0d10", doc: "#b5542a", ani: "#c4896e" };

export const CHART_MARGIN = { top: 16, right: 20, left: 12, bottom: 12 };

export const AXIS = {
  tick: { fontSize: 11, fill: "#55606a" },
  tickMargin: 8,
};

export const TOOLTIP_WRAPPER_STYLE = {
  zIndex: 100000,
  pointerEvents: "none",
  outline: "none",
};

/** Legende rechts neben dem Plot (Zeitreihen / horizontale Charts). */
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

/** Y-Achsen-Beschriftung links, ohne Überlappung mit Tick-Zahlen. */
export const Y_AXIS_LABEL_PROPS = {
  angle: -90,
  position: "left",
  style: { fontSize: 11, fill: "#55606a", textAnchor: "middle" },
};

export const METRICS = [
  { id: "demand", label: "Nachfrage (Besucher / Views)" },
  { id: "supply", label: "Angebot (Filme)" },
  { id: "intensity", label: "Ø Besucher je Film" },
];
