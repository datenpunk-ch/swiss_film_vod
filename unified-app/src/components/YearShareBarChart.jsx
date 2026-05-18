import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, PALETTE, TOOLTIP_WRAPPER_STYLE } from "../constants.js";
import { pctFmt } from "../utils/format.js";
import CategoryLegend from "./CategoryLegend.jsx";
import ChartBox from "./ChartBox.jsx";
import ChartResponsive from "./ChartResponsive.jsx";
import YearShareTooltip from "./YearShareTooltip.jsx";

const MARGIN = { top: 12, left: 4, right: 4, bottom: 48 };

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

export default function YearShareBarChart({ data, series, height = 280 }) {
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
              <BarChart data={rows} margin={MARGIN} stackOffset="expand" barCategoryGap="10%">
                <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridLight} vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ ...AXIS.tick, fontSize: 10 }}
                  tickLine={{ stroke: PALETTE.axis }}
                  axisLine={{ stroke: PALETTE.axis }}
                  interval={0}
                  angle={-40}
                  textAnchor="end"
                  height={48}
                >
                  <Label value="Jahr" position="bottom" offset={4} style={{ fontSize: 11, fill: PALETTE.muted }} />
                </XAxis>
                <YAxis
                  type="number"
                  domain={[0, 1]}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
                  width={36}
                  tick={{ ...AXIS.tick, fontSize: 10 }}
                  tickMargin={4}
                  tickFormatter={(v) => pctFmt.format(v)}
                  axisLine={{ stroke: PALETTE.axis }}
                  tickLine={{ stroke: PALETTE.axis }}
                />
                <Tooltip
                  wrapperStyle={TOOLTIP_WRAPPER_STYLE}
                  content={<YearShareTooltip rows={rows} />}
                />
                {series.map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    stackId="genre"
                    fill={s.color}
                    isAnimationActive={false}
                    maxBarSize={48}
                    minPointSize={2}
                  />
                ))}
              </BarChart>
            </ChartResponsive>
          </ChartBox>
        </div>
        <CategoryLegend rows={legendRows} colors={legendColors} />
      </div>
    </figure>
  );
}
