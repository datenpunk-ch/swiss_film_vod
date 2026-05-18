#!/usr/bin/env node
/**
 * Unified export: PX (Filmangebot & Nachfrage) as primary; VoD + P4 as supplementary.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openPxCube } from "./lib/px_parse.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "analysis.json"), "utf8"));
const RAW = path.join(ROOT, "data", "raw");

const VOD_SLICE = CFG.vod.slice;
const VOD_ORIGINS = CFG.vod.origins.map((o) => o.id);
const VOD_GENRES = CFG.vod.genres.map((g) => g.id);
const CINEMA_ORIGINS = CFG.cinema.origins.map((o) => o.id);
const CINEMA_GENRES = CFG.cinema.genres;
const SEASON_YEARS = CFG.cinema.season_years;
const TOP_COUNTRIES = 10;

const HARM_ORIGINS = [
  { id: "ch", label: "Schweiz", color: "#b5542a", vod: "och", cinema: "och" },
  { id: "eu", label: "Europa (ohne CH)", color: "#c4896e", vod: "oep", cinema: "oeu" },
  { id: "ww", label: "Übrige Welt", color: "#e5d4c8", vod: "oot", cinema: "oot" },
];

const HARM_GENRES = [
  { id: "fic", label: "Fiktion / Spielfilm", color: "#0b0d10" },
  { id: "doc", label: "Dokumentar", color: "#b5542a" },
  { id: "ani", label: "Animation", color: "#c4896e" },
];

const EU_STATES = new Set([
  "Albanien", "Andorra", "Belgien", "Bulgarien", "Dänemark", "Deutschland", "Finnland", "Frankreich",
  "Griechenland", "Vereinigtes Königreich", "Irland", "Island", "Italien", "Liechtenstein", "Luxemburg",
  "Malta", "Monaco", "Niederlande", "Norwegen", "Österreich", "Polen", "Portugal", "Rumänien", "San Marino",
  "Schweden", "Spanien", "Türkei", "Ungarn", "Zypern", "Slowakei", "Tschechische Republik", "Serbien",
  "Kroatien", "Slowenien", "Bosnien und Herzegowina", "Montenegro", "Nordmazedonien", "Estland", "Lettland",
  "Litauen", "Moldova", "Ukraine", "Armenien", "Aserbaidschan", "Georgien",
]);

const PX_SLICE =
  "Sprachgebiet Schweiz · alle vorgeführten Filme · Genre-Total · Markt (Herkunftsland aggregiert)";

function parseCsv(text) {
  const raw = text.replace(/^\uFEFF/, "");
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < headers.length) continue;
    const row = {};
    headers.forEach((h, j) => {
      row[h] = cols[j].replace(/^"|"$/g, "");
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function sharesFromTotals(totals) {
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  if (sum <= 0) return Object.fromEntries(Object.keys(totals).map((k) => [k, 0]));
  return Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / sum]));
}

/** demand = Besuche/Views; supply = Filme im Programm/Katalog */
function metricBundle(demand, supply, demandTotal, supplyTotal) {
  return {
    demand,
    supply,
    share_demand: demandTotal > 0 ? demand / demandTotal : 0,
    share_supply: supplyTotal > 0 ? supply / supplyTotal : 0,
    intensity: supply > 0 ? demand / supply : null,
  };
}

function completeYears(years) {
  const cur = new Date().getFullYear();
  return [...new Set(years)].filter((y) => y < cur).sort((a, b) => a - b);
}

function pxCountryBucket(name) {
  if (!name.startsWith("......")) return null;
  const country = name.slice(6);
  if (country.includes("Schweiz")) return "ch";
  if (EU_STATES.has(country)) return "eu";
  return "ww";
}

function countryDisplay(name) {
  if (name.startsWith("......")) return name.slice(6);
  return name.replace(/^- Total /, "Total ");
}

