import { useEffect, useMemo, useState } from "react";
import ChartFrame from "./components/ChartFrame.jsx";
import KpiGrid from "./components/KpiGrid.jsx";
import LineTrendChart from "./components/LineTrendChart.jsx";
import YearShareBarChart from "./components/YearShareBarChart.jsx";
import MetricChartGroup from "./components/MetricChartGroup.jsx";
import WeeklyAdmissionsChart from "./components/WeeklyAdmissionsChart.jsx";
import { GENRE_COLORS, ORIGIN_COLORS, SERIES_PAIR } from "./constants.js";
import { useUnifiedData } from "./hooks/useUnifiedData.js";
import { buildCountryColorMap } from "./utils/countryColors.js";
import { collapseTopCountries } from "./utils/collapseCountries.js";
import {
  mergeChannelOrigins,
  mergeGenreRows,
  mergePxGenres,
  mergePxOrigins,
} from "./utils/merge.js";
import EmbedPanelContent from "./components/EmbedPanelContent.jsx";
import { indexRowsById, SERIES_ZONE_INTRO, YOY_ARROW_HINT, YOY_YEAR_HINT } from "./utils/format.js";
import { getEmbedPanel } from "./utils/embedPanel.js";

const isEmbed = document.documentElement.classList.contains("is-embed");
const embedPanel = getEmbedPanel();

function joinSeries(keys) {
  const yearSet = new Set();
  for (const k of keys) for (const p of k.points ?? []) yearSet.add(p.year);
  return [...yearSet]
    .sort((a, b) => a - b)
    .map((year) => {
      const row = { year };
      for (const k of keys) row[k.key] = k.points?.find((p) => p.year === year)?.value ?? null;
      return row;
    });
}

