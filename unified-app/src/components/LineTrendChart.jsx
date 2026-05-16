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
import { AXIS, chartMarginWithLegendRight, legendRightProps, TOOLTIP_WRAPPER_STYLE } from "../constants.js";
import { intFmt, pctFmt } from "../utils/format.js";
import ChartBox from "./ChartBox.jsx";
import ChartTooltip from "./ChartTooltip.jsx";

export default function LineTrendChart({
  data,
  series,
  height = 240,
  yPercent = false,
  xKey = "year",
  xLabel = "Jahr",
}) {
  const merged = data.map((row) => {
    const out = { [xKey]: row[xKey] ?? row.year };
    for (const s of series) out[s.key] = row[s.key] ?? null;
    return out;
  });

  const tickFmt = yPercent ? (v) => pctFmt.format(v) : (v) => intFmt.format(v);
  const nSeries = series?.length ?? 2;

  return (
    <ChartBox height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={merged} margin={chartMarginWithLegendRight(nSeries)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey={xKey} tick={AXIS.tick} tickMargin={AXIS.tickMargin}>
            <Label value={xLabel} position="bottom" offset={12} style={{ fontSize: 11, fill: "#55606a" }} />
          </XAxis>
          <YAxis
            tick={AXIS.tick}
            tickMargin={AXIS.tickMargin}
            tickFormatter={tickFmt}
            width={56}
            domain={yPercent ? [0, 1] : ["auto", "auto"]}
            axisLine={{ stroke: "#b0b0b0" }}
            tickLine={{ stroke: "#b0b0b0" }}
          />
          <Tooltip
            wrapperStyle={TOOLTIP_WRAPPER_STYLE}
            allowEscapeViewBox={{ x: true, y: true }}
            content={<ChartTooltip />}
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
