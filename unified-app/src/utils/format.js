export const intFmt = new Intl.NumberFormat("de-CH");
export const pctFmt = new Intl.NumberFormat("de-CH", {
  style: "percent",
  maximumFractionDigits: 1,
});

const deltaPctFmt = new Intl.NumberFormat("de-CH", {
  style: "percent",
  signDisplay: "exceptZero",
  maximumFractionDigits: 1,
});

const pctAbsFmt = new Intl.NumberFormat("de-CH", {
  style: "percent",
  maximumFractionDigits: 1,
});

/** Abweichung vom Durchschnitt: +25 % = 25 % über Benchmark (Index 125 → +25 %). */
export function formatVsMarketDelta(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return deltaPctFmt.format(ratio - 1);
}

/** Prozentuale Änderung mit Pfeil (↑ / ↓) statt Vorzeichen — für Tooltips. */
export function formatDeltaPercentWithArrow(current, previous) {
  if (current == null || previous == null || !Number.isFinite(previous) || previous === 0) return null;
  if (!Number.isFinite(current)) return null;
  const change = current / previous - 1;
  if (Math.abs(change) < 1e-12) return pctAbsFmt.format(0);
  const arrow = change > 0 ? "↑" : "↓";
  return `${arrow} ${pctAbsFmt.format(Math.abs(change))}`;
}

/** Prozentuale Änderung zum Vorjahr (absolute Kennzahlen). */
export function formatYoYCount(current, previous) {
  if (current == null || previous == null || !Number.isFinite(previous) || previous === 0) return null;
  if (!Number.isFinite(current)) return null;
  return `${formatVsMarketDelta(current / previous)} ggü. Vorjahr`;
}

/** Prozentuale Änderung zum Vorjahr (für Tooltips und Anteilslisten, mit Pfeil). */
export function formatYoYPercent(current, previous) {
  const delta = formatDeltaPercentWithArrow(current, previous);
  if (!delta) return null;
  return `${delta} ggü. Vorjahr`;
}

export function indexRowsById(rows, idKey = "id") {
  const map = {};
  for (const r of rows ?? []) {
    const key = r[idKey] ?? r.label;
    if (key != null && key !== "") map[key] = r;
  }
  return map;
}

/** Änderung in Prozentpunkten für Anteile (0–1). */
export function formatYoYSharePp(current, previous) {
  if (current == null || previous == null) return null;
  const pp = (current - previous) * 100;
  const ppFmt = new Intl.NumberFormat("de-CH", {
    signDisplay: "exceptZero",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
  return `${ppFmt.format(pp)} Pp. ggü. Vorjahr`;
}

export function metricLabel(metric) {
  if (metric === "supply") return "Angebot (Filme)";
  if (metric === "intensity") return "Ø Besuche je Film";
  return "Nachfrage (Besuche / Views)";
}

export function metricValue(row, metric) {
  if (metric === "supply") return row.supply ?? 0;
  if (metric === "intensity") {
    if (row.intensity != null && Number.isFinite(row.intensity)) return row.intensity;
    const supply = row.supply ?? 0;
    const demand = row.demand ?? 0;
    return supply > 0 ? demand / supply : 0;
  }
  return row.demand ?? 0;
}

export function metricShare(row, metric) {
  if (metric === "supply") return row.share_supply ?? 0;
  if (metric === "intensity") return row.intensity ?? 0;
  return row.share_demand ?? row.share ?? 0;
}

export function isShareMetric(metric) {
  return metric === "demand" || metric === "supply";
}