export default function App() {
  const { data, loading, error } = useUnifiedData();
  const px = data?.primary?.px;
  const vod = data?.supplementary?.vod;
  const p4 = data?.supplementary?.cinema_p4;
  const years = px?.years ?? data?.years ?? [];
  const [year, setYear] = useState(null);

  const activeYear = year ?? years[years.length - 1];
  const snap = useMemo(
    () => data?.by_year?.find((y) => y.year === activeYear),
    [data, activeYear]
  );
  const pxRow = snap?.px;

  const demandTrendData = useMemo(() => {
    const s = px?.series;
    if (!s) return [];
    return joinSeries([
      { key: "market", points: s.market_demand ?? s.market_admissions },
      { key: "ch", points: s.ch_demand },
    ]);
  }, [px]);

  const genreTrendDemand = useMemo(() => {
    const s = px?.series;
    if (!s) return { data: [], series: [] };
    const keys = [
      { key: "fic", points: s.genre_fic_demand_share ?? s.genre_fic_share, color: GENRE_COLORS.fic, label: "Fiktion" },
      { key: "doc", points: s.genre_doc_demand_share ?? s.genre_doc_share, color: GENRE_COLORS.doc, label: "Dokumentar" },
      { key: "ani", points: s.genre_ani_demand_share ?? s.genre_ani_share, color: GENRE_COLORS.ani, label: "Animation" },
    ];
    return { data: joinSeries(keys), series: keys };
  }, [px]);

  const genreTrendSupply = useMemo(() => {
    const s = px?.series;
    if (!s) return { data: [], series: [] };
    const keys = [
      { key: "fic", points: s.genre_fic_supply_share, color: GENRE_COLORS.fic, label: "Fiktion" },
      { key: "doc", points: s.genre_doc_supply_share, color: GENRE_COLORS.doc, label: "Dokumentar" },
      { key: "ani", points: s.genre_ani_supply_share, color: GENRE_COLORS.ani, label: "Animation" },
    ];
    return { data: joinSeries(keys), series: keys };
  }, [px]);

  const supplyTrendData = useMemo(() => {
    const s = px?.series;
    if (!s) return [];
    return joinSeries([
      { key: "market", points: s.market_supply ?? s.market_films },
      { key: "ch", points: s.ch_supply },
    ]);
  }, [px]);

  const prevYearSnap = useMemo(() => {
    const i = years.indexOf(activeYear);
    if (i <= 0) return null;
    return data?.by_year?.find((y) => y.year === years[i - 1]) ?? null;
  }, [data, activeYear, years]);

  const prevYearPxRow = prevYearSnap?.px ?? null;

  const chGenreTrendDemand = useMemo(() => {
    const s = px?.series;
    if (!s) return { data: [], series: [] };
    const keys = [
      { key: "fic", points: s.ch_genre_fic_demand_share, color: GENRE_COLORS.fic, label: "Fiktion" },
      { key: "doc", points: s.ch_genre_doc_demand_share, color: GENRE_COLORS.doc, label: "Dokumentar" },
      { key: "ani", points: s.ch_genre_ani_demand_share, color: GENRE_COLORS.ani, label: "Animation" },
    ];
    return { data: joinSeries(keys), series: keys };
  }, [px]);

  const chGenreTrendSupply = useMemo(() => {
    const s = px?.series;
    if (!s) return { data: [], series: [] };
    const keys = [
      { key: "fic", points: s.ch_genre_fic_supply_share, color: GENRE_COLORS.fic, label: "Fiktion" },
      { key: "doc", points: s.ch_genre_doc_supply_share, color: GENRE_COLORS.doc, label: "Dokumentar" },
      { key: "ani", points: s.ch_genre_ani_supply_share, color: GENRE_COLORS.ani, label: "Animation" },
    ];
    return { data: joinSeries(keys), series: keys };
  }, [px]);

  const seasonProfile = p4?.season?.profile ?? [];
  const seasonProfileCh = p4?.season?.ch_profile ?? [];
  const seasonYears = p4?.season?.years ?? [];

  if (loading) {
    return (
      <div className="wrap">
        <p className="page-intro-lead">Daten werden geladen …</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="wrap">
        <p className="page-intro-lead panel-error">
          Fehler: {error ?? "keine Daten"}. Bitte Seite über einen Webserver öffnen (nicht file://) und{" "}
          <code>node scripts/export_site.mjs</code> ausführen.
        </p>
      </div>
    );
  }

  const harmonized = data.harmonized;
  if (!harmonized?.origins?.length || !harmonized?.genres?.length) {
    return (
      <div className="wrap">
        <p className="page-intro-lead panel-error">
          Daten unvollständig (<code>harmonized</code> fehlt in unified.json). Bitte{" "}
          <code>node scripts/build_unified.mjs</code> ausführen.
        </p>
      </div>
    );
  }

  const originRows = mergePxOrigins(harmonized, pxRow?.origins);
  const genreRows = mergePxGenres(harmonized, pxRow?.genres);
  const topCountries = collapseTopCountries(
    (pxRow?.top_countries ?? []).map((c) => ({
      id: c.label,
      label: c.label,
      bucket: c.bucket,
      demand: c.demand ?? 0,
      supply: c.supply ?? 0,
      share_demand: c.share_demand ?? 0,
      share_supply: c.share_supply ?? 0,
      intensity: c.intensity ?? null,
    })),
    5
  );
  const topCountryColors = buildCountryColorMap(topCountries);

  const prevOriginRows = mergePxOrigins(harmonized, prevYearPxRow?.origins);
  const prevGenreRows = mergePxGenres(harmonized, prevYearPxRow?.genres);
  const prevTopCountries = collapseTopCountries(
    (prevYearPxRow?.top_countries ?? []).map((c) => ({
      id: c.label,
      label: c.label,
      bucket: c.bucket,
      demand: c.demand ?? 0,
      supply: c.supply ?? 0,
      share_demand: c.share_demand ?? 0,
      share_supply: c.share_supply ?? 0,
      intensity: c.intensity ?? null,
    })),
    5
  );
  const prevOriginById = indexRowsById(prevOriginRows);
  const prevGenreById = indexRowsById(prevGenreRows);
  const prevTopById = indexRowsById(prevTopCountries);

  const vodOrigins = mergeChannelOrigins(harmonized, snap?.vod?.origins, "vod");
  const p4Origins = mergeChannelOrigins(harmonized, snap?.cinema_p4?.origins, "cinema");
  const prevVodOrigins = mergeChannelOrigins(harmonized, prevYearSnap?.vod?.origins, "vod");
  const prevP4Origins = mergeChannelOrigins(harmonized, prevYearSnap?.cinema_p4?.origins, "cinema");
  const prevVodById = indexRowsById(prevVodOrigins);
  const prevP4ById = indexRowsById(prevP4Origins);
  const prevVodGenreById = indexRowsById(mergeGenreRows(harmonized, prevYearSnap?.vod?.genres));

  if (embedPanel) {
    return (
      <div className="wrap wrap-embed-panel">
        <EmbedPanelContent
          panel={embedPanel}
          px={px}
          supplyTrendData={supplyTrendData}
          demandTrendData={demandTrendData}
          seasonProfile={seasonProfile}
          seasonProfileCh={seasonProfileCh}
          seasonYears={seasonYears}
          genreTrendDemand={genreTrendDemand}
          chGenreTrendDemand={chGenreTrendDemand}
        />
      </div>
    );
  }

  return (
    <div className="wrap">
      {!isEmbed && (
        <header className="page-head">
          <h1>Übersicht Swiss Film</h1>
          <p className="page-intro-lead">{data.lead}</p>
        </header>
      )}
      {isEmbed && <p className="page-intro-lead visually-hidden">{data.lead}</p>}

      <div className="dashboard-zone dashboard-zone--series">
        <h2 className="dashboard-zone-title">Über die Jahre</h2>
        <p className="panel-intro panel-intro-meta">{SERIES_ZONE_INTRO}</p>
        <p className="panel-intro panel-intro-meta">{YOY_ARROW_HINT}</p>

        {supplyTrendData.length > 0 && (
          <section className="panel panel-primary">
            <div className="panel-label">Angebot (PX)</div>
            <p className="panel-intro panel-intro-meta">{px?.slice_label}</p>
            <p className="panel-intro">
              Filme im Programm: Gesamtmarkt und Schweizer Filme (CH-Anteil im Tooltip).
            </p>
            <ChartFrame title="Filme im Programm">
              <LineTrendChart
                data={supplyTrendData}
                height={240}
                chShareDenominatorKey="market"
                series={[
                  { key: "market", label: "Gesamtmarkt", color: SERIES_PAIR.first },
                  { key: "ch", label: "Schweizer Filme", color: SERIES_PAIR.second },
                ]}
              />
            </ChartFrame>
          </section>
        )}

        {demandTrendData.length > 0 && (
          <section className="panel panel-primary">
            <div className="panel-label">Nachfrage (PX)</div>
            <p className="panel-intro panel-intro-meta">{px?.slice_label}</p>
            <p className="panel-intro">
              Kinobesuche: gleiche Darstellung wie beim Angebot (Gesamtmarkt und Schweizer Filme).
            </p>
            <ChartFrame title="Kinobesuche">
              <LineTrendChart
                data={demandTrendData}
                height={240}
                chShareDenominatorKey="market"
                series={[
                  { key: "market", label: "Gesamtmarkt", color: SERIES_PAIR.first },
                  { key: "ch", label: "Schweizer Filme", color: SERIES_PAIR.second },
                ]}
              />
            </ChartFrame>
          </section>
        )}

        {seasonProfile.length > 0 && (
          <section className="panel panel-primary">
            <div className="panel-label">Nachfrage · Besuche pro Kinowoche (P4)</div>
            <p className="panel-intro">
              Zwei Balkendiagramme: Gesamtbesuche aller Herkünfte (Schwarztöne) und Besuche bei
              Schweizer Filmen (Rottöne), jeweils Ø pro Kinowoche.
              {seasonYears.length
                ? ` Basisjahre: ${seasonYears.join(", ")} (Mittel über diese Jahre).`
                : ""}{" "}
              2020 und 2021 sind ausgeschlossen — Lockdowns und gestörtes Programm liefern kein
              typisches Saisonprofil.
            </p>
            <div className="panel-chart-stack">
              <ChartFrame title="Alle Herkünfte">
                <WeeklyAdmissionsChart
                  profile={seasonProfile}
                  years={seasonYears}
                  height={280}
                  barName="Gesamtbesuche"
                  barColorHigh={SERIES_PAIR.first}
                />
              </ChartFrame>
              {seasonProfileCh.length > 0 && (
                <ChartFrame title="Schweizer Filme">
                  <WeeklyAdmissionsChart
                    profile={seasonProfileCh}
                    years={seasonYears}
                    height={280}
                    barName="Besuche CH-Filme"
                    barColorHigh={SERIES_PAIR.second}
                  />
                </ChartFrame>
              )}
            </div>
          </section>
        )}

        <section className="panel panel-primary">
          <div className="panel-label">Genre über die Jahre (PX)</div>
          <p className="panel-intro">
            Genre-Anteile je Jahr als gestapelte Balken (Fiktion, Dokumentar, Animation) — gesamt und
            für Schweizer Filme.
          </p>
          <div className="panel-chart-stack">
            <div className="metric-series-block">
              <div className="panel-label panel-label-sub">Angebot</div>
              <div className="unified-grid is-genre-years">
                <ChartFrame title="Gesamtmarkt · Anteil">
                  <YearShareBarChart data={genreTrendSupply.data} series={genreTrendSupply.series} height={300} />
                </ChartFrame>
                {chGenreTrendSupply.data.length > 0 && (
                  <ChartFrame title="Schweizer Filme · Anteil">
                    <YearShareBarChart data={chGenreTrendSupply.data} series={chGenreTrendSupply.series} height={300} />
                  </ChartFrame>
                )}
              </div>
            </div>
            <div className="metric-series-block">
              <div className="panel-label panel-label-sub">Nachfrage</div>
              <div className="unified-grid is-genre-years">
                <ChartFrame title="Gesamtmarkt · Anteil">
                  <YearShareBarChart data={genreTrendDemand.data} series={genreTrendDemand.series} height={300} />
                </ChartFrame>
                {chGenreTrendDemand.data.length > 0 && (
                  <ChartFrame title="Schweizer Filme · Anteil">
                    <YearShareBarChart data={chGenreTrendDemand.data} series={chGenreTrendDemand.series} height={300} />
                  </ChartFrame>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-zone dashboard-zone--year">
        <h2 className="dashboard-zone-title">Nach Jahr</h2>
        <p className="panel-intro panel-intro-meta">{YOY_YEAR_HINT}</p>

        <div className="controls controls-year-only">
          <div className="control-group">
            <label htmlFor="yearSelect">Jahr (PX, VoD)</label>
            <select
              id="yearSelect"
              value={activeYear ?? ""}
              onChange={(e) => setYear(Number(e.target.value))}
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
          <KpiGrid pxRow={pxRow} prevPxRow={prevYearPxRow} year={activeYear} />
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

        <section className="panel panel-supplementary">
          <div className="panel-label">Zusatzdaten: VoD &amp; Kinowochen · {activeYear}</div>
          <p className="panel-intro">{[vod?.note, p4?.note].filter(Boolean).join(" ")}</p>

          {snap?.vod && (
            <>
              <div className="panel-label panel-label-sub">VoD — Herkunft</div>
              <MetricChartGroup
                rows={vodOrigins}
                colors={ORIGIN_COLORS}
                barHeight={180}
                prevRowById={prevVodById}
              />
            </>
          )}

          {snap?.cinema_p4 && (
            <>
              <div className="panel-label panel-label-sub">Kino P4 — Herkunft</div>
              <MetricChartGroup
                rows={p4Origins}
                colors={ORIGIN_COLORS}
                barHeight={180}
                grouped
                prevRowById={prevP4ById}
              />
            </>
          )}

          {snap?.vod && (
            <>
              <div className="panel-label panel-label-sub">VoD — Genre (gesamt und pro Herkunft)</div>
              <MetricChartGroup
                rows={mergeGenreRows(harmonized, snap.vod.genres)}
                colors={GENRE_COLORS}
                barHeight={180}
                grouped
                prevRowById={prevVodGenreById}
              />
              {vodOrigins.map((o) => {
                const prevOrigin = prevVodOrigins.find((p) => p.id === o.id);
                return (
                  <div key={o.id} className="vod-origin-genre-block">
                    <div className="panel-label panel-label-sub">VoD · {o.label}</div>
                    <MetricChartGroup
                      rows={mergeGenreRows(harmonized, o.genres)}
                      colors={GENRE_COLORS}
                      barHeight={160}
                      grouped
                      prevRowById={indexRowsById(mergeGenreRows(harmonized, prevOrigin?.genres))}
                    />
                  </div>
                );
              })}
            </>
          )}

          {!snap?.vod && !snap?.cinema_p4 && (
            <p className="panel-intro meta-note">Für dieses Jahr liegen keine VoD- oder P4-Zusatzdaten vor.</p>
          )}

          <p className="panel-intro meta-note">
            Kinowochen (P4) ohne Genre-Spalte; Genre und detaillierte Herkunft über PX und VoD. Top-Länder
            mit je eigener Farbe (Schweiz rostrot).
          </p>
        </section>
      </div>

      <section className="panel">
        <div className="panel-label">Grenzen</div>
        <ul className="ml-insights">
          {(data.limitations ?? []).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      {!isEmbed && (
        <footer className="site-footer">
          Swiss Film · <a href="./index.html">Artikel</a> · <a href="./analysis.html">Analysen</a>
        </footer>
      )}
    </div>
  );
}
