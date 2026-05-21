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
import { AXIS, BAYES_TOOLTIP_WRAPPER_STYLE, DIMMED_SERIES_OPACITY, PALETTE } from "../constants.js";
import { withAlpha } from "../utils/colorAlpha.js";
import { pctFmt } from "../utils/format.js";
import { isDimmedYear } from "../utils/yearDisplay.js";
import CategoryLegend from "./CategoryLegend.jsx";
import ChartBox from "./ChartBox.jsx";
import ChartResponsive from "./ChartResponsive.jsx";
import YearShareTooltip from "./YearShareTooltip.jsx";

const MARGIN = { top: 8, left: 4, right: 4, bottom: 52 };

function prepareRows(data, series) {
  return (data ?? [])
    .filter((r) => r.year != null)
    .map((row) => {
      const entry = { year: row.year };
      for (const s of series) {
        entry[s.key] = Math.max(0, Number(row[s.key]) || 0);
      }
      return entry;
    });
}

function YearXTick({ x, y, payload, dimmedYears }) {
  const year = Number(payload?.value);
  const dimmed = isDimmedYear(year, dimmedYears);
  return (
    <text
      x={x}
      y={y}
      dy={12}
      textAnchor="end"
      transform={`rotate(-40, ${x}, ${y})`}
      fontSize={9}
      fill={dimmed ? PALETTE.axis : PALETTE.muted}
      opacity={dimmed ? 0.55 : 1}
    >
      {payload?.value}
    </text>
  );
}

export default function YearShareBarChart({
  data,
  series,
  height = 280,
  useFlags = false,
  dimmedYears,
}) {
  const rows = useMemo(() => prepareRows(data, series), [data, series]);

  if (!rows.length || !series?.length) {
    return <p className="panel-intro">Keine Jahresdaten.</p>;
  }

  const legendRows = series.map((s) => ({ id: s.key, label: s.label }));
  const legendColors = Object.fromEntries(series.map((s) => [s.key, s.color]));

  return (
    <figure className="year-share-chart">
      <div className="year-share-chart-inner">
        <div className="year-share-chart-plot">
          <ChartBox height={height}>
            <ChartResponsive height={height}>
              <BarChart data={rows} margin={MARGIN} stackOffset="expand" barCategoryGap="22%">
                <CartesianGrid strokeDasharray="2 4" stroke={PALETTE.gridLight} vertical={false} />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={{ stroke: PALETTE.axis }}
                  interval={0}
                  height={52}
                  tick={<YearXTick dimmedYears={dimmedYears} />}
                >
                  <Label value="Jahr" position="bottom" offset={8} style={{ fontSize: 10, fill: PALETTE.muted }} />
                </XAxis>
                <YAxis
                  type="number"
                  domain={[0, 1]}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
                  width={32}
                  tick={{ ...AXIS.tick, fontSize: 9 }}
                  tickMargin={2}
                  tickLine={false}
                  tickFormatter={(v) => pctFmt.format(v)}
                  axisLine={false}
                />
                <Tooltip
                  wrapperStyle={BAYES_TOOLTIP_WRAPPER_STYLE}
                  allowEscapeViewBox={false}
                  content={<YearShareTooltip rows={rows} series={series} />}
                />
                {series.map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    stackId="genre"
                    fill={s.color}
                    isAnimationActive={false}
                    maxBarSize={26}
                    minPointSize={1}
                    stroke="#fff"
                    strokeWidth={1}
                  >
                    {rows.map((entry) => {
                      const dimmed = isDimmedYear(entry.year, dimmedYears);
                      return (
                        <Cell
                          key={`${entry.year}-${s.key}`}
                          fill={dimmed ? withAlpha(s.color, DIMMED_SERIES_OPACITY) : s.color}
                        />
                      );
                    })}
                  </Bar>
                ))}
              </BarChart>
            </ChartResponsive>
          </ChartBox>
        </div>
        <CategoryLegend rows={legendRows} colors={legendColors} useFlags={useFlags} />
      </div>
    </figure>
  );
}
