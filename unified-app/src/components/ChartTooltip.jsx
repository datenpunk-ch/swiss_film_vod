import { intFmt, metricShare, metricValue, pctFmt } from "../utils/format.js";

function resolveTitle(label, row) {
  if (row?.week != null && row.week !== "") return `Kinowoche ${row.week}`;
  if (row?.legendLabel) return row.legendLabel;
  if (row?.tickLabel) return row.tickLabel;
  if (row?.label) return row.label;
  if (typeof label === "string" && label && !/^\d+$/.test(label)) return label;
  return "";
}

function formatTooltipValue(entry, metric, showShare) {
  const entryRow = entry.payload;
  const val = entry.value;
  if (showShare && metric && entryRow) {
    return `${intFmt.format(metricValue(entryRow, metric))} (${pctFmt.format(metricShare(entryRow, metric))})`;
  }
  if (val != null && Number.isFinite(Number(val))) {
    return intFmt.format(Number(val));
  }
  if (metric && entryRow) {
    return intFmt.format(metricValue(entryRow, metric));
  }
  return intFmt.format(0);
}

/** Tooltip mit lesbarem Label (kein Index 0, 1, 2 …). */
export default function ChartTooltip({ active, payload, label, metric, showShare = false }) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  const title = resolveTitle(label, row);

  return (
    <div className="chart-tooltip">
      {title ? <p className="chart-tooltip-title">{title}</p> : null}
      <ul className="chart-tooltip-list">
        {payload.map((entry) => {
          const text = formatTooltipValue(entry, metric, showShare);
          return (
            <li key={entry.dataKey ?? entry.name}>
              <span className="chart-tooltip-dot" style={{ background: entry.color }} />
              <span>{entry.name}</span>
              <strong>{text}</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
