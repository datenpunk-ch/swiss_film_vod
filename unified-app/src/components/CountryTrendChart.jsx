import CategoryLegend from "./CategoryLegend.jsx";
import LineTrendChart from "./LineTrendChart.jsx";
import { PALETTE } from "../constants.js";

/** Eine Zeitreihen-Grafik: Länderanteile über alle Jahre (nicht je Jahr ein Panel). */
export default function CountryTrendChart({
  data,
  series,
  colors = {},
  height = 300,
  dimmedYears,
  useFlags = true,
}) {
  const legendRows = (series ?? []).map((s) => ({ id: s.key, label: s.label }));
  const legendColors = Object.fromEntries(
    (series ?? []).map((s) => [s.key, s.color ?? colors[s.key] ?? PALETTE.ink])
  );

  if (!data?.length || !series?.length) {
    return <p className="panel-intro">Keine Jahresdaten.</p>;
  }

  return (
    <figure className="country-trend-chart">
      <div className="chart-with-side-legend">
        <div className="chart-with-side-legend__plot">
          <LineTrendChart
            data={data}
            series={series}
            height={height}
            yPercent
            percentTooltip={true}
            hideLegend
            dimmedYears={dimmedYears}
          />
        </div>
        <CategoryLegend rows={legendRows} colors={legendColors} useFlags={useFlags} />
      </div>
    </figure>
  );
}
