import { useMemo, useState } from "react";
import ChartFrame from "./components/ChartFrame.jsx";
import KpiGrid from "./components/KpiGrid.jsx";
import LineTrendChart from "./components/LineTrendChart.jsx";
import YearShareBarChart from "./components/YearShareBarChart.jsx";
import MetricChartGroup from "./components/MetricChartGroup.jsx";
import WeeklyAdmissionsChart from "./components/WeeklyAdmissionsChart.jsx";
import { GENRE_COLORS, ORIGIN_COLORS } from "./constants.js";
import { useUnifiedData } from "./hooks/useUnifiedData.js";
import { buildCountryColorMap } from "./utils/countryColors.js";
import { collapseTopCountries } from "./utils/collapseCountries.js";
import {
  mergeChannelOrigins,
  mergeGenreRows,
  mergePxGenres,
  mergePxOrigins,
} from "./utils/merge.js";

const isEmbed = document.documentElement.classList.contains("is-embed");

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

  const marketTrendData = useMemo(() => {
    const s = px?.series;
    if (!s) return [];
    return joinSeries([
      { key: "demand", points: s.market_demand ?? s.market_admissions },
      { key: "supply", points: s.market_supply ?? s.market_films },
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

  const seasonProfile = p4?.season?.profile ?? [];
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

  const vodOrigins = mergeChannelOrigins(harmonized, snap?.vod?.origins, "vod");
  const p4Origins = mergeChannelOrigins(harmonized, snap?.cinema_p4?.origins, "cinema");

  return (
    <div className="wrap">
      {!isEmbed && (
        <header className="page-head">
          <h1>Schweiz: was läuft, wann, woher?</h1>
          <p className="page-intro-lead">{data.lead}</p>
        </header>
      )}
      {isEmbed && <p className="page-intro-lead visually-hidden">{data.lead}</p>}

      <div className="controls controls-year-only">
        <div className="control-group">
          <label htmlFor="yearSelect">Jahr (PX)</label>
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
        <div className="panel-label">Kinomarkt Schweiz (PX)</div>
        <p className="panel-intro panel-intro-meta">{px?.slice_label}</p>
        <KpiGrid pxRow={pxRow} year={activeYear} />
      </section>

      <section className="panel panel-primary">
        <div className="panel-label">Angebot &amp; Nachfrage über die Jahre</div>
        <ChartFrame>
          <LineTrendChart
            data={marketTrendData}
            height={260}
            series={[
              { key: "demand", label: "Kinobesucher", color: "#0b0d10" },
              { key: "supply", label: "Filme im Programm", color: "#c4896e" },
            ]}
          />
        </ChartFrame>
      </section>

      {seasonProfile.length > 0 && (
        <section className="panel panel-primary">
          <div className="panel-label">Besuche pro Kinowoche (P4)</div>
          <p className="panel-intro">
            Verteilung der Kinobesuche über das Jahr (Ø Besucher pro Woche, alle Filme, alle Herkünfte).
            {seasonYears.length ? ` Basisjahre: ${seasonYears.join(", ")}.` : ""}
          </p>
          <ChartFrame>
            <WeeklyAdmissionsChart profile={seasonProfile} years={seasonYears} height={300} />
          </ChartFrame>
        </section>
      )}

      <section className="panel panel-primary">
        <div className="panel-label">Herkunft (CH · Europa · Welt)</div>
        <MetricChartGroup
          rows={originRows}
          colors={ORIGIN_COLORS}
          marketIntensity={pxRow?.market?.intensity}
        />
        <div className="panel-label panel-label-sub">Top-Länder · {activeYear}</div>
        <MetricChartGroup
          rows={topCountries}
          colors={topCountryColors}
          variant="countries"
          barHeight={200}
          marketIntensity={pxRow?.market?.intensity}
        />
      </section>

      <section className="panel panel-primary">
        <div className="panel-label">Genre (Fiktion · Dokumentar · Animation)</div>
        <MetricChartGroup rows={genreRows} colors={GENRE_COLORS} marketIntensity={pxRow?.market?.intensity} />
        <div className="panel-label panel-label-sub">Genre-Anteile über die Jahre</div>
        <div className="unified-grid is-genre-years">
          <ChartFrame title="Nachfrage (Anteil)">
            <YearShareBarChart data={genreTrendDemand.data} series={genreTrendDemand.series} height={300} />
          </ChartFrame>
          <ChartFrame title="Angebot (Anteil)">
            <YearShareBarChart data={genreTrendSupply.data} series={genreTrendSupply.series} height={300} />
          </ChartFrame>
        </div>
      </section>

      <section className="panel panel-supplementary">
        <div className="panel-label">Zusatzdaten: VoD &amp; Kinowochen</div>
        <p className="panel-intro">{[vod?.note, p4?.note].filter(Boolean).join(" ")}</p>

        {snap?.vod && (
          <>
            <div className="panel-label panel-label-sub">VoD — Herkunft</div>
            <MetricChartGroup rows={vodOrigins} colors={ORIGIN_COLORS} barHeight={180} />
          </>
        )}

        {snap?.cinema_p4 && (
          <>
            <div className="panel-label panel-label-sub">Kino P4 — Herkunft</div>
            <MetricChartGroup rows={p4Origins} colors={ORIGIN_COLORS} barHeight={180} />
          </>
        )}

        {snap?.vod && (
          <>
            <div className="panel-label panel-label-sub">VoD — Genre (gesamt und pro Herkunft)</div>
            <MetricChartGroup
              rows={mergeGenreRows(harmonized, snap.vod.genres)}
              colors={GENRE_COLORS}
              barHeight={180}
            />
            {vodOrigins.map((o) => (
              <div key={o.id} className="vod-origin-genre-block">
                <div className="panel-label panel-label-sub">VoD · {o.label}</div>
                <MetricChartGroup rows={mergeGenreRows(harmonized, o.genres)} colors={GENRE_COLORS} barHeight={160} />
              </div>
            ))}
          </>
        )}

        <p className="panel-intro meta-note">
          Kinowochen (P4): keine Genre-Dimension in der BFS-Datei — Genre über PX (Kino) und VoD.
        </p>
      </section>

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
          Swiss Film · <a href="./index.html">Artikel</a>
        </footer>
      )}
    </div>
  );
}
