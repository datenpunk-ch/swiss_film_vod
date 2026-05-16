import CategoricalBarChart from "./CategoricalBarChart.jsx";
import CountryBarChart from "./CountryBarChart.jsx";
import ChartFrame from "./ChartFrame.jsx";
import ShareStackChart from "./ShareStackChart.jsx";
import { METRICS } from "../constants.js";
import { aggregateMarketIntensity } from "../utils/intensity.js";
import { isShareMetric } from "../utils/format.js";

export default function MetricChartGroup({
  rows = [],
  colors,
  variant = "standard",
  barHeight,
  sortByValue = true,
  marketIntensity: marketIntensityProp,
}) {
  const isCountries = variant === "countries";
  const benchIntensity =
    marketIntensityProp > 0 ? marketIntensityProp : aggregateMarketIntensity(rows);
  const usePxBenchmark = marketIntensityProp > 0;

  const showShareBlock = (metricId) =>
    isShareMetric(metricId) || (metricId === "intensity" && benchIntensity > 0);

  return (
    <div className={`metric-chart-group unified-grid unified-grid-metrics${isCountries ? " is-countries" : ""}`}>
      {METRICS.map((m) => (
        <ChartFrame key={m.id} title={m.label}>
          {showShareBlock(m.id) ? (
            <ShareStackChart
              rows={rows}
              colors={colors}
              metric={m.id}
              useFlags={isCountries}
              marketIntensity={benchIntensity}
              usePxBenchmark={usePxBenchmark}
            />
          ) : null}
          {showShareBlock(m.id) ? <p className="chart-detail-label">Absolute Werte</p> : null}
          {isCountries ? (
            <CountryBarChart
              rows={rows}
              metric={m.id}
              colors={colors}
              minHeight={barHeight ?? 200}
              compact
              hideAxisLabels
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
            />
          )}
        </ChartFrame>
      ))}
    </div>
  );
}
