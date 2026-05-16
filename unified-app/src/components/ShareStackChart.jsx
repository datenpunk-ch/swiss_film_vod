import { useMemo } from "react";
import { resolveChartColors } from "../utils/countryColors.js";
import { metricShare, metricValue, pctFmt } from "../utils/format.js";
import { sortRowsByMetric } from "../utils/sortRows.js";
import CountryFlag from "./CountryFlag.jsx";

function partShareValue(row, metric, marketIntensity) {
  if (metric === "intensity" && marketIntensity > 0) {
    return metricValue(row, metric) / marketIntensity;
  }
  return Math.max(metricShare(row, metric), 0);
}

function formatLegendShare(part, metric, marketIntensity) {
  if (metric === "intensity" && marketIntensity > 0) {
    return pctFmt.format(part.abs / marketIntensity);
  }
  return pctFmt.format(part.value);
}

/** Nur Prozentliste — ohne horizontalen Anteils-Balken. */
export default function ShareStackChart({
  rows,
  colors: colorsProp,
  metric,
  useFlags = false,
  marketIntensity,
  usePxBenchmark = true,
}) {
  const sorted = useMemo(() => sortRowsByMetric(rows ?? [], metric), [rows, metric]);
  const colors = useMemo(
    () => resolveChartColors(sorted, colorsProp),
    [sorted, colorsProp]
  );

  const axisLabel =
    metric === "intensity"
      ? usePxBenchmark
        ? "Relativ zum Markt-Ø"
        : "Relativ zum Kanal-Ø"
      : "Anteil am Total";

  const parts = sorted.map((r) => ({
    id: r.id ?? r.label,
    label: r.label,
    value: partShareValue(r, metric, marketIntensity),
    abs: metricValue(r, metric),
  }));

  if (parts.length === 0) return null;

  return (
    <div className="share-stack-block">
      <p className="chart-detail-label share-section-label">{axisLabel}</p>
      <ul className="share-pct-legend" aria-label={axisLabel}>
        {parts.map((p) => (
          <li key={p.id}>
            <span className="swatch" style={{ background: colors[p.id] }} aria-hidden="true" />
            {useFlags && p.label !== "Andere" ? <CountryFlag label={p.label} size={16} /> : null}
            <span className="share-pct-label">{p.label}</span>
            <strong className="share-pct-value">{formatLegendShare(p, metric, marketIntensity)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
