import BayesModelChart from "./BayesModelChart.jsx";
import ChartFrame from "./ChartFrame.jsx";
import CountryTrendChart from "./CountryTrendChart.jsx";
import LineTrendChart from "./LineTrendChart.jsx";
import WeeklyAdmissionsChart from "./WeeklyAdmissionsChart.jsx";
import YearCinemaPanel from "./YearCinemaPanel.jsx";
import YearShareBarChart from "./YearShareBarChart.jsx";
import { GENRE_COLORS, SERIES_PAIR } from "../constants.js";
import { BAYES_PANEL_ANALYSIS, isBayesEmbedPanel } from "../utils/bayesPanelMap.js";

export default function EmbedPanelContent({
  panel,
  px,
  years,
  activeYear,
  onYearChange,
  pxRow,
  prevPxRow,
  originRows,
  genreRows,
  topCountries,
  topCountryColors,
  prevOriginById,
  prevGenreById,
  prevTopById,
  supplyTrendData,
  demandTrendData,
  seasonProfile,
  seasonProfileCh,
  seasonYears,
  genreTrendDemand,
  chGenreTrendDemand,
  countryTrendDemand,
  chShareTrendData,
  gapTrendData,
  dimmedYears,
  bayesCharts,
  bayesChartsLoading,
  bayesChartsError,
}) {
  if (isBayesEmbedPanel(panel)) {
    const analysisId = BAYES_PANEL_ANALYSIS[panel];
    const chart = bayesCharts?.[analysisId];
    const titles = {
      forecast: "CH-Besuchsanteil: Posterior & Prognose (95 %-HDI)",
      countries: "Besuchsanteil Kernländer: Posterior (95 %-HDI)",
      chgenre: "CH-Anteil je Genre: Posterior (95 %-HDI)",
      gap: "Programm-Lücke: Posterior & Prognose (95 %-HDI)",
    };
    if (bayesChartsLoading) {
      return (
        <section className="panel panel-primary panel-embed">
          <p className="panel-intro">Modell-Daten werden geladen …</p>
        </section>
      );
    }
    if (!chart) {
      return (
        <section className="panel panel-primary panel-embed">
          <p className="panel-intro panel-error">
            Modell-Grafik nicht verfügbar
            {bayesChartsError ? ` (${bayesChartsError})` : ""}. Bitte{" "}
            <code>pixi run analyze --force</code> ausführen.
          </p>
        </section>
      );
    }
    return (
      <section className="panel panel-primary panel-embed">
        <ChartFrame title={titles[panel]}>
          <BayesModelChart chart={chart} height={280} useFlags={panel === "countries"} />
        </ChartFrame>
      </section>
    );
  }

  if (panel === "year") {
    if (!years?.length) {
      return (
        <div className="wrap wrap-embed-panel wrap-embed-year">
          <p className="page-intro-lead">Daten werden geladen …</p>
        </div>
      );
    }
    return (
      <div className="wrap wrap-embed-panel wrap-embed-year">
        <YearCinemaPanel
          embedded
          years={years}
          activeYear={activeYear}
          onYearChange={onYearChange}
          pxRow={pxRow}
          prevPxRow={prevPxRow}
          originRows={originRows}
          genreRows={genreRows}
          topCountries={topCountries}
          topCountryColors={topCountryColors}
          prevOriginById={prevOriginById}
          prevGenreById={prevGenreById}
          prevTopById={prevTopById}
        />
      </div>
    );
  }
  if (panel === "supply" && supplyTrendData.length > 0) {
    return (
      <section className="panel panel-primary panel-embed">
        <ChartFrame title="Filme im Programm (PX)">
          <LineTrendChart
            data={supplyTrendData}
            height={248}
            sharedYDomain
            dimmedYears={dimmedYears}
            chShareDenominatorKey="market"
            series={[
              { key: "market", label: "Gesamtmarkt", color: SERIES_PAIR.first },
              { key: "ch", label: "Schweizer Filme", color: SERIES_PAIR.second },
            ]}
          />
        </ChartFrame>
      </section>
    );
  }

  if (panel === "demand" && demandTrendData.length > 0) {
    return (
      <section className="panel panel-primary panel-embed">
        <ChartFrame title="Kinobesuche (PX)">
          <LineTrendChart
            data={demandTrendData}
            height={248}
            sharedYDomain
            dimmedYears={dimmedYears}
            chShareDenominatorKey="market"
            series={[
              { key: "market", label: "Gesamtmarkt", color: SERIES_PAIR.first },
              { key: "ch", label: "Schweizer Filme", color: SERIES_PAIR.second },
            ]}
          />
        </ChartFrame>
      </section>
    );
  }

  if (panel === "season" && seasonProfile.length > 0) {
    return (
      <section className="panel panel-primary panel-embed">
        <div className="panel-chart-stack">
          <ChartFrame title="Alle Herkünfte · Ø pro Kinowoche">
            <WeeklyAdmissionsChart
              profile={seasonProfile}
              years={seasonYears}
              height={232}
              barName="Gesamtbesuche"
              barColorHigh={SERIES_PAIR.first}
            />
          </ChartFrame>
          {seasonProfileCh.length > 0 && (
            <ChartFrame title="Schweizer Filme · Ø pro Kinowoche">
              <WeeklyAdmissionsChart
                profile={seasonProfileCh}
                years={seasonYears}
                height={232}
                barName="Besuche CH-Filme"
                barColorHigh={SERIES_PAIR.second}
              />
            </ChartFrame>
          )}
        </div>
      </section>
    );
  }

  if (panel === "genre" && genreTrendDemand.data.length > 0) {
    return (
      <section className="panel panel-primary panel-embed">
        <div className="unified-grid is-genre-years">
          <ChartFrame title="Genre-Anteile Nachfrage · Gesamtmarkt">
            <YearShareBarChart
              data={genreTrendDemand.data}
              series={genreTrendDemand.series}
              height={248}
              dimmedYears={dimmedYears}
            />
          </ChartFrame>
          {chGenreTrendDemand.data.length > 0 && (
            <ChartFrame title="Genre-Anteile Nachfrage · Schweizer Filme">
              <YearShareBarChart
                data={chGenreTrendDemand.data}
                series={chGenreTrendDemand.series}
                height={248}
                dimmedYears={dimmedYears}
              />
            </ChartFrame>
          )}
        </div>
      </section>
    );
  }

  return (
    <p className="page-intro-lead panel-error">
      Grafik «{panel}» nicht verfügbar.
      {px?.slice_label ? ` (${px.slice_label})` : ""}
    </p>
  );
}