function buildVodSupplementary(rows) {
  const baseFilter = (r, unit) =>
    r.TYPE_VOD === VOD_SLICE.type_vod &&
    r.UNIT === unit &&
    r.TYPE_FILM === VOD_SLICE.type_film &&
    r.STATUS === VOD_SLICE.status &&
    VOD_ORIGINS.includes(r.ORIGIN) &&
    VOD_GENRES.includes(r.GENRE);

  const byYearOriginGenre = { view: {}, film: {} };
  for (const unit of ["view", "film"]) {
    for (const r of rows.filter((row) => baseFilter(row, unit))) {
      const y = num(r.PERIODE);
      const o = r.ORIGIN;
      const g = r.GENRE;
      if (!byYearOriginGenre[unit][y]) byYearOriginGenre[unit][y] = {};
      if (!byYearOriginGenre[unit][y][o]) byYearOriginGenre[unit][y][o] = { fic: 0, doc: 0, ani: 0 };
      byYearOriginGenre[unit][y][o][g] += num(r.VALUE);
    }
  }

  const years = new Set([
    ...Object.keys(byYearOriginGenre.view),
    ...Object.keys(byYearOriginGenre.film),
  ]);
  const yearly = [];
  for (const ys of years) {
    const year = Number(ys);
    const viewOrigins = byYearOriginGenre.view[year] ?? {};
    const filmOrigins = byYearOriginGenre.film[year] ?? {};
    const demandByOrigin = {};
    const supplyByOrigin = {};
    const genreDemand = { fic: 0, doc: 0, ani: 0 };
    const genreSupply = { fic: 0, doc: 0, ani: 0 };

    for (const o of VOD_ORIGINS) {
      const vg = viewOrigins[o];
      const fg = filmOrigins[o];
      if (vg) {
        const t = vg.fic + vg.doc + vg.ani;
        demandByOrigin[o] = t;
        for (const gid of VOD_GENRES) genreDemand[gid] += vg[gid] ?? 0;
      }
      if (fg) {
        const t = fg.fic + fg.doc + fg.ani;
        supplyByOrigin[o] = t;
        for (const gid of VOD_GENRES) genreSupply[gid] += fg[gid] ?? 0;
      }
    }

    const demandTotal = Object.values(demandByOrigin).reduce((a, b) => a + b, 0);
    const supplyTotal = Object.values(supplyByOrigin).reduce((a, b) => a + b, 0);
    const genreDemandTotal = Object.values(genreDemand).reduce((a, b) => a + b, 0);
    const genreSupplyTotal = Object.values(genreSupply).reduce((a, b) => a + b, 0);

    const origins = VOD_ORIGINS.map((o) => {
      const demand = demandByOrigin[o] ?? 0;
      const supply = supplyByOrigin[o] ?? 0;
      const vg = viewOrigins[o];
      const fg = filmOrigins[o];
      const originDemand = vg ? vg.fic + vg.doc + vg.ani : 0;
      const originSupply = fg ? fg.fic + fg.doc + fg.ani : 0;
      const genreRows = VOD_GENRES.map((gid) => {
        const d = vg?.[gid] ?? 0;
        const s = fg?.[gid] ?? 0;
        return {
          id: gid,
          ...metricBundle(d, s, originDemand, originSupply),
        };
      });
      return {
        origin: o,
        ...metricBundle(demand, supply, demandTotal, supplyTotal),
        genres: genreRows,
      };
    });

    const genres = VOD_GENRES.map((gid) => ({
      id: gid,
      ...metricBundle(genreDemand[gid], genreSupply[gid], genreDemandTotal, genreSupplyTotal),
    }));

    if (demandTotal <= 0 && supplyTotal <= 0) continue;
    yearly.push({ year, market: metricBundle(demandTotal, supplyTotal, demandTotal, supplyTotal), origins, genres });
  }
  yearly.sort((a, b) => a.year - b.year);
  return {
    role: "supplementary",
    label: "StatVoD (VoD)",
    note: "Digitaler Kauf (EST): Views (Nachfrage) und Filme (Angebot) — anderer Markt als Kino; nur 2019–2024. Genre in VoD, nicht in P4.",
    slice_label: CFG.vod.slice_label,
    yearly,
  };
}

