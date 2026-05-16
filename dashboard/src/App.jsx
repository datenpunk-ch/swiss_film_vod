import { useMemo } from "react";
import CinemaPanel from "./components/CinemaPanel.jsx";
import KpiGrid from "./components/KpiGrid.jsx";
import VodPanel from "./components/VodPanel.jsx";
import { useExplorerData } from "./hooks/useExplorerData.js";
import { completeYears, fmt, pctFmt, yoyChange } from "./utils/format.js";

const isEmbed = document.documentElement.classList.contains("is-embed");

export default function App() {
  const { loading, error, cinema, vod, summary } = useExplorerData();

  const kpis = useMemo(() => {
    if (!cinema || !vod) return [];
    const cinemaComplete = completeYears(cinema.yearly);
    const lastCinema = cinemaComplete[cinemaComplete.length - 1];
    const prevCinema = cinemaComplete[cinemaComplete.length - 2];
    const cinemaYoy =
      summary?.cinema_yoy_change ?? yoyChange(lastCinema?.admissions, prevCinema?.admissions);

    const lastVod = vod.series[vod.series.length - 1];
    const prevVod = vod.series[vod.series.length - 2];
    const vodYoy = yoyChange(lastVod?.total, prevVod?.total);

    return [
      {
        key: "cinema",
        value: fmt.format(lastCinema?.admissions ?? summary?.cinema_latest_admissions ?? 0),
        label: `Kinobesuche\n${lastCinema?.year ?? summary?.cinema_latest_year ?? ""}`,
      },
      {
        key: "cinema-yoy",
        value: cinemaYoy == null ? "—" : pctFmt.format(cinemaYoy),
        label: "Kino Δ\nVorjahr",
      },
      {
        key: "vod",
        value: fmt.format(lastVod?.total ?? summary?.vod_latest_total_views ?? 0),
        label: `EST Views\n${lastVod?.year ?? summary?.vod_latest_year ?? ""}`,
      },
      {
        key: "vod-ch",
        value: pctFmt.format(lastVod?.share_ch ?? 0),
        label: "VoD CH-Anteil\n(EST)",
      },
      {
        key: "vod-yoy",
        value: vodYoy == null ? "—" : pctFmt.format(vodYoy),
        label: "VoD Δ\nVorjahr",
      },
    ];
  }, [cinema, vod, summary]);

  return (
    <div className="page-explore">
      <div className="wrap">
        {!isEmbed && (
          <header className="page-head">
            <h1>Explorer — Kino &amp; VoD</h1>
            <p>
              BFS-Daten: wöchentliche Kinobesuche und jährliche VoD-Kauf-Views nach Herkunftsregion
              (EST).
            </p>
          </header>
        )}

        {loading && <p className="panel-intro">Daten werden geladen …</p>}

        {error && (
          <p className="panel-intro panel-error">
            Daten konnten nicht geladen werden ({error}). Bitte{" "}
            <code>node scripts/export_site.mjs</code> ausführen.
          </p>
        )}

        {!loading && !error && cinema && vod && (
          <>
            <section className="panel panel-kpis" aria-labelledby="kpi-heading">
              <div className="panel-label" id="kpi-heading">
                Überblick
              </div>
              <KpiGrid items={kpis} />
            </section>
            <CinemaPanel cinema={cinema} />
            <VodPanel vod={vod} />
          </>
        )}

        {!isEmbed && (
          <footer className="site-footer">
            Swiss Film · <a href="../index.html">Artikel</a> ·{" "}
            <a href="../data_explorer.html">Daten-Explorer</a>
          </footer>
        )}
      </div>
    </div>
  );
}
