import { useMemo } from "react";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS,
  chartMarginWithLegendRight,
  DIMMED_SERIES_OPACITY,
  PALETTE,
  TOOLTIP_WRAPPER_STYLE,
} from "../constants.js";
import { intFmt, pctFmt } from "../utils/format.js";
import { isDimmedYear } from "../utils/yearDisplay.js";
import CategoryLegend from "./CategoryLegend.jsx";
import ChartBox from "./ChartBox.jsx";
import LineTrendTooltip from "./LineTrendTooltip.jsx";

function TrendDot({ cx, cy, payload, color, dimmedYears }) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  const dimmed = isDimmedYear(payload?.year, dimmedYears);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={dimmed ? 2.5 : 3}
      fill={color}
      fillOpacity={dimmed ? DIMMED_SERIES_OPACITY : 1}
      stroke="#fff"
      strokeWidth={1}
    />
  );
}

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
  sharedYDomain = false,
  dimmedYears,
  hideLegend = false,
  percentTooltip = false,
}) {
  const merged = useMemo(() => {
    return (data ?? []).map((row) => {
      const out = { ...row };
      out[xKey] = row[xKey] ?? row.year;
      for (const s of series ?? []) out[s.key] = row[s.key] ?? null;
      return out;
    });
  }, [data, series, xKey]);

  const tickFmt = yPercent ? (v) => pctFmt.format(v) : (v) => intFmt.format(v);
  const hasShareAxis =
    shareSeriesKey &&
    merged.some((row) => row[shareSeriesKey] != null && Number.isFinite(Number(row[shareSeriesKey])));

  const legendRows = useMemo(() => {
    const rows = (series ?? []).map((s) => ({ id: s.key, label: s.label }));
    if (hasShareAxis) rows.push({ id: shareSeriesKey, label: shareSeriesLabel });
    return rows;
  }, [series, hasShareAxis, shareSeriesKey, shareSeriesLabel]);

  const legendColors = useMemo(() => {
    const colors = Object.fromEntries((series ?? []).map((s) => [s.key, s.color]));
    if (hasShareAxis) colors[shareSeriesKey] = PALETTE.muted;
    return colors;
  }, [series, hasShareAxis, shareSeriesKey]);

  const dataByYear = useMemo(() => {
    const map = new Map();
    for (const row of merged) {
      const y = Number(row[xKey] ?? row.year);
      if (Number.isFinite(y)) map.set(y, row);
    }
    return map;
  }, [merged, xKey]);

  const margin = hideLegend
    ? { top: 16, left: 72, bottom: 44, right: hasShareAxis ? 48 : 20 }
    : chartMarginWithLegendRight(legendRows.length);

  const yDomain = useMemo(() => {
    if (yPercent) return [0, 1];
    if (!sharedYDomain) return ["auto", "auto"];
    let max = 0;
    for (const row of merged) {
      for (const s of series ?? []) {
        const v = Number(row[s.key]);
        if (Number.isFinite(v) && v > max) max = v;
      }
    }
    return [0, max > 0 ? max * 1.06 : 1];
  }, [merged, series, yPercent, sharedYDomain]);

  const xTick = ({ x, y, payload }) => {
    const year = Number(payload?.value);
    const dimmed = isDimmedYear(year, dimmedYears);
    return (
      <text
        x={x}
        y={y}
        dy={12}
        textAnchor="middle"
        fill={dimmed ? PALETTE.axis : PALETTE.muted}
        fontSize={11}
        opacity={dimmed ? 0.55 : 1}
      >
        {payload?.value}
      </text>
    );
  };

  const chart = (
    <ChartBox height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={merged} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} />
          <XAxis dataKey={xKey} tick={xTick} tickMargin={AXIS.tickMargin} interval={0}>
            <Label value={xLabel} position="bottom" offset={16} style={{ fontSize: 11, fill: PALETTE.muted }} />
          </XAxis>
          <YAxis
            yAxisId="left"
            tick={AXIS.tick}
            tickMargin={AXIS.tickMargin}
            tickFormatter={tickFmt}
            width={56}
            domain={yDomain}
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
                percentTooltip={percentTooltip}
              />
            }
          />
          {(series ?? []).map((s) => (
            <Line
              key={s.key}
              yAxisId="left"
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={(props) => <TrendDot {...props} color={s.color} dimmedYears={dimmedYears} />}
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

  if (hideLegend) {
    return <div className="line-trend-chart line-trend-chart--no-legend">{chart}</div>;
  }

  return (
    <figure className="line-trend-chart">
      <div className="chart-with-side-legend">
        <div className="chart-with-side-legend__plot">{chart}</div>
        <CategoryLegend rows={legendRows} colors={legendColors} />
      </div>
    </figure>
  );
}