function buildCinemaP4Supplementary(rows) {
  const yf = CFG.cinema.yearly_origin;
  const demandUnit = yf.demand_unit ?? yf.unit ?? "adm";
  const supplyUnit = yf.supply_unit ?? "flm";
  const byYear = {};
  for (const r of rows.filter(
    (row) =>
      row.recent === yf.recent &&
      CINEMA_ORIGINS.includes(row.origin) &&
      (row.unit === demandUnit || row.unit === supplyUnit)
  )) {
    const y = num(r.year);
    if (!byYear[y]) byYear[y] = {};
    if (!byYear[y][r.origin]) byYear[y][r.origin] = { demand: 0, supply: 0 };
    if (r.unit === demandUnit) byYear[y][r.origin].demand += num(r.value);
    if (r.unit === supplyUnit) byYear[y][r.origin].supply += num(r.value);
  }

  const yearly = Object.entries(byYear)
    .map(([ys, totals]) => {
      const year = Number(ys);
      const demandTotal = CINEMA_ORIGINS.reduce((s, o) => s + (totals[o]?.demand ?? 0), 0);
      const supplyTotal = CINEMA_ORIGINS.reduce((s, o) => s + (totals[o]?.supply ?? 0), 0);
      return {
        year,
        market: metricBundle(demandTotal, supplyTotal, demandTotal, supplyTotal),
        origins: CINEMA_ORIGINS.map((o) => {
          const demand = totals[o]?.demand ?? 0;
          const supply = totals[o]?.supply ?? 0;
          return { origin: o, ...metricBundle(demand, supply, demandTotal, supplyTotal) };
        }),
      };
    })
    .sort((a, b) => a.year - b.year);

  const MONTH_LABELS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const monthFromDate = (dateStr) => {
    if (!dateStr) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr).trim());
    if (!m) return null;
    const month = Number(m[2]);
    return month >= 1 && month <= 12 ? month : null;
  };

  const wf = CFG.cinema.weekly;
  const buildSeasonProfile = (originCode) => {
    const weekly = rows.filter(
      (r) =>
        r.unit === wf.unit &&
        r.recent === wf.recent &&
        r.origin === originCode &&
        SEASON_YEARS.includes(num(r.year))
    );
    const byWeek = {};
    for (const r of weekly) {
      const w = num(r.week);
      if (!byWeek[w]) byWeek[w] = { values: [], date: r.date ?? null };
      byWeek[w].values.push(num(r.value));
      if (r.date) byWeek[w].date = r.date;
    }
    const profile = Object.entries(byWeek)
      .map(([w, bucket]) => ({
        week: Number(w),
        mean_admissions: bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length,
        date: bucket.date,
      }))
      .sort((a, b) => a.week - b.week);
    const totalMean = profile.reduce((s, p) => s + p.mean_admissions, 0);
    return profile.map((p) => {
      const month = monthFromDate(p.date);
      return {
        week: p.week,
        admissions: Math.round(p.mean_admissions),
        mean_admissions: p.mean_admissions,
        share: totalMean > 0 ? p.mean_admissions / totalMean : 0,
        month,
        month_label: month ? MONTH_LABELS[month - 1] : null,
      };
    });
  };

  return {
    role: "supplementary",
    label: "Kinostatistik (P4)",
    note: "Wöchentliche Eintritte; Herkunft jährlich mit Eintritten (adm) und Filmen (flm). Keine Genre-Dimension in dieser P4-Datei — Genre nur via PX (Kino) und VoD.",
    genre_available: false,
    season: {
      years: SEASON_YEARS,
      profile: buildSeasonProfile(wf.origin_all),
      ch_profile: buildSeasonProfile("och"),
    },
    yearly,
  };
}

