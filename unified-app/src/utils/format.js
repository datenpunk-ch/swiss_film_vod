export const intFmt = new Intl.NumberFormat("de-CH");
export const pctFmt = new Intl.NumberFormat("de-CH", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function metricLabel(metric) {
  if (metric === "supply") return "Angebot (Filme)";
  if (metric === "intensity") return "Ø Eintritte je Film";
  return "Nachfrage (Eintritte / Views)";
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
