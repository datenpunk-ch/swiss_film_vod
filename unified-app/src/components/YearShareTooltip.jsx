import { pctFmt, formatYoYPercent } from "../utils/format.js";

export default function YearShareTooltip({ active, payload, label, rows, series }) {
  if (!active || !payload?.length) return null;

  const slice = payload[0]?.payload;
  const year = Number(slice?.year ?? label ?? payload[0]?.payload?.year);
  const row = Number.isFinite(year) ? rows?.find((r) => r.year === year) ?? slice : slice;
  const prevRow = Number.isFinite(year) ? rows?.find((r) => r.year === year - 1) : null;
  const title = Number.isFinite(year) ? String(year) : "";

  const items = series?.length
    ? series.map((s) => ({
        key: s.key,
        name: s.label,
        val: Number(row?.[s.key]),
        color: s.color,
      }))
    : payload.map((entry) => ({
        key: entry.dataKey,
        name: entry.name,
        val: Number(entry.value),
        color: entry.color,
      }));

  return (
    <div className="chart-tooltip">
      {title ? <p className="chart-tooltip-title">{title}</p> : null}
      <ul className="chart-tooltip-list">
        {items.map((entry) => {
          let text = Number.isFinite(entry.val) ? pctFmt.format(entry.val) : "—";
          const prevVal = prevRow ? Number(prevRow[entry.key]) : null;
          const yoy = formatYoYPercent(entry.val, prevVal);
          if (yoy) text += ` · ${yoy}`;

          return (
            <li key={entry.key ?? entry.name}>
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