function buildPxPrimary(pxText) {
  const cube = openPxCube(pxText);
  const idxTotalFilms = cube.genreIndex("Total der Filme");
  const genreIdx = Object.fromEntries(
    CINEMA_GENRES.map((g) => [g.id, cube.genreIndex(g.px_match)])
  );
  const ciTotal = cube.countryIndex((c) => c.includes("Herkunftsland - Total"));
  const ciCh = cube.countryIndex((c) => c.includes("Schweiz") && c.startsWith("......"));

  const yearly = [];
  const series = {
    market_demand: [],
    market_supply: [],
    ch_demand: [],
    ch_supply: [],
    ch_demand_share: [],
    genre_fic_demand_share: [],
    genre_doc_demand_share: [],
    genre_ani_demand_share: [],
    genre_fic_supply_share: [],
    genre_doc_supply_share: [],
    genre_ani_supply_share: [],
    ch_genre_fic_demand_share: [],
    ch_genre_doc_demand_share: [],
    ch_genre_ani_demand_share: [],
    ch_genre_fic_supply_share: [],
    ch_genre_doc_supply_share: [],
    ch_genre_ani_supply_share: [],
  };

  for (let yi = 0; yi < cube.years.length; yi++) {
    const year = cube.years[yi];
    if (year >= new Date().getFullYear()) continue;

    const marketAdm =
      ciTotal >= 0 ? cube.readCell(yi, ciTotal, idxTotalFilms, cube.idxUnitAdm) : 0;
    const marketFilms =
      ciTotal >= 0 ? cube.readCell(yi, ciTotal, idxTotalFilms, cube.idxUnitFilms) : 0;
    const market = metricBundle(marketAdm, marketFilms, marketAdm, marketFilms);

    const originDemand = { ch: 0, eu: 0, ww: 0 };
    const originSupply = { ch: 0, eu: 0, ww: 0 };
    const countryRows = [];
    for (let ci = 0; ci < cube.countries.length; ci++) {
      const name = cube.countries[ci];
      const bucket = pxCountryBucket(name);
      if (!bucket) continue;
      const demand = cube.readCell(yi, ci, idxTotalFilms, cube.idxUnitAdm);
      const supply = cube.readCell(yi, ci, idxTotalFilms, cube.idxUnitFilms);
      if (demand <= 0 && supply <= 0) continue;
      originDemand[bucket] += demand;
      originSupply[bucket] += supply;
      countryRows.push({
        name,
        label: countryDisplay(name),
        bucket,
        ...metricBundle(demand, supply, marketAdm, marketFilms),
      });
    }
    countryRows.sort((a, b) => b.demand - a.demand);
    const topCountries = countryRows.slice(0, TOP_COUNTRIES);

    const genreDemand = { fic: 0, doc: 0, ani: 0 };
    const genreSupply = { fic: 0, doc: 0, ani: 0 };
    for (const gid of ["fic", "doc", "ani"]) {
      const gi = genreIdx[gid];
      if (gi < 0 || ciTotal < 0) continue;
      genreDemand[gid] = cube.readCell(yi, ciTotal, gi, cube.idxUnitAdm);
      genreSupply[gid] = cube.readCell(yi, ciTotal, gi, cube.idxUnitFilms);
    }
    const genreDemandTotal = Object.values(genreDemand).reduce((a, b) => a + b, 0);
    const genreSupplyTotal = Object.values(genreSupply).reduce((a, b) => a + b, 0);

    const chAdm = ciCh >= 0 ? cube.readCell(yi, ciCh, idxTotalFilms, cube.idxUnitAdm) : 0;
    const chFilms = ciCh >= 0 ? cube.readCell(yi, ciCh, idxTotalFilms, cube.idxUnitFilms) : 0;
    const switzerland = {
      ...metricBundle(chAdm, chFilms, marketAdm, marketFilms),
      label: "Schweiz",
    };

    const chGenreDemand = { fic: 0, doc: 0, ani: 0 };
    const chGenreSupply = { fic: 0, doc: 0, ani: 0 };
    for (const gid of ["fic", "doc", "ani"]) {
      const gi = genreIdx[gid];
      if (gi < 0 || ciCh < 0) continue;
      chGenreDemand[gid] = cube.readCell(yi, ciCh, gi, cube.idxUnitAdm);
      chGenreSupply[gid] = cube.readCell(yi, ciCh, gi, cube.idxUnitFilms);
    }
    const chGenreDemandTotal = Object.values(chGenreDemand).reduce((a, b) => a + b, 0);
    const chGenreSupplyTotal = Object.values(chGenreSupply).reduce((a, b) => a + b, 0);

    yearly.push({
      year,
      market,
      origins: HARM_ORIGINS.map((h) => ({
        id: h.id,
        label: h.label,
        ...metricBundle(originDemand[h.id] ?? 0, originSupply[h.id] ?? 0, marketAdm, marketFilms),
      })),
      genres: HARM_GENRES.map((g) => ({
        id: g.id,
        label: g.label,
        ...metricBundle(genreDemand[g.id] ?? 0, genreSupply[g.id] ?? 0, genreDemandTotal, genreSupplyTotal),
      })),
      top_countries: topCountries,
      switzerland,
    });

    series.market_demand.push({ year, value: marketAdm });
    series.market_supply.push({ year, value: marketFilms });
    series.ch_demand.push({ year, value: chAdm });
    series.ch_supply.push({ year, value: chFilms });
    series.ch_demand_share.push({ year, value: switzerland.share_demand });
    series.ch_genre_fic_demand_share.push({
      year,
      value: chGenreDemandTotal > 0 ? chGenreDemand.fic / chGenreDemandTotal : 0,
    });
    series.ch_genre_doc_demand_share.push({
      year,
      value: chGenreDemandTotal > 0 ? chGenreDemand.doc / chGenreDemandTotal : 0,
    });
    series.ch_genre_ani_demand_share.push({
      year,
      value: chGenreDemandTotal > 0 ? chGenreDemand.ani / chGenreDemandTotal : 0,
    });
    series.ch_genre_fic_supply_share.push({
      year,
      value: chGenreSupplyTotal > 0 ? chGenreSupply.fic / chGenreSupplyTotal : 0,
    });
    series.ch_genre_doc_supply_share.push({
      year,
      value: chGenreSupplyTotal > 0 ? chGenreSupply.doc / chGenreSupplyTotal : 0,
    });
    series.ch_genre_ani_supply_share.push({
      year,
      value: chGenreSupplyTotal > 0 ? chGenreSupply.ani / chGenreSupplyTotal : 0,
    });
    series.genre_fic_demand_share.push({
      year,
      value: genreDemandTotal > 0 ? genreDemand.fic / genreDemandTotal : 0,
    });
    series.genre_doc_demand_share.push({
      year,
      value: genreDemandTotal > 0 ? genreDemand.doc / genreDemandTotal : 0,
    });
    series.genre_ani_demand_share.push({
      year,
      value: genreDemandTotal > 0 ? genreDemand.ani / genreDemandTotal : 0,
    });
    series.genre_fic_supply_share.push({
      year,
      value: genreSupplyTotal > 0 ? genreSupply.fic / genreSupplyTotal : 0,
    });
    series.genre_doc_supply_share.push({
      year,
      value: genreSupplyTotal > 0 ? genreSupply.doc / genreSupplyTotal : 0,
    });
    series.genre_ani_supply_share.push({
      year,
      value: genreSupplyTotal > 0 ? genreSupply.ani / genreSupplyTotal : 0,
    });
  }

  yearly.sort((a, b) => a.year - b.year);
  return {
    role: "primary",
    label: "Filmangebot und Nachfrage (BFS PX)",
    slice_label: PX_SLICE,
    years: yearly.map((y) => y.year),
    yearly,
    series,
  };
}

