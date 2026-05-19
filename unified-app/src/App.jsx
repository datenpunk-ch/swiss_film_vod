import { useEffect, useMemo, useState } from "react";
import ChartFrame from "./components/ChartFrame.jsx";
import CountryTrendChart from "./components/CountryTrendChart.jsx";
import LineTrendChart from "./components/LineTrendChart.jsx";
import YearShareBarChart from "./components/YearShareBarChart.jsx";
import MetricChartGroup from "./components/MetricChartGroup.jsx";
import WeeklyAdmissionsChart from "./components/WeeklyAdmissionsChart.jsx";
import { GENRE_COLORS, ORIGIN_COLORS, PALETTE, SERIES_PAIR } from "./constants.js";
import { useBayesCharts } from "./hooks/useBayesCharts.js";
import { useUnifiedData } from "./hooks/useUnifiedData.js";
import { isBayesEmbedPanel } from "./utils/bayesPanelMap.js";
import { buildCountryColorMap } from "./utils/countryColors.js";
import { collapseTopCountries } from "./utils/collapseCountries.js";
import { mergeChannelOrigins, mergePxGenres, mergePxOrigins } from "./utils/merge.js";
import EmbedPanelContent from "./components/EmbedPanelContent.jsx";
import YearCinemaPanel from "./components/YearCinemaPanel.jsx";
import { indexRowsById, SERIES_ZONE_INTRO, YOY_ARROW_HINT } from "./utils/format.js";
import { getEmbedPanel } from "./utils/embedPanel.js";
import { resolveDimmedYears } from "./utils/yearDisplay.js";

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
  const { charts: bayesCharts, chartsLoading: bayesChartsLoading, chartsError: bayesChartsError } =
    useBayesCharts();
  const px = data?.primary?.px;
  const p4 = data?.supplementary?.cinema_p4;
  const years = px?.years ?? data?.years ?? [];
  const dimmedYears = useMemo(() => resolveDimmedYears(px, years), [px, years]);
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

  const countryTrendDemand = useMemo(() => {
    const cs = px?.country_series ?? [];
    if (!cs.length) return { data: [], series: [], colors: {} };
    const keys = cs.map((c) => ({
      key: c.id,
      label: c.label,
      points: c.demand_share ?? [],
    }));
    const colors = buildCountryColorMap(keys.map((k) => ({ id: k.key, label: k.label })));
    const series = keys.map((k) => ({
      ...k,
      color: colors[k.key] ?? colors[normalizeCountryKey?.(k.key, k.label)] ?? PALETTE.muted,
    }));
    return {
      data: joinSeries(series),
      series,
      colors,
    };
  }, [px]);

  const chShareTrendData = useMemo(() => {
    const pts = px?.series?.ch_demand_share ?? [];
    return pts.map((p) => ({ year: p.year, ch: p.value }));
  }, [px]);

  const gapTrendData = useMemo(() => {
    return (data?.by_year ?? [])
      .map((y) => ({
        year: y.year,
        gap: (y.px?.switzerland?.share_supply ?? 0) - (y.px?.switzerland?.share_demand ?? 0),
      }))
      .filter((r) => r.year != null)
      .sort((a, b) => a.year - b.year);
  }, [data]);

  const countryTrendSupply = useMemo(() => {
    const cs = px?.country_series ?? [];
    if (!cs.length) return { data: [], series: [], colors: {} };
    const keys = cs.map((c) => ({
      key: c.id,
      label: c.label,
      points: c.supply_share ?? [],
    }));
    const colors = buildCountryColorMap(keys.map((k) => ({ id: k.key, label: k.label })));
    const series = keys.map((k) => ({
      ...k,
      color: colors[k.key] ?? PALETTE.muted,
    }));
    return {
      data: joinSeries(series),
      series,
      colors,
    };
  }, [px]);

  const seasonProfile = p4?.season?.profile ?? [];
  const seasonProfileCh = p4?.season?.ch_profile ?? [];
  const seasonYears = p4?.season?.years ?? [];

  if (embedPanel && isBayesEmbedPanel(embedPanel)) {
    return (
      <div className="wrap wrap-embed-panel">
        <EmbedPanelContent
          panel={embedPanel}
          bayesCharts={bayesCharts}
          bayesChartsLoading={bayesChartsLoading}
          bayesChartsError={bayesChartsError}
        />
      </div>
    );
  }

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

  const harmonized = data.harmonized ?? { origins: [], genres: [] };

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

  const p4Origins = mergeChannelOrigins(harmonized, snap?.cinema_p4?.origins, "cinema");
  const prevP4Origins = mergeChannelOrigins(harmonized, prevYearSnap?.cinema_p4?.origins, "cinema");
  const prevP4ById = indexRowsById(prevP4Origins);

  if (embedPanel) {
    return (
      <div className={`wrap wrap-embed-panel${embedPanel === "year" ? " wrap-embed-year" : ""}`}>
        <EmbedPanelContent
          panel={embedPanel}
          px={px}
          years={years}
          activeYear={activeYear}
          onYearChange={setYear}
          pxRow={pxRow}
          prevPxRow={prevYearPxRow}
          originRows={originRows}
          genreRows={genreRows}
          topCountries={topCountries}
          topCountryColors={topCountryColors}
          prevOriginById={prevOriginById}
          prevGenreById={prevGenreById}
          prevTopById={prevTopById}
          supplyTrendData={supplyTrendData}
          demandTrendData={demandTrendData}
          seasonProfile={seasonProfile}
          seasonProfileCh={seasonProfileCh}
          seasonYears={seasonYears}
          genreTrendDemand={genreTrendDemand}
          chGenreTrendDemand={chGenreTrendDemand}
          countryTrendDemand={countryTrendDemand}
          chShareTrendData={chShareTrendData}
          gapTrendData={gapTrendData}
          dimmedYears={dimmedYears}
          bayesCharts={isBayesEmbedPanel(embedPanel) ? bayesCharts : null}
          bayesChartsLoading={isBayesEmbedPanel(embedPanel) ? bayesChartsLoading : false}
          bayesChartsError={isBayesEmbedPanel(embedPanel) ? bayesChartsError : null}
        />
      </div>
    );
  }

  if (!data.harmonized?.origins?.length || !data.harmonized?.genres?.length) {
    return (
      <div className="wrap">
        <p className="page-intro-lead panel-error">
          Daten unvollständig (<code>harmonized</code> fehlt in unified.json). Bitte{" "}
          <code>node scripts/build_unified.mjs</code> ausführen.
        </p>
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
              Filme im Programm: Gesamtmarkt und Schweizer Filme im Vergleich (Anzahl Filme).
            </p>
            <ChartFrame title="Filme im Programm">
              <LineTrendChart
                data={supplyTrendData}
                height={260}
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
        )}

        {demandTrendData.length > 0 && (
          <section className="panel panel-primary">
            <div className="panel-label">Nachfrage (PX)</div>
            <p className="panel-intro panel-intro-meta">{px?.slice_label}</p>
            <p className="panel-intro">
              Kinobesuche in Millionen: Gesamtmarkt und Schweizer Filme im Vergleich (CH-Anteil im Tooltip).
            </p>
            <ChartFrame title="Kinobesuche">
              <LineTrendChart
                data={demandTrendData}
                height={260}
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
        )}

        {(countryTrendDemand.data.length > 0 || countryTrendSupply.data.length > 0) && (
          <section className="panel panel-primary" id="countries">
            <div className="panel-label">Top-Länder über die Jahre (PX)</div>
            <p className="panel-intro">
              Anteil am Gesamtkino für Schweiz, USA, Frankreich, Deutschland, UK, Italien und Übrige
              Länder (Restsumme) — je Land eine Linie über alle Jahre. Schweiz in Rostrot.
            </p>
            <div className="panel-chart-stack is-country-trends">
              {countryTrendDemand.data.length > 0 && (
                <ChartFrame title="Besuchsanteil">
                  <CountryTrendChart
                    data={countryTrendDemand.data}
                    series={countryTrendDemand.series}
                    colors={countryTrendDemand.colors}
                    dimmedYears={dimmedYears}
                    height={300}
                  />
                </ChartFrame>
              )}
              {countryTrendSupply.data.length > 0 && (
                <ChartFrame title="Programmanteil">
                  <CountryTrendChart
                    data={countryTrendSupply.data}
                    series={countryTrendSupply.series}
                    colors={countryTrendSupply.colors}
                    dimmedYears={dimmedYears}
                    height={300}
                  />
                </ChartFrame>
              )}
            </div>
          </section>
        )}

        {seasonProfile.length > 0 && (
          <section className="panel panel-primary">
            <div className="panel-label">Nachfrage · Besuche pro Kinowoche (P4)</div>
            <p className="panel-intro">
              Durchschnittliche Besuche pro Kinowoche — einmal für alle Herkünfte, einmal für Schweizer
              Filme.
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
                  <YearShareBarChart
                    data={genreTrendSupply.data}
                    series={genreTrendSupply.series}
                    height={300}
                    dimmedYears={dimmedYears}
                  />
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
                  <YearShareBarChart
                    data={genreTrendDemand.data}
                    series={genreTrendDemand.series}
                    height={300}
                    dimmedYears={dimmedYears}
                  />
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

      <YearCinemaPanel
        years={years}
        activeYear={activeYear}
        onYearChange={setYear}
        pxRow={pxRow}
        prevPxRow={prevYearPxRow}
        originRows={originRows}
        genreRows={genreRows}
        topCountries={topCountries}
        topCountryColors={topCountryColors}
        prevOriginById={prevOriginById}
        prevGenreById={prevGenreById}
        prevTopById={prevTopById}
      />

        {snap?.cinema_p4 && (
          <section className="panel panel-supplementary">
            <div className="panel-label">Kinowochen (P4) · {activeYear}</div>
            <p className="panel-intro">{p4?.note}</p>
            <div className="panel-label panel-label-sub">Herkunft</div>
            <MetricChartGroup
              rows={p4Origins}
              colors={ORIGIN_COLORS}
              barHeight={180}
              grouped
              prevRowById={prevP4ById}
            />
            <p className="panel-intro meta-note">
              Kinowochen ohne Genre-Spalte; Genre und detaillierte Herkunft über PX.
            </p>
          </section>
        )}

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
