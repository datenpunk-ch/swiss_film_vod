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
  chShareValueKey = "ch_share",
  shareSeriesKey,
  shareSeriesLabel = "Anteil Schweiz",
}) {
  const merged = useMemo(
    () =>
      (data ?? []).map((row) => {
        const out = { ...row };
        out[xKey] = row[xKey] ?? row.year;
        for (const s of series ?? []) out[s.key] = row[s.key] ?? null;
        return out;
      }),
    [data, series, xKey]
  );

  const tickFmt = yPercent ? (v) => pctFmt.format(v) : (v) => intFmt.format(v);
  const hasShareAxis =
    shareSeriesKey && merged.some((row) => row[shareSeriesKey] != null && Number.isFinite(Number(row[shareSeriesKey])));
  const nLegend = (series?.length ?? 0) + (hasShareAxis ? 1 : 0);

  const dataByYear = useMemo(() => {
    const map = new Map();
    for (const row of merged) {
      const y = Number(row[xKey] ?? row.year);
      if (Number.isFinite(y)) map.set(y, row);
    }
    return map;
  }, [merged, xKey]);

  const margin = chartMarginWithLegendRight(nLegend);

  return (
    <ChartBox height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={merged} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} />
          <XAxis dataKey={xKey} tick={AXIS.tick} tickMargin={AXIS.tickMargin}>
            <Label value={xLabel} position="bottom" offset={12} style={{ fontSize: 11, fill: PALETTE.muted }} />
          </XAxis>
          <YAxis
            yAxisId="left"
            tick={AXIS.tick}
            tickMargin={AXIS.tickMargin}
            tickFormatter={tickFmt}
            width={56}
            domain={yPercent ? [0, 1] : ["auto", "auto"]}
            axisLine={{ stroke: PALETTE.axis }}
            tickLine={{ stroke: PALETTE.axis }}
          />
          {hasShareAxis ? (
            <YAxis
              yAxisId="share"
              orientation="right"
              tick={AXIS.tick}
              tickMargin={6}
              tickFormatter={(v) => pctFmt.format(v)}
              width={48}
              domain={[0, "auto"]}
              axisLine={{ stroke: PALETTE.axis }}
              tickLine={{ stroke: PALETTE.axis }}
            />
          ) : null}
          <Tooltip
            wrapperStyle={TOOLTIP_WRAPPER_STYLE}
            allowEscapeViewBox={{ x: true, y: true }}
            content={
              <LineTrendTooltip
                chShareDenominatorKey={chShareDenominatorKey}
                chShareValueKey={chShareValueKey}
                dataByYear={dataByYear}
              />
            }
          />
          <Legend {...legendRightProps(nLegend)} />
          {series.map((s) => (
            <Line
              key={s.key}
              yAxisId="left"
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
          {hasShareAxis ? (
            <Line
              yAxisId="share"
              type="monotone"
              dataKey={shareSeriesKey}
              name={shareSeriesLabel}
              stroke={PALETTE.muted}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}
