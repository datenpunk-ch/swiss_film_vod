import { intFmt, metricShare, metricValue, formatYoYPercent, pctFmt } from "../utils/format.js";
import BayesTooltipFrame from "./BayesTooltipFrame.jsx";

function resolveTitle(label, row) {
  if (row?.week != null && row.week !== "") {
    const month = row.monthLabel ? ` · ${row.monthLabel}` : "";
    return `Kinowoche ${row.week}${month}`;
  }
  if (row?.legendLabel) return row.legendLabel;
  if (row?.tickLabel) return row.tickLabel;
  if (row?.label) return row.label;
  if (typeof label === "string" && label && !/^\d+$/.test(label)) return label;
  return "";
}

function rowLookupKey(row) {
  return row?.id ?? row?.label;
}

function formatTooltipValue(entry, metric, showShare, prevRowById) {
  const entryRow = entry.payload;
  if (!entryRow) return intFmt.format(0);

  const val = entry.value;
  const cur = metric && entryRow ? metricValue(entryRow, metric) : Number(val);
  const prevRow = prevRowById?.[rowLookupKey(entryRow)];
  const prev = prevRow && metric ? metricValue(prevRow, metric) : null;
  const yoy = formatYoYPercent(cur, prev);

  if (showShare && metric) {
    const base = `${intFmt.format(cur)} (${pctFmt.format(metricShare(entryRow, metric))})`;
    return yoy ? `${base} · ${yoy}` : base;
  }
  if (val != null && Number.isFinite(Number(val))) {
    const base = intFmt.format(Number(val));
    return yoy ? `${base} · ${yoy}` : base;
  }
  if (metric) {
    const base = intFmt.format(cur);
    return yoy ? `${base} · ${yoy}` : base;
  }
  return intFmt.format(0);
}

export default function ChartTooltip({
  active,
  payload,
  label,
  coordinate,
  metric,
  showShare = false,
  prevRowById,
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  const title = resolveTitle(label, row);

  const inner = (
    <>
      {title ? <p className="chart-tooltip-title">{title}</p> : null}
      <ul className="chart-tooltip-list">
        {payload.map((entry) => {
          const text = formatTooltipValue(entry, metric, showShare, prevRowById);
          return (
            <li key={entry.dataKey ?? entry.name}>
              <span className="chart-tooltip-dot" style={{ background: entry.color }} />
              <span>{entry.name}</span>
              <strong>{text}</strong>
            </li>
          );
        })}
      </ul>
    </>
  );

  if (!coordinate) {
    return <div className="chart-tooltip">{inner}</div>;
  }

  return (
    <BayesTooltipFrame
      active={active}
      coordinate={coordinate}
      variant="list"
      itemCount={payload.length}
    >
      {inner}
    </BayesTooltipFrame>
  );
}
