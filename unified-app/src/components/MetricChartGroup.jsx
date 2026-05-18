import CategoricalBarChart from "./CategoricalBarChart.jsx";
import CountryBarChart from "./CountryBarChart.jsx";
import ChartFrame from "./ChartFrame.jsx";
import ShareStackChart from "./ShareStackChart.jsx";
import { METRICS } from "../constants.js";
import { aggregateMarketIntensity } from "../utils/intensity.js";
import { isShareMetric } from "../utils/format.js";

function MetricBlock({
  metric,
  rows,
  colors,
  isCountries,
  barHeight,
  sortByValue,
  benchIntensity,
  usePxBenchmark,
  tooltipShowShare,
  prevRowById,
}) {
  const showShareBlock = (metricId) =>
    isShareMetric(metricId) || (metricId === "intensity" && benchIntensity > 0);

  return (
    <div className="metric-chart-block">
      <div className="panel-label panel-label-sub">{metric.title}</div>
      <ChartFrame title={metric.label}>
        {showShareBlock(metric.id) ? (
          <ShareStackChart
            rows={rows}
            colors={colors}
            metric={metric.id}
            useFlags={isCountries}
            marketIntensity={benchIntensity}
            usePxBenchmark={usePxBenchmark}
            prevRowById={prevRowById}
          />
        ) : null}
        {showShareBlock(metric.id) ? <p className="chart-detail-label">Absolute Werte</p> : null}
        {isCountries ? (
          <CountryBarChart
            rows={rows}
            metric={metric.id}
            colors={colors}
            minHeight={barHeight ?? 200}
            compact
            hideAxisLabels
            tooltipShowShare={tooltipShowShare}
            prevRowById={prevRowById}
          />
        ) : (
          <CategoricalBarChart
            rows={rows}
            metric={metric.id}
            colors={colors}
            minHeight={barHeight}
            compact
            hideAxisLabels
            showCategoryLegend={false}
            sortByValue={sortByValue}
            tooltipShowShare={tooltipShowShare}
            prevRowById={prevRowById}
          />
        )}
      </ChartFrame>
    </div>
  );
}

export default function MetricChartGroup({
  rows = [],
  colors,
  variant = "standard",
  barHeight,
  sortByValue = true,
  marketIntensity: marketIntensityProp,
  grouped = false,
  prevRowById,
}) {
  const isCountries = variant === "countries";
  const benchIntensity =
    marketIntensityProp > 0 ? marketIntensityProp : aggregateMarketIntensity(rows);
  const usePxBenchmark = marketIntensityProp > 0;

  const blockProps = {
    rows,
    colors,
    isCountries,
    barHeight,
    sortByValue,
    benchIntensity,
    usePxBenchmark,
    prevRowById,
  };

  if (grouped) {
    return (
      <div className={`metric-chart-group metric-chart-group--grouped${isCountries ? " is-countries" : ""}`}>
        {METRICS.map((m) => (
          <MetricBlock
            key={m.id}
            metric={m}
            {...blockProps}
            tooltipShowShare={m.id === "supply"}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`metric-chart-group unified-grid unified-grid-metrics${isCountries ? " is-countries" : ""}`}>
      {METRICS.map((m) => (
        <ChartFrame key={m.id} title={m.label}>
          {isShareMetric(m.id) || (m.id === "intensity" && benchIntensity > 0) ? (
            <ShareStackChart
              rows={rows}
              colors={colors}
              metric={m.id}
              useFlags={isCountries}
              marketIntensity={benchIntensity}
              usePxBenchmark={usePxBenchmark}
              prevRowById={prevRowById}
            />
          ) : null}
          {isShareMetric(m.id) || (m.id === "intensity" && benchIntensity > 0) ? (
            <p className="chart-detail-label">Absolute Werte</p>
          ) : null}
          {isCountries ? (
            <CountryBarChart
              rows={rows}
              metric={m.id}
              colors={colors}
              minHeight={barHeight ?? 200}
              compact
              hideAxisLabels
              tooltipShowShare={m.id === "supply"}
              prevRowById={prevRowById}
            />
          ) : (
            <CategoricalBarChart
              rows={rows}
              metric={m.id}
              colors={colors}
              minHeight={barHeight}
              compact
              hideAxisLabels
              showCategoryLegend={false}
              sortByValue={sortByValue}
              tooltipShowShare={m.id === "supply"}
              prevRowById={prevRowById}
            />
          )}
        </ChartFrame>
      ))}
    </div>
  );
}
