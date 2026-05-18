import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, PALETTE, TOOLTIP_WRAPPER_STYLE } from "../constants.js";
import { resolveChartColors } from "../utils/countryColors.js";
import { metricLabel, metricValue } from "../utils/format.js";
import { sortRowsByMetric } from "../utils/sortRows.js";
import ChartBox from "./ChartBox.jsx";
import ChartTooltip from "./ChartTooltip.jsx";

const HIDDEN_TICK = false;

export default function CountryBarChart({
  rows = [],
  metric,
  colors: colorsProp,
  minHeight = 200,
  compact = true,
  hideAxisLabels = true,
  tooltipShowShare = false,
  prevRowById,
}) {
  const sorted = useMemo(() => sortRowsByMetric(rows, metric), [rows, metric]);
  const colors = useMemo(() => resolveChartColors(sorted, colorsProp), [sorted, colorsProp]);

  const data = useMemo(
    () =>
      sorted.map((r, i) => ({
        ...r,
        barKey: `row-${i}`,
        label: r.label,
        tickLabel: r.label,
        legendLabel: r.label,
        value: Number(metricValue(r, metric)) || 0,
      })),
    [sorted, metric]
  );

  if (!data.length) return null;

  const plotH = Math.max(minHeight, data.length * 30 + 40);
  const axisName = metricLabel(metric);
  const yAxisW = compact ? 76 : 100;
  const margin = { top: 4, right: 8, bottom: hideAxisLabels ? 8 : 28, left: 2 };

  return (
    <figure className="chart-figure is-row-bars is-absolute-chart is-country-bars">
      <ChartBox height={plotH}>
        <ResponsiveContainer width="100%" height={plotH} initialDimension={{ width: 220, height: plotH }}>
          <BarChart data={data} layout="vertical" margin={margin} barCategoryGap="12%">
            <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.gridLight} horizontal={false} />
            <XAxis
              type="number"
              tick={hideAxisLabels ? HIDDEN_TICK : { ...AXIS.tick, fontSize: 8 }}
              domain={[0, (max) => (max > 0 ? max * 1.06 : 1)]}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={yAxisW}
              tick={{ ...AXIS.tick, fontSize: compact ? 8 : 9 }}
              interval={0}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              wrapperStyle={TOOLTIP_WRAPPER_STYLE}
              allowEscapeViewBox={{ x: true, y: true }}
              content={<ChartTooltip metric={metric} showShare={tooltipShowShare} prevRowById={prevRowById} />}
            />
            <Bar dataKey="value" name={axisName} isAnimationActive={false} maxBarSize={compact ? 14 : 22} minPointSize={3}>
              {data.map((entry) => (
                <Cell key={entry.barKey} fill={colors[entry.label] ?? PALETTE.ink} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>
    </figure>
  );
}
