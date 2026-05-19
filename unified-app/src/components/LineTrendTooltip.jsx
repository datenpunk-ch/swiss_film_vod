import { formatYoYSharePp, formatYoYPercent, intFmt, pctFmt } from "../utils/format.js";

function resolveChShare(row, key, chShareDenominatorKey, chShareValueKey) {
  if (key !== "ch" || !row) return null;
  const official = chShareValueKey ? Number(row[chShareValueKey]) : NaN;
  if (Number.isFinite(official)) return official;
  const denom = chShareDenominatorKey ? Number(row[chShareDenominatorKey]) : NaN;
  const val = Number(row.ch);
  if (Number.isFinite(denom) && denom > 0 && Number.isFinite(val)) return val / denom;
  return null;
}

/** Tooltip für Jahres-Zeitreihen inkl. CH-Anteil und Vorjahr (%). */
export default function LineTrendTooltip({
  active,
  payload,
  label,
  chShareDenominatorKey,
  chShareValueKey = "ch_share",
  dataByYear,
  percentTooltip = false,
}) {
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
          let text = "—";
          if (Number.isFinite(val)) {
            text = percentTooltip || key === "ch_share" ? pctFmt.format(val) : intFmt.format(val);
          }

          if (!percentTooltip && key !== "ch_share") {
            const share = resolveChShare(row, key, chShareDenominatorKey, chShareValueKey);
            if (share != null) text += ` (${pctFmt.format(share)})`;
          }

          const prevVal = prevRow ? Number(prevRow[key]) : null;
          const yoy = percentTooltip
            ? formatYoYSharePp(val, prevVal)
            : formatYoYPercent(val, prevVal);
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