function main() {
  const vodRows = parseCsv(fs.readFileSync(path.join(RAW, "ts-x-16.02.01.10.csv"), "utf8"));
  const cinemaRows = parseCsv(fs.readFileSync(path.join(RAW, "ts-x-16.02.01-P4.csv"), "utf8"));
  const pxText = fs.readFileSync(path.join(RAW, "px-x-1602010000_200.px"), "latin1");

  const primary = buildPxPrimary(pxText);
  const supplementary = {
    vod: buildVodSupplementary(vodRows),
    cinema_p4: buildCinemaP4Supplementary(cinemaRows),
  };

  const byYear = primary.years.map((year) => ({
    year,
    px: primary.yearly.find((r) => r.year === year),
    vod: supplementary.vod.yearly.find((r) => r.year === year) ?? null,
    cinema_p4: supplementary.cinema_p4.yearly.find((r) => r.year === year) ?? null,
  }));

  const metaPath = path.join(ROOT, CFG.paths.bfs_metadata ?? "data/bfs_metadata.json");
  const bfsMeta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, "utf8")) : null;

  const out = {
    generated_at: new Date().toISOString(),
    model: "px_primary",
    lead:
      "Hauptstory aus BFS «Filmangebot und Nachfrage» (PX): Angebot, Nachfrage, Herkunft und Genre am Schweizer Kinomarkt (2014 ff.). VoD (StatVoD) und Kinowochen (P4) ergänzen andere Märkte und Zeitskalen.",
    harmonized: { origins: HARM_ORIGINS, genres: HARM_GENRES },
    primary: { px: primary },
    supplementary,
    years: primary.years,
    by_year: byYear,
    limitations: [
      "PX = Kinomarkt Schweiz (Sprachgebiet), nicht VoD.",
      "Nachfrage (Eintritte/Views) und Angebot (Filme) sind getrennt auszuwerten; Intensität = Nachfrage pro Film.",
      "VoD nur 2019–2024; Genre in VoD und PX, nicht in der P4-Wochen-CSV (keine Genre-Spalte).",
      "P4-Saison = Wochenprofil Kinobesuch (nur Besuche).",
      "Herkunft CH/EU/Welt: PX aus Einzelländern; P4/VoD nutzen BFS-Codes oeu/oep.",
    ],
    bfs_metadata: bfsMeta ? CFG.paths.bfs_metadata : null,
  };

  const outPath = path.join(ROOT, CFG.paths.unified_output ?? "data/unified.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log("wrote", outPath, `(${primary.years.length} PX years)`);
}

main();
