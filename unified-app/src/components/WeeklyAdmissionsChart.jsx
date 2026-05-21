import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, BAYES_TOOLTIP_WRAPPER_STYLE, PALETTE, SERIES_PAIR } from "../constants.js";
import { barFillForValue, enrichWeeklyProfile } from "../utils/weeklyChart.js";
import ChartBox from "./ChartBox.jsx";
import ChartResponsive from "./ChartResponsive.jsx";
import WeeklySeasonTooltip from "./WeeklySeasonTooltip.jsx";

const MARGIN = { top: 16, right: 24, left: 56, bottom: 56 };

function WeeklyXAxisTick({ x, y, payload, dataByWeek }) {
  const row = dataByWeek.get(payload?.value);
  const week = payload?.value;
  const showWeek = week === 1 || week % 4 === 1;
  return (
    <g transform={`translate(${x},${y})`}>
      {showWeek ? (
        <text textAnchor="middle" fill={PALETTE.muted} fontSize={10} dy={12}>
          {week}
        </text>
      ) : null}
      {row?.showMonth && row.monthLabel ? (
        <text textAnchor="middle" fill={PALETTE.ink} fontSize={10} fontWeight={600} dy={26}>
          {row.monthLabel}
        </text>
      ) : null}
    </g>
  );
}

export default function WeeklyAdmissionsChart({
  profile,
  years,
  height = 280,
  barName = "Ø Besuche",
  barColorLow = PALETTE.sandPale,
  barColorHigh = SERIES_PAIR.first,
}) {
  const data = useMemo(() => enrichWeeklyProfile(profile), [profile]);
  const dataByWeek = useMemo(() => new Map(data.map((d) => [d.week, d])), [data]);

  const { minAdm, maxAdm } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const row of data) {
      const v = row.admissions;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return {
      minAdm: Number.isFinite(min) ? min : 0,
      maxAdm: Number.isFinite(max) ? max : 0,
    };
  }, [data]);

  if (!data.length) {
    return <p className="panel-intro">Keine Wochendaten (P4) vorhanden.</p>;
  }

  const subtitle = years?.length ? `Mittel über ${years.join(", ")}` : "";
  const intFmt = new Intl.NumberFormat("de-CH");

  return (
    <div className="weekly-chart-wrap">
      {subtitle ? <p className="chart-subtitle">{subtitle}</p> : null}
      <ChartBox height={height}>
        <ChartResponsive height={height}>
          <BarChart data={data} barCategoryGap="8%" margin={MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} vertical={false} />
            <XAxis
              dataKey="week"
              tick={<WeeklyXAxisTick dataByWeek={dataByWeek} />}
              tickMargin={4}
              interval={0}
              height={48}
            >
              <Label
                value="Kinowoche · Monat (ca.)"
                position="bottom"
                offset={4}
                style={{ fontSize: 11, fill: "#55606a" }}
              />
            </XAxis>
            <YAxis
              tick={AXIS.tick}
              tickMargin={6}
              tickFormatter={(v) => intFmt.format(v)}
              width={56}
              domain={[0, (max) => (max > 0 ? max * 1.05 : 1)]}
              axisLine={{ stroke: PALETTE.axis }}
              tickLine={{ stroke: PALETTE.axis }}
            />
            <Tooltip
              wrapperStyle={BAYES_TOOLTIP_WRAPPER_STYLE}
              allowEscapeViewBox={false}
              content={<WeeklySeasonTooltip />}
            />
            <Bar
              dataKey="admissions"
              name={barName}
              isAnimationActive={false}
              maxBarSize={32}
              radius={[2, 2, 0, 0]}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.week}
                  fill={barFillForValue(entry.admissions, minAdm, maxAdm, barColorLow, barColorHigh)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartResponsive>
      </ChartBox>
    </div>
  );
}
