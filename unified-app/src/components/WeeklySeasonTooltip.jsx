import { intFmt } from "../utils/format.js";
import BayesTooltipFrame from "./BayesTooltipFrame.jsx";

export default function WeeklySeasonTooltip({ active, payload, coordinate }) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  const entry = payload[0];
  if (!row) return null;

  const title = row.monthLabel ? `Kinowoche ${row.week} · ${row.monthLabel}` : `Kinowoche ${row.week}`;
  const val = Number(entry.value);
  const text = Number.isFinite(val) ? intFmt.format(val) : "—";

  const inner = (
    <>
      <p className="chart-tooltip-title">{title}</p>
      <ul className="chart-tooltip-list">
        <li>
          <span className="chart-tooltip-dot" style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <strong>{text}</strong>
        </li>
      </ul>
    </>
  );

  if (!coordinate) {
    return <div className="chart-tooltip">{inner}</div>;
  }

  return (
    <BayesTooltipFrame active={active} coordinate={coordinate} variant="list" itemCount={1}>
      {inner}
    </BayesTooltipFrame>
  );
}
