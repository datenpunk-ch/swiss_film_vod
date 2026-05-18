import { intFmt, formatYoYPercent, pctFmt } from "../utils/format.js";

/** Tooltip für Jahres-Zeitreihen inkl. CH-Anteil und Vorjahr (%). */
export default function LineTrendTooltip({ active, payload, label, chShareDenominatorKey, dataByYear }) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  const title = row?.year != null ? String(row.year) : label ?? "";
  const year = row?.year != null ? Number(row.year) : null;
  const prevRow = year != null && dataByYear ? dataByYear.get(year - 1) : null;

  return (
    <div className="chart-tooltip">
      {title ? <p className="chart-tooltip-title">{title}</p> : null}
      <ul className="chart-tooltip-list">
        {payload.map((entry) => {
          const val = Number(entry.value);
          const key = entry.dataKey;
          let text = Number.isFinite(val) ? intFmt.format(val) : "—";

          if (
            chShareDenominatorKey &&
            key === "ch" &&
            row &&
            Number.isFinite(Number(row[chShareDenominatorKey])) &&
            Number(row[chShareDenominatorKey]) > 0 &&
            Number.isFinite(val)
          ) {
            text += ` (${pctFmt.format(val / Number(row[chShareDenominatorKey]))})`;
          }

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
