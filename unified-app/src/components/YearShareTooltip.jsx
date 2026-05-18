import { pctFmt, formatYoYPercent } from "../utils/format.js";

export default function YearShareTooltip({ active, payload, label, rows }) {
  if (!active || !payload?.length) return null;

  const year = Number(label ?? payload[0]?.payload?.year);
  const row = payload[0]?.payload;
  const prevRow = Number.isFinite(year) ? rows?.find((r) => r.year === year - 1) : null;
  const title = Number.isFinite(year) ? String(year) : "";

  return (
    <div className="chart-tooltip">
      {title ? <p className="chart-tooltip-title">{title}</p> : null}
      <ul className="chart-tooltip-list">
        {payload.map((entry) => {
          const key = entry.dataKey;
          const val = Number(entry.value);
          let text = Number.isFinite(val) ? pctFmt.format(val) : "—";
          const prevVal = prevRow ? Number(prevRow[key]) : null;
          const yoy = formatYoYPercent(val, prevVal);
          if (yoy) text += ` · ${yoy}`;

          return (
            <li key={key ?? entry.name}>
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
