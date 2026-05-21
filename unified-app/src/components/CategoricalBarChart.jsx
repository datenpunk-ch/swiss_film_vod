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
import { AXIS, BAYES_TOOLTIP_WRAPPER_STYLE, PALETTE } from "../constants.js";
import { resolveChartColors } from "../utils/countryColors.js";
import { metricLabel, metricValue } from "../utils/format.js";
import { sortRowsByMetric } from "../utils/sortRows.js";
import CategoryLegend from "./CategoryLegend.jsx";
import ChartBox from "./ChartBox.jsx";
import ChartTooltip from "./ChartTooltip.jsx";

const AXIS_LINE = { stroke: PALETTE.axis };
const TICK_LINE = { stroke: PALETTE.axis };
const HIDDEN_TICK = false;

function plotHeight(count, compact) {
  return compact ? 175 : count <= 4 ? 200 : Math.max(220, count * 28 + 52);
}

export default function CategoricalBarChart({
  rows = [],
  metric,
  colors: colorsProp,
  height,
  minHeight,
  showCategoryLegend = true,
  sortByValue = true,
  useFlags = false,
  compact = false,
  hideAxisLabels = false,
  tooltipShowShare = false,
  prevRowById,
}) {
  const sorted = useMemo(
    () => (sortByValue ? sortRowsByMetric(rows, metric) : rows),
    [rows, metric, sortByValue]
  );

  const colors = useMemo(
    () => resolveChartColors(sorted, colorsProp),
    [sorted, colorsProp]
  );

  const data = useMemo(
    () =>
      sorted.map((r, i) => ({
        ...r,
        id: r.id ?? r.label,
        barKey: `row-${i}`,
        value: Number(metricValue(r, metric)) || 0,
        tickLabel: r.label,
        legendLabel: r.label,
      })),
    [sorted, metric]
  );

  const autoH = plotHeight(data.length, compact);
  const floor = minHeight ?? height;
  const plotH = floor != null ? Math.max(floor, autoH) : autoH;
  const axisName = metricLabel(metric);

  const yAxisW = hideAxisLabels ? 8 : compact ? 56 : 60;
  const margin = {
    top: 8,
    right: 8,
    bottom: hideAxisLabels ? 12 : compact ? 44 : 40,
    left: hideAxisLabels ? 4 : yAxisW + 12,
  };

  const chart = (
    <ChartBox height={plotH}>
      <ResponsiveContainer width="100%" height={plotH} initialDimension={{ width: 200, height: plotH }}>
        <BarChart data={data} margin={margin} barCategoryGap={compact ? "20%" : "22%"}>
            <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} vertical={false} />
            <XAxis
              dataKey="tickLabel"
              tick={hideAxisLabels ? HIDDEN_TICK : { ...AXIS.tick, fontSize: compact ? 8 : 9 }}
              tickMargin={4}
              interval={0}
              angle={hideAxisLabels ? 0 : compact ? -32 : -22}
              textAnchor={hideAxisLabels ? "middle" : "end"}
              height={hideAxisLabels ? 8 : compact ? 52 : 46}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              tick={hideAxisLabels ? HIDDEN_TICK : { ...AXIS.tick, fontSize: compact ? 8 : 9 }}
              domain={[0, (max) => (max > 0 ? max * 1.08 : 1)]}
              width={yAxisW}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              wrapperStyle={BAYES_TOOLTIP_WRAPPER_STYLE}
              allowEscapeViewBox={false}
              content={<ChartTooltip metric={metric} showShare={tooltipShowShare} prevRowById={prevRowById} />}
            />
            <Bar dataKey="value" name={axisName} isAnimationActive={false} maxBarSize={compact ? 36 : 48} minPointSize={4}>
              {data.map((entry) => (
                <Cell key={entry.barKey} fill={colors[entry.id] ?? PALETTE.ink} />
              ))}
            </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );

  return (
    <figure className={`chart-figure is-column-bars is-absolute-chart${compact ? " is-compact" : ""}`}>
      {showCategoryLegend ? (
        <div className="chart-with-side-legend">
          <div className="chart-with-side-legend__plot">{chart}</div>
          <CategoryLegend rows={sorted} colors={colors} useFlags={useFlags} />
        </div>
      ) : (
        chart
      )}
    </figure>
  );
}
