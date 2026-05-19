import KpiGrid from "./KpiGrid.jsx";
import MetricChartGroup from "./MetricChartGroup.jsx";
import { GENRE_COLORS, ORIGIN_COLORS } from "../constants.js";
import { YOY_YEAR_HINT } from "../utils/format.js";

/** PX-Kino je Jahr: Filter, KPIs, Herkunft, Top-Länder, Genre — ohne VoD/P4. */
export default function YearCinemaPanel({
  years = [],
  activeYear,
  onYearChange,
  pxRow,
  prevPxRow,
  originRows = [],
  genreRows = [],
  topCountries = [],
  topCountryColors = {},
  prevOriginById,
  prevGenreById,
  prevTopById,
  embedded = false,
}) {
  const zoneClass = `dashboard-zone dashboard-zone--year${embedded ? " is-embed-year" : ""}`;

  return (
    <div className={zoneClass}>
      {!embedded ? <h2 className="dashboard-zone-title">Nach Jahr</h2> : null}
      <p className="panel-intro panel-intro-meta">{YOY_YEAR_HINT}</p>

      <div className="controls controls-year-only">
        <div className="control-group">
          <label htmlFor="yearSelect">Jahr (Kino, PX)</label>
          <select
            id="yearSelect"
            value={activeYear ?? ""}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="panel panel-primary">
        <div className="panel-label">Kinomarkt Schweiz (PX) · {activeYear}</div>
        <KpiGrid pxRow={pxRow} prevPxRow={prevPxRow} year={activeYear} />
      </section>

      <section className="panel panel-primary">
        <div className="panel-label">Herkunft (CH · Europa · Welt) · {activeYear}</div>
        <MetricChartGroup
          rows={originRows}
          colors={ORIGIN_COLORS}
          marketIntensity={pxRow?.market?.intensity}
          grouped
          prevRowById={prevOriginById}
        />
        <div className="panel-label panel-label-sub">Top-Länder</div>
        <MetricChartGroup
          rows={topCountries}
          colors={topCountryColors}
          variant="countries"
          barHeight={200}
          marketIntensity={pxRow?.market?.intensity}
          grouped
          prevRowById={prevTopById}
        />
      </section>

      <section className="panel panel-primary">
        <div className="panel-label">Genre (Fiktion · Dokumentar · Animation) · {activeYear}</div>
        <MetricChartGroup
          rows={genreRows}
          colors={GENRE_COLORS}
          marketIntensity={pxRow?.market?.intensity}
          grouped
          prevRowById={prevGenreById}
        />
      </section>
    </div>
  );
}
