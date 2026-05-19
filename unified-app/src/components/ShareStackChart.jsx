import { useMemo } from "react";
import { resolveChartColors } from "../utils/countryColors.js";
import { formatVsMarketDelta, formatYoYPercent, metricShare, metricValue, pctFmt } from "../utils/format.js";
import { sortRowsByMetric } from "../utils/sortRows.js";
import CountryFlag from "./CountryFlag.jsx";

function partShareValue(row, metric, marketIntensity) {
  if (metric === "intensity" && marketIntensity > 0) {
    return metricValue(row, metric) / marketIntensity;
  }
  return Math.max(metricShare(row, metric), 0);
}

function formatLegendShare(part, metric, marketIntensity, prevRowById) {
  let base;
  if (metric === "intensity" && marketIntensity > 0) {
    base = formatVsMarketDelta(part.abs / marketIntensity);
  } else {
    base = pctFmt.format(part.value);
  }

  const prev = prevRowById?.[part.id];
  if (prev) {
    const cur = metric === "intensity" ? part.abs : part.value;
    const prevVal =
      metric === "intensity" ? metricValue(prev, metric) : partShareValue(prev, metric, marketIntensity);
    const yoy = formatYoYPercent(cur, prevVal);
    if (yoy) base += ` · ${yoy}`;
  }

  return base;
}

/** Nur Prozentliste — ohne horizontalen Anteils-Balken. */
export default function ShareStackChart({
  rows,
  colors: colorsProp,
  metric,
  useFlags = false,
  marketIntensity,
  usePxBenchmark = true,
  prevRowById,
}) {
  const sorted = useMemo(() => sortRowsByMetric(rows ?? [], metric), [rows, metric]);
  const colors = useMemo(
    () => resolveChartColors(sorted, colorsProp),
    [sorted, colorsProp]
  );

  const axisLabel =
    metric === "intensity"
      ? usePxBenchmark
        ? "Interesse relativ zum Markt-Ø"
        : "Interesse relativ zum Kanal-Ø"
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
            {useFlags && p.label !== "Andere" && p.label !== "Übrige Länder" ? (
              <CountryFlag label={p.label} size={16} />
            ) : null}
            <span className="share-pct-label">{p.label}</span>
            <strong className="share-pct-value">{formatLegendShare(p, metric, marketIntensity, prevRowById)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
