import ChartFrame from "./ChartFrame.jsx";
import LineTrendChart from "./LineTrendChart.jsx";
import WeeklyAdmissionsChart from "./WeeklyAdmissionsChart.jsx";
import YearShareBarChart from "./YearShareBarChart.jsx";
import { GENRE_COLORS, SERIES_PAIR } from "../constants.js";

export default function EmbedPanelContent({
  panel,
  px,
  supplyTrendData,
  demandTrendData,
  seasonProfile,
  seasonProfileCh,
  seasonYears,
  genreTrendDemand,
  chGenreTrendDemand,
}) {
  if (panel === "supply" && supplyTrendData.length > 0) {
    return (
      <section className="panel panel-primary panel-embed">
        <ChartFrame title="Filme im Programm (PX)">
          <LineTrendChart
            data={supplyTrendData}
            height={228}
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
            height={228}
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
            />
          </ChartFrame>
          {chGenreTrendDemand.data.length > 0 && (
            <ChartFrame title="Genre-Anteile Nachfrage · Schweizer Filme">
              <YearShareBarChart
                data={chGenreTrendDemand.data}
                series={chGenreTrendDemand.series}
                height={248}
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
