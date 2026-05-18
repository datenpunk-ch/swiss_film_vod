import { useMemo } from "react";
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, chartMarginWithLegendRight, legendRightProps, PALETTE, TOOLTIP_WRAPPER_STYLE } from "../constants.js";
import { intFmt, pctFmt } from "../utils/format.js";
import ChartBox from "./ChartBox.jsx";
import LineTrendTooltip from "./LineTrendTooltip.jsx";

export default function LineTrendChart({
  data,
  series,
  height = 240,
  yPercent = false,
  xKey = "year",
  xLabel = "Jahr",
  chShareDenominatorKey,
}) {
  const merged = data.map((row) => {
    const out = { [xKey]: row[xKey] ?? row.year };
    for (const s of series) out[s.key] = row[s.key] ?? null;
    return out;
  });

  const tickFmt = yPercent ? (v) => pctFmt.format(v) : (v) => intFmt.format(v);
  const nSeries = series?.length ?? 2;

  const dataByYear = useMemo(() => {
    const map = new Map();
    for (const row of merged) {
      const y = Number(row[xKey] ?? row.year);
      if (Number.isFinite(y)) map.set(y, row);
    }
    return map;
  }, [merged, xKey]);

  return (
    <ChartBox height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={merged} margin={chartMarginWithLegendRight(nSeries)}>
          <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} />
          <XAxis dataKey={xKey} tick={AXIS.tick} tickMargin={AXIS.tickMargin}>
            <Label value={xLabel} position="bottom" offset={12} style={{ fontSize: 11, fill: PALETTE.muted }} />
          </XAxis>
          <YAxis
            tick={AXIS.tick}
            tickMargin={AXIS.tickMargin}
            tickFormatter={tickFmt}
            width={56}
            domain={yPercent ? [0, 1] : ["auto", "auto"]}
            axisLine={{ stroke: PALETTE.axis }}
            tickLine={{ stroke: PALETTE.axis }}
          />
          <Tooltip
            wrapperStyle={TOOLTIP_WRAPPER_STYLE}
            allowEscapeViewBox={{ x: true, y: true }}
            content={
              <LineTrendTooltip chShareDenominatorKey={chShareDenominatorKey} dataByYear={dataByYear} />
            }
          />
          <Legend {...legendRightProps(nSeries)} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}
