import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, BAYES_TOOLTIP_WRAPPER_STYLE, PALETTE, SERIES_PAIR } from "../constants.js";
import { mergeForecastChart, yearTicks } from "../utils/bayesChartRows.js";
import { BayesMultiTooltip, BayesSingleTooltip, formatBayesValue } from "./BayesModelTooltip.jsx";
import CategoryLegend from "./CategoryLegend.jsx";
import ChartBox from "./ChartBox.jsx";

const FORECAST_COLOR = "#5c7a8a";

function enrichForecastRows(chart) {
  const raw = mergeForecastChart(chart);
  const lastHist = chart.hist?.years?.length ? Math.max(...chart.hist.years.map(Number)) : null;
  return raw.map((r) => {
    const isFut = r.phase === "forecast" || (lastHist != null && r.year > lastHist);
    return {
      ...r,
      histLo: isFut ? null : r.lo,
      histBand: isFut ? null : r.band,
      histMean: isFut ? null : r.mean,
      futLo: isFut ? r.lo : null,
      futBand: isFut ? r.band : null,
      futMean: isFut ? r.mean : null,
    };
  });
}

function SingleBandChart({ chart, height = 280, color = SERIES_PAIR.second }) {
  const rows = useMemo(() => enrichForecastRows(chart), [chart]);
  const yFormat = chart.yFormat ?? "percent";
  const lastHistYear = chart.hist?.years?.length ? Math.max(...chart.hist.years.map(Number)) : null;

  return (
    <ChartBox height={height}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rows} margin={{ top: 18, left: 8, right: 16, bottom: 44 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} />
          {(chart.covidYears ?? []).map((y) => (
            <ReferenceArea
              key={y}
              x1={y - 0.5}
              x2={y + 0.5}
              fill={PALETTE.sandPale}
              fillOpacity={0.55}
            />
          ))}
          {chart.zeroLine ? <ReferenceLine y={0} stroke={PALETTE.muted} strokeDasharray="4 4" /> : null}
          {lastHistYear != null ? (
            <ReferenceLine x={lastHistYear + 0.5} stroke={PALETTE.muted} strokeDasharray="2 4" opacity={0.6} />
          ) : null}
          {chart.crossing?.median ? (
            <ReferenceLine
              x={chart.crossing.median}
              stroke={color}
              strokeDasharray="4 3"
              label={{ value: `≈ ${Math.round(chart.crossing.median)}`, position: "top", fontSize: 10 }}
            />
          ) : null}
          <XAxis
            dataKey="year"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={yearTicks(rows)}
            tick={AXIS.tick}
            tickMargin={AXIS.tickMargin}
          />
          <YAxis
            tick={AXIS.tick}
            tickFormatter={(v) => formatBayesValue(yFormat, v)}
            width={56}
            tickMargin={AXIS.tickMargin}
          />
          <Tooltip
            wrapperStyle={BAYES_TOOLTIP_WRAPPER_STYLE}
            content={(props) => (
              <BayesSingleTooltip
                {...props}
                yFormat={yFormat}
                showForecastHdi={chart.type === "gap_forecast"}
              />
            )}
            labelFormatter={() => ""}
            isAnimationActive={false}
          />
          <Area dataKey="histLo" stackId="hist" fill="transparent" stroke="none" isAnimationActive={false} />
          <Area dataKey="histBand" stackId="hist" fill={color} fillOpacity={0.22} stroke="none" isAnimationActive={false} />
          <Area dataKey="futLo" stackId="fut" fill="transparent" stroke="none" isAnimationActive={false} />
          <Area
            dataKey="futBand"
            stackId="fut"
            fill={FORECAST_COLOR}
            fillOpacity={0.25}
            stroke="none"
            isAnimationActive={false}
          />
          <Line dataKey="histMean" stroke={color} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          <Line
            dataKey="futMean"
            stroke={FORECAST_COLOR}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
          <Scatter dataKey="obs" fill={PALETTE.ink} r={4} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

function MultiBandChart({ chart, height = 280, useFlags = false }) {
  const series = chart.series ?? [];
  const yFormat = chart.yFormat ?? "percent";

  const { rows, legendRows, legendColors } = useMemo(() => {
    const yearSet = new Set();
    for (const s of series) for (const y of s.years ?? []) yearSet.add(Number(y));
    const years = [...yearSet].sort((a, b) => a - b);
    const merged = years.map((year) => {
      const row = { year };
      for (const s of series) {
        const idx = s.years?.findIndex((y) => Number(y) === year) ?? -1;
        if (idx < 0) continue;
        row[`${s.id}_mean`] = s.mean?.[idx];
        row[`${s.id}_lo`] = s.lo?.[idx];
        row[`${s.id}_hi`] = s.hi?.[idx];
        row[`${s.id}_band`] = (s.hi?.[idx] ?? 0) - (s.lo?.[idx] ?? 0);
        const obsIdx = s.observed?.years?.findIndex((y) => Number(y) === year) ?? -1;
        row[`${s.id}_obs`] = obsIdx >= 0 ? s.observed.value?.[obsIdx] : null;
      }
      return row;
    });
    return {
      rows: merged,
      legendRows: series.map((s) => ({ id: s.id, label: s.label })),
      legendColors: Object.fromEntries(series.map((s) => [s.id, s.color ?? PALETTE.accent])),
    };
  }, [series]);

  return (
    <figure className="country-trend-chart">
      <div className="chart-with-side-legend">
        <div className="chart-with-side-legend__plot">
          <ChartBox height={height}>
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={rows} margin={{ top: 18, left: 8, right: 16, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} />
                {(chart.covidYears ?? []).map((y) => (
                  <ReferenceArea
                    key={y}
                    x1={y - 0.5}
                    x2={y + 0.5}
                    fill={PALETTE.sandPale}
                    fillOpacity={0.55}
                  />
                ))}
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  ticks={yearTicks(rows)}
                  tick={AXIS.tick}
                  tickMargin={AXIS.tickMargin}
                />
                <YAxis
                  tick={AXIS.tick}
                  tickFormatter={(v) => formatBayesValue(yFormat, v)}
                  width={56}
                  tickMargin={AXIS.tickMargin}
                />
                <Tooltip
                  wrapperStyle={BAYES_TOOLTIP_WRAPPER_STYLE}
                  content={(props) => (
                    <BayesMultiTooltip
                      {...props}
                      series={series}
                      yFormat={yFormat}
                      flagsOnly={useFlags}
                    />
                  )}
                  labelFormatter={() => ""}
                  itemSorter={(a, b) => Number(b.value) - Number(a.value)}
                  isAnimationActive={false}
                />
                {series.map((s) => (
                  <Area
                    key={`${s.id}-lo`}
                    dataKey={`${s.id}_lo`}
                    stackId={`${s.id}-band`}
                    fill="transparent"
                    stroke="none"
                    isAnimationActive={false}
                  />
                ))}
                {series.map((s) => (
                  <Area
                    key={`${s.id}-band`}
                    dataKey={`${s.id}_band`}
                    stackId={`${s.id}-band`}
                    fill={s.color ?? PALETTE.accent}
                    fillOpacity={0.15}
                    stroke="none"
                    isAnimationActive={false}
                  />
                ))}
                {series.map((s) => (
                  <Line
                    key={`${s.id}-line`}
                    dataKey={`${s.id}_mean`}
                    stroke={s.color ?? PALETTE.accent}
                    strokeWidth={s.id === "ch" || s.id === "us" ? 2.2 : 1.8}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                ))}
                {series.map((s) => (
                  <Scatter
                    key={`${s.id}-obs`}
                    dataKey={`${s.id}_obs`}
                    fill={s.color ?? PALETTE.ink}
                    r={3}
                    isAnimationActive={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
        <CategoryLegend rows={legendRows} colors={legendColors} useFlags={useFlags} />
      </div>
    </figure>
  );
}

export default function BayesModelChart({ chart, height = 280, useFlags = false }) {
  if (!chart) {
    return <p className="panel-intro">Modell-Daten werden geladen …</p>;
  }
  if (chart.type === "multi_share") {
    return <MultiBandChart chart={chart} height={height} useFlags={useFlags} />;
  }
  if (chart.type === "share_forecast" || chart.type === "gap_forecast") {
    return (
      <figure className="line-trend-chart">
        <SingleBandChart chart={chart} height={height} />
      </figure>
    );
  }
  return <p className="panel-intro panel-error">Unbekannter Diagrammtyp.</p>;
}
