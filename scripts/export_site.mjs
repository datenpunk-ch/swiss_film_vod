#!/usr/bin/env node
/**
 * Process BFS CSV files → data/*.json for the static site.
 * Run: node scripts/export_site.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(ROOT, "data", "raw");
const DOCS_DATA = path.join(ROOT, "data");

const ORIGIN_LABELS = {
  och: "Schweiz",
  oep: "Europa (ohne CH)",
  oot: "Übrige Welt",
  oall: "Alle Herkünfte",
  rall: "Alle (aktuell)",
};

const VOD_TYPE_LABELS = {
  EST: "Kauf (EST)",
  VOD: "Leihe (TVoD)",
  TVOD: "Leihe (TVoD)",
  SVOD: "Abo (SVoD)",
};

const GENRE_LABELS = {
  all: "Alle Genres",
  fic: "Fiktion",
  doc: "Dokumentar",
  ani: "Animation",
};

const ORIGIN_IDS = ["och", "oep", "oot"];
const GENRE_IDS = ["fic", "doc", "ani"];
const VOD_TYPE_IDS = ["EST", "TVOD", "SVOD"];

const CINEMA_ORIGIN_LABELS = {
  oall: "Alle Herkünfte",
  och: "Schweiz",
  oeu: "Europa (ohne CH)",
  oot: "Übrige Welt",
  ous: "Unbestimmt",
};

const CINEMA_UNIT_LABELS = {
  adm: "Kinobesuche",
  cin: "Kinos",
  flm: "Filme",
  prj: "Vorführungen",
  scr: "Leinwände",
};

const CINEMA_ORIGIN_IDS = ["och", "oeu", "oot", "ous"];
const CINEMA_UNIT_IDS = ["adm", "cin", "flm", "prj", "scr"];
const RECENT_IDS = ["rall", "rnew"];
const RECENT_LABELS = { rall: "Alle Aufführungen", rnew: "Neuaufführungen" };

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
      } else {
        inQ = !inQ;
      }
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJson(name, obj) {
  const fp = path.join(DOCS_DATA, name);
  fs.writeFileSync(fp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  console.log("wrote", fp);
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function latestCompleteYear(years) {
  const currentYear = String(new Date().getFullYear());
  const complete = years.filter((y) => y < currentYear);
  return complete.length ? complete[complete.length - 1] : years[years.length - 1];
}

function sumRows(rows, unit) {
  return rows
    .filter((r) => r.UNIT === unit && r.TYPE_FILM === "all" && r.GENRE === "all" && r.ORIGIN === "all")
    .reduce((s, r) => s + num(r.VALUE), 0);
}

function pick(rows, crit) {
  return rows.filter((r) => {
    for (const [k, v] of Object.entries(crit)) {
      if (r[k] !== v) return false;
    }
    return true;
  });
}

function valueOf(rows, crit) {
  const hit = pick(rows, crit);
  return hit.length ? num(hit[0].VALUE) : 0;
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(v);
}

function uniqueSorted(rows, key) {
  return [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort();
}

function buildVarCatalog(rows, specs) {
  return specs.map((s) => {
    const values = uniqueSorted(rows, s.key);
    const preview =
      values.length > 12 ? values.slice(0, 10).join(", ") + ", …" : values.join(", ");
    return {
      name: s.key,
      description: s.description,
      values,
      values_label: `${values.length} Werte: ${preview}`,
    };
  });
}

function vodDataset(rows) {
  return {
    id: "vod",
    source_file: "data/raw/ts-x-16.02.01.10.csv",
    official_title: "Film- und Kinostatistik – Video on Demand (StatVoD)",
    summary:
      "Jährliche BFS-Statistik zu Video-on-Demand in der Schweiz: Anzahl Filme und Views/Transaktionen nach Vertriebsmodell, Herkunftsregion und Genre.",
    period: "2019–2024",
    size_label: `${rows.length.toLocaleString("de-CH")} Zeilen`,
    format: "CSV (UTF-8, Semikolon-kompatibel mit Komma-Trennung)",
    link: "https://www.bfs.admin.ch/bfs/de/home/statistiken/kultur-medien-informationsgesellschaft-sport/kultur/film-kinostatistik.html",
    notes: [
      "Für Totals ORIGIN=all verwenden; och+oep+oot kann von all abweichen (ous, Rundungen).",
      "STATUS=D: deaktivierte Werte — im Export werden alle Zeilen gezählt.",
    ],
    variables: buildVarCatalog(rows, [
      { key: "PERIODE", description: "Berichtsjahr" },
      { key: "TYPE_VOD", description: "VoD-Modell (EST/TVOD/SVOD)" },
      { key: "TYPE_FILM", description: "Filmebene (all/cin)" },
      { key: "ORIGIN", description: "Herkunftsregion" },
      { key: "GENRE", description: "Genre" },
      { key: "UNIT", description: "Kennzahl (film/view)" },
      { key: "VALUE", description: "Messwert (ganze Zahl)" },
      { key: "STATUS", description: "Datenstatus (A/D)" },
    ]),
  };
}

function cinemaDataset(rows) {
  const years = uniqueSorted(rows, "year");
  return {
    id: "cinema",
    source_file: "data/raw/ts-x-16.02.01-P4.csv",
    official_title: "Kinostatistik – Ergebnisse nach Kinowochen",
    summary:
      "Wöchentliche Kinostatistik: Besuche, Filme, Vorführungen u. a. nach Herkunft und Neuaufführungen. Für Jahresvergleiche nur vollständige Kalenderjahre nutzen.",
    period: `${years[0]}–${years[years.length - 1]} (wöchentlich)`,
    size_label: `${rows.length.toLocaleString("de-CH")} Zeilen`,
    format: "CSV",
    link: "https://www.bfs.admin.ch/bfs/de/home/statistiken/kultur-medien-informationsgesellschaft-sport/kultur/film-kinostatistik.html",
    notes: [
      "Herkunftscode ist oeu (Europa), nicht oep wie bei VoD.",
      "Jahre 2025/2026 können noch unvollständig sein.",
    ],
    variables: buildVarCatalog(rows, [
      { key: "year", description: "Kalenderjahr" },
      { key: "week", description: "Kalenderwoche (1–53)" },
      { key: "date", description: "Referenzdatum der Woche" },
      { key: "unit", description: "Beobachtungseinheit" },
      { key: "recent", description: "Alle vs. Neuaufführungen" },
      { key: "origin", description: "Herkunftsregion" },
      { key: "value", description: "Messwert" },
    ]),
  };
}

function extractPxValuesBlock(text, dimName) {
  const re = new RegExp(
    `VALUES\\("(${dimName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})"\\)=([^\\n]+(?:\\n[^A-Z][^\\n]*)*)`,
    "m"
  );
  const m = text.match(re);
  if (!m) return [];
  const raw = m[2].replace(/\r?\n/g, "").replace(/"\s*"/g, "");
  const parts = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      const v = cur.trim().replace(/^"|"$/g, "");
      if (v) parts.push(v);
      cur = "";
    } else cur += ch;
  }
  const last = cur.trim().replace(/^"|"$/g, "");
  if (last) parts.push(last);
  return parts.map((v) => v.replace(/;+\s*$/, "").trim()).filter(Boolean);
}

function extractPxField(text, key) {
  const re = new RegExp(`^${key}="([^"]*)"`, "m");
  const m = text.match(re);
  return m ? m[1] : "";
}

function parsePxData(text) {
  const idx = text.indexOf("DATA=");
  if (idx < 0) return [];
  const chunk = text.slice(idx + 5);
  const nums = [];
  const re = /-?\d+/g;
  let m;
  while ((m = re.exec(chunk))) nums.push(Number(m[0]));
  return nums;
}

function parsePxFile(pxText) {
  const years = extractPxValuesBlock(pxText, "Jahr");
  const countries = extractPxValuesBlock(pxText, "Herkunftsland");
  const langRegions = extractPxValuesBlock(pxText, "Sprachgebiet");
  const filmTypes = extractPxValuesBlock(pxText, "Alle Filme - Erstaufführungen");
  const genreBlock = extractPxValuesBlock(pxText, "Sprachfassung - Projektionsart - Genre");
  const units = extractPxValuesBlock(pxText, "Beobachtungseinheit");

  const data = parsePxData(pxText);
  const nUnit = units.length;
  const nGenre = genreBlock.length;
  const nFilm = filmTypes.length;
  const nLang = langRegions.length;
  const nCountry = countries.length;
  const blockSize = nGenre * nUnit;
  const countrySize = nLang * nFilm * blockSize;
  const yearSize = nCountry * countrySize;

  const idxCountry = countries.findIndex((c) => c.includes("Schweiz") && c.startsWith("......"));
  const idxLang = langRegions.indexOf("Schweiz");
  const idxFilm = filmTypes.findIndex((f) => f.startsWith("Alle vorgeführten"));
  const idxGenre = genreBlock.findIndex((g) => g.startsWith("Total der Filme"));
  const idxUnitFilms = units.findIndex((u) => u.startsWith("Anzahl Filme"));
  const idxUnitScr = units.findIndex((u) => u.startsWith("Anzahl Vorführungen"));
  const idxUnitAdm = units.findIndex((u) => u.startsWith("Kinoeintritte"));

  function readCell(yearIdx, countryIdx, unitIdx) {
    if (
      [idxLang, idxFilm, idxGenre, unitIdx].some((i) => i < 0) ||
      countryIdx < 0
    ) {
      return 0;
    }
    const i =
      yearIdx * yearSize +
      countryIdx * countrySize +
      idxLang * nFilm * blockSize +
      idxFilm * blockSize +
      idxGenre * nUnit +
      unitIdx;
    return data[i] ?? 0;
  }

  const yearly = [];
  const yearlyTotal = [];
  for (let yi = 0; yi < years.length; yi++) {
    const yearNum = Number(years[yi]);
    if (!Number.isFinite(yearNum)) continue;
    const ci = idxCountry >= 0 ? idxCountry : 1;
    yearly.push({
      year: yearNum,
      admissions: readCell(yi, ci, idxUnitAdm),
      films: readCell(yi, ci, idxUnitFilms),
      screenings: readCell(yi, ci, idxUnitScr),
      slice: "Schweiz · Alle vorgeführten Filme · Total der Filme",
    });

    yearlyTotal.push({
      year: yearNum,
      admissions: readCell(yi, 0, idxUnitAdm),
      films: readCell(yi, 0, idxUnitFilms),
      screenings: readCell(yi, 0, idxUnitScr),
      slice: "Herkunftsland Total · Schweiz (Sprachgebiet) · Alle vorgeführten Filme",
    });
  }

  return {
    meta: {
      description: extractPxField(pxText, "DESCRIPTION"),
      title: extractPxField(pxText, "TITLE"),
      link: extractPxField(pxText, "LINK"),
      survey: extractPxField(pxText, "SURVEY"),
      last_updated: extractPxField(pxText, "LAST-UPDATED"),
      matrix: extractPxField(pxText, "MATRIX"),
    },
    dimensions: [
      { name: "Jahr", count: years.length, sample: years.join(", ") },
      {
        name: "Herkunftsland",
        count: countries.length,
        sample: countries.slice(0, 4).join(", ") + ", …",
      },
      { name: "Sprachgebiet", count: langRegions.length, sample: langRegions.join(", ") },
      { name: "Alle Filme – Erstaufführungen", count: filmTypes.length, sample: filmTypes.join(", ") },
      {
        name: "Sprachfassung – Projektionsart – Genre",
        count: genreBlock.length,
        sample: genreBlock.join(", "),
      },
      { name: "Beobachtungseinheit", count: units.length, sample: units.join(", ") },
    ],
    data_cell_count: data.length,
    expected_cell_count: years.length * yearSize,
    yearly_ch: yearly,
    yearly_total: yearlyTotal,
    units: units.map((label, i) => ({ id: String(i), label })),
  };
}

function pxDataset(px) {
  const years = px.yearly_ch.map((y) => y.year);
  return {
    id: "px",
    source_file: "data/raw/px-x-1602010000_200.px",
    official_title: px.meta.title || "Filmangebot und Nachfrage (STAT-TAB)",
    summary: px.meta.description || "",
    period: years.length ? `${years[0]}–${years[years.length - 1]}` : "—",
    size_label: `${px.data_cell_count.toLocaleString("de-CH")} Datenzellen (PX)`,
    format: "PC-Axis (.px), ISO-8859-15",
    link: px.meta.link || "https://www.pxweb.bfs.admin.ch/",
    notes: [
      "PX enthält detaillierte Kreuztabellen (Land × Sprachgebiet × Genre × …).",
      "Jahreswerte auf der Statistik-Seite: Schweiz, alle vorgeführten Filme, Total der Filme (aus PX-Matrix extrahiert).",
      "Vergleich 2019↔2020 bei «vorgeführten Filmen» laut BFS-Methodik eingeschränkt.",
    ],
    dimensions: px.dimensions,
    variables: px.units.map((u) => ({
      name: u.label,
      description: "Beobachtungseinheit",
      values_label: "Teil der Kopfachse «Beobachtungseinheit»",
    })),
  };
}

function buildVodSlice(yr, vodType, unit, typeFilm) {
  const byOrigin = ORIGIN_IDS.map((id) => ({
    id,
    label: ORIGIN_LABELS[id],
    value: valueOf(yr, {
      TYPE_VOD: vodType,
      UNIT: unit,
      ORIGIN: id,
      GENRE: "all",
      TYPE_FILM: typeFilm,
    }),
  }));
  const byGenre = ["all", ...GENRE_IDS].map((id) => ({
    id,
    label: GENRE_LABELS[id] || id,
    value: valueOf(yr, {
      TYPE_VOD: vodType,
      UNIT: unit,
      GENRE: id,
      ORIGIN: "all",
      TYPE_FILM: typeFilm,
    }),
  }));
  const total = valueOf(yr, {
    TYPE_VOD: vodType,
    UNIT: unit,
    ORIGIN: "all",
    GENRE: "all",
    TYPE_FILM: typeFilm,
  });
  const originSum = byOrigin.reduce((s, o) => s + o.value, 0);
  const matrix_origin_genre = [];
  for (const o of ORIGIN_IDS) {
    for (const g of GENRE_IDS) {
      matrix_origin_genre.push({
        origin: o,
        origin_label: ORIGIN_LABELS[o],
        genre: g,
        genre_label: GENRE_LABELS[g],
        value: valueOf(yr, {
          TYPE_VOD: vodType,
          UNIT: unit,
          ORIGIN: o,
          GENRE: g,
          TYPE_FILM: typeFilm,
        }),
      });
    }
  }
  return {
    total,
    by_origin: byOrigin,
    by_genre: byGenre,
    matrix_origin_genre,
    share_ch: originSum > 0 ? (byOrigin.find((o) => o.id === "och")?.value || 0) / originSum : 0,
  };
}

function buildSeriesStats(yearly, sliceKey) {
  const series = yearly.map((y) => y.slices[sliceKey]?.total ?? 0);
  const first = series[0];
  const last = series[series.length - 1];
  return {
    mean: Math.round(mean(series)),
    median: Math.round(median(series)),
    min: Math.min(...series),
    max: Math.max(...series),
    min_year: yearly.find((y) => y.slices[sliceKey]?.total === Math.min(...series))?.year,
    max_year: yearly.find((y) => y.slices[sliceKey]?.total === Math.max(...series))?.year,
    std_dev: Math.round(stdDev(series)),
    sum: series.reduce((a, b) => a + b, 0),
    cagr: first > 0 && series.length > 1 ? (last / first) ** (1 / (series.length - 1)) - 1 : null,
    yoy: yearly.map((y, i) => {
      if (i === 0) return { year: y.year, change: null };
      const prev = yearly[i - 1].slices[sliceKey]?.total ?? 0;
      const cur = y.slices[sliceKey]?.total ?? 0;
      return { year: y.year, change: prev > 0 ? (cur - prev) / prev : null };
    }),
  };
}

function processVodStats(rows) {
  const years = [...new Set(rows.map((r) => r.PERIODE))].sort();
  const latestYear = latestCompleteYear(years);
  const typeFilmIds = ["all", "cin"];
  const unitIds = ["view", "film"];

  const yearly = years.map((year) => {
    const yr = pick(rows, { PERIODE: year });
    const slices = {};
    for (const vt of VOD_TYPE_IDS) {
      for (const unit of unitIds) {
        for (const tf of typeFilmIds) {
          slices[`${vt}|${unit}|${tf}`] = buildVodSlice(yr, vt, unit, tf);
        }
      }
    }
    const byType = {};
    for (const t of VOD_TYPE_IDS) {
      byType[t] = {
        views: slices[`${t}|view|all`]?.total ?? 0,
        films: slices[`${t}|film|all`]?.total ?? 0,
      };
    }
    return {
      year: Number(year),
      slices,
      by_vod_type: byType,
      est_views_total: slices["EST|view|all"]?.total ?? 0,
    };
  });

  const latest = yearly.find((y) => String(y.year) === latestYear) || yearly[yearly.length - 1];

  return {
    generated_at: new Date().toISOString(),
    source_file: "ts-x-16.02.01.10.csv",
    dataset: vodDataset(rows),
    years: years.map(Number),
    latest_year: Number(latestYear),
    row_count: rows.length,
    stat_options: [
      {
        id: "vodType",
        label: "VoD-Modell",
        options: VOD_TYPE_IDS.map((id) => ({ id, label: VOD_TYPE_LABELS[id] || id })),
      },
      {
        id: "unit",
        label: "Kennzahl",
        options: [
          { id: "view", label: "Views / Transaktionen" },
          { id: "film", label: "Anzahl Filme" },
        ],
      },
      {
        id: "typeFilm",
        label: "Filmebene",
        options: [
          { id: "all", label: "Alle Filme" },
          { id: "cin", label: "Kino-/Kinofilme" },
        ],
      },
    ],
    defaults: { vodType: "EST", unit: "view", typeFilm: "all" },
    overview: {
      year_span: `${years[0]}–${years[years.length - 1]}`,
      years_count: years.length,
      latest_est_views: latest?.est_views_total ?? 0,
    },
    yearly,
  };
}

function processVod(rows) {
  const years = [...new Set(rows.map((r) => r.PERIODE))].sort();
  const latestYear = latestCompleteYear(years);

  const byYearOrigin = {};
  for (const r of rows) {
    if (
      r.TYPE_FILM !== "all" ||
      r.GENRE !== "all" ||
      r.UNIT !== "view" ||
      r.TYPE_VOD !== "EST" ||
      !["och", "oep", "oot"].includes(r.ORIGIN)
    ) {
      continue;
    }
    const y = r.PERIODE;
    if (!byYearOrigin[y]) byYearOrigin[y] = {};
    byYearOrigin[y][r.ORIGIN] = Number(r.VALUE) || 0;
  }

  const series = years.map((y) => {
    const o = byYearOrigin[y] || {};
    const total = (o.och || 0) + (o.oep || 0) + (o.oot || 0);
    return {
      year: Number(y),
      och: o.och || 0,
      oep: o.oep || 0,
      oot: o.oot || 0,
      total,
      share_ch: total > 0 ? (o.och || 0) / total : 0,
    };
  });

  const latest = byYearOrigin[latestYear] || {};
  const latestTotal =
    (latest.och || 0) + (latest.oep || 0) + (latest.oot || 0);

  const typeBreakdown = {};
  for (const r of rows) {
    if (r.PERIODE !== latestYear || r.TYPE_FILM !== "all" || r.GENRE !== "all" || r.UNIT !== "view" || r.ORIGIN !== "all") {
      continue;
    }
    typeBreakdown[r.TYPE_VOD] = Number(r.VALUE) || 0;
  }

  return {
    latest_year: Number(latestYear),
    series,
    latest_by_origin: [
      { id: "och", label: ORIGIN_LABELS.och, views: latest.och || 0 },
      { id: "oep", label: ORIGIN_LABELS.oep, views: latest.oep || 0 },
      { id: "oot", label: ORIGIN_LABELS.oot, views: latest.oot || 0 },
    ],
    latest_total_views: latestTotal,
    latest_type_breakdown: Object.entries(typeBreakdown).map(([id, views]) => ({
      id,
      label: VOD_TYPE_LABELS[id] || id,
      views,
    })),
  };
}

function buildCinemaSlice(yr, unit, recent) {
  const byOrigin = CINEMA_ORIGIN_IDS.map((id) => ({
    id,
    label: CINEMA_ORIGIN_LABELS[id],
    value: yr
      .filter((r) => r.unit === unit && r.recent === recent && r.origin === id)
      .reduce((s, r) => s + num(r.value), 0),
  }));
  const total =
    yr
      .filter((r) => r.unit === unit && r.recent === recent && r.origin === "oall")
      .reduce((s, r) => s + num(r.value), 0) ||
    byOrigin.reduce((s, o) => s + o.value, 0);
  return { total, by_origin: byOrigin };
}

function processCinemaStats(rows) {
  const years = uniqueSorted(rows, "year").map(Number);
  const completeYears = years.filter((y) => y < new Date().getFullYear());
  const latestYear = completeYears[completeYears.length - 1];

  const yearly = completeYears.map((year) => {
    const yr = rows.filter((r) => Number(r.year) === year);
    const slices = {};
    for (const unit of CINEMA_UNIT_IDS) {
      for (const recent of RECENT_IDS) {
        slices[`${unit}|${recent}`] = buildCinemaSlice(yr, unit, recent);
      }
    }
    return {
      year,
      slices,
      weeks_recorded: new Set(yr.map((r) => r.week)).size,
      admissions_total: slices["adm|rall"]?.total ?? 0,
    };
  });

  const focusYear = latestYear;
  const weeklyByKey = {};
  for (const unit of CINEMA_UNIT_IDS) {
    for (const recent of RECENT_IDS) {
      const key = `${unit}|${recent}`;
      weeklyByKey[key] = rows
        .filter(
          (r) =>
            Number(r.year) === focusYear &&
            r.unit === unit &&
            r.recent === recent &&
            r.origin === "oall"
        )
        .map((r) => ({
          week: Number(r.week),
          date: r.date,
          value: num(r.value),
        }))
        .sort((a, b) => a.week - b.week);
    }
  }

  const latest = yearly.find((y) => y.year === latestYear) || yearly[yearly.length - 1];

  return {
    generated_at: new Date().toISOString(),
    source_file: "ts-x-16.02.01-P4.csv",
    dataset: cinemaDataset(rows),
    years: completeYears,
    latest_year: latestYear,
    row_count: rows.length,
    stat_options: [
      {
        id: "unit",
        label: "Beobachtungseinheit",
        options: CINEMA_UNIT_IDS.map((id) => ({ id, label: CINEMA_UNIT_LABELS[id] })),
      },
      {
        id: "recent",
        label: "Aufführungen",
        options: RECENT_IDS.map((id) => ({ id, label: RECENT_LABELS[id] })),
      },
    ],
    defaults: { unit: "adm", recent: "rall" },
    overview: {
      year_span: `${completeYears[0]}–${completeYears[completeYears.length - 1]}`,
      latest_admissions: latest?.admissions_total || 0,
      latest_weeks: latest?.weeks_recorded || 0,
    },
    weekly_by_key: weeklyByKey,
    weekly_focus_year: focusYear,
    yearly,
  };
}

function processPxStats(pxParsed) {
  const years = pxParsed.yearly_ch.map((y) => y.year);
  const latestYear = years[years.length - 1];

  return {
    generated_at: new Date().toISOString(),
    source_file: "px-x-1602010000_200.px",
    dataset: pxDataset(pxParsed),
    meta: pxParsed.meta,
    years,
    latest_year: latestYear,
    row_count: pxParsed.data_cell_count,
    stat_options: [
      {
        id: "slice",
        label: "Herkunftsschnitt",
        options: [
          { id: "total", label: "Alle Herkünfte (Total)" },
          { id: "ch", label: "Nur Schweiz (Herkunftsland)" },
        ],
      },
      {
        id: "metric",
        label: "Kennzahl",
        options: [
          { id: "admissions", label: "Kinoeintritte" },
          { id: "films", label: "Anzahl Filme" },
          { id: "screenings", label: "Vorführungen" },
        ],
      },
    ],
    defaults: { slice: "total", metric: "admissions" },
    overview: {
      year_span: years.length ? `${years[0]}–${years[years.length - 1]}` : "—",
      latest_admissions_ch: pxParsed.yearly_ch[pxParsed.yearly_ch.length - 1]?.admissions || 0,
      matrix: pxParsed.meta.matrix,
    },
    yearly_ch: pxParsed.yearly_ch,
    yearly_total: pxParsed.yearly_total,
  };
}

function processCinema(rows) {
  const filtered = rows.filter(
    (r) => r.unit === "adm" && r.recent === "rall" && r.origin === "oall"
  );

  const byYear = {};
  for (const r of filtered) {
    const y = r.year;
    if (!byYear[y]) byYear[y] = 0;
    byYear[y] += Number(r.value) || 0;
  }

  const yearlyAll = Object.entries(byYear)
    .map(([year, admissions]) => ({ year: Number(year), admissions }))
    .sort((a, b) => a.year - b.year);

  const currentYear = new Date().getFullYear();
  const yearly = yearlyAll.filter((y) => y.year < currentYear);
  const years = yearly.map((y) => y.year);
  const focusYears = years.filter((y) => y >= 2019);
  const weekly = filtered
    .filter((r) => focusYears.includes(Number(r.year)))
    .map((r) => ({
      year: Number(r.year),
      week: Number(r.week),
      date: r.date,
      admissions: Number(r.value) || 0,
    }))
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.week - b.week));

  const lastYear = years[years.length - 1];
  const prevYear = years[years.length - 2];
  const lastAdm = byYear[lastYear] || 0;
  const prevAdm = byYear[prevYear] || 0;

  return {
    yearly,
    weekly,
    focus_years: focusYears,
    latest_year: Number(lastYear),
    yoy_change:
      prevAdm > 0 ? (lastAdm - prevAdm) / prevAdm : null,
    latest_admissions: lastAdm,
    prev_admissions: prevAdm,
  };
}

function main() {
  ensureDir(DOCS_DATA);

  const vodPath = path.join(RAW_DIR, "ts-x-16.02.01.10.csv");
  const cinemaPath = path.join(RAW_DIR, "ts-x-16.02.01-P4.csv");
  const pxPath = path.join(RAW_DIR, "px-x-1602010000_200.px");

  const vodRows = parseCsv(fs.readFileSync(vodPath, "utf8"));
  const cinemaRows = parseCsv(fs.readFileSync(cinemaPath, "utf8"));
  const pxRaw = fs.readFileSync(pxPath, "latin1");
  const pxParsed = parsePxFile(pxRaw);

  const vod = processVod(vodRows);
  const vodStats = processVodStats(vodRows);
  const cinema = processCinema(cinemaRows);
  const cinemaStats = processCinemaStats(cinemaRows);
  const pxStats = processPxStats(pxParsed);

  const summary = {
    generated_at: new Date().toISOString(),
    vod_latest_year: vod.latest_year,
    vod_latest_total_views: vod.latest_total_views,
    cinema_latest_year: cinema.latest_year,
    cinema_latest_admissions: cinema.latest_admissions,
    cinema_yoy_change: cinema.yoy_change,
  };

  writeJson("vod.json", vod);
  writeJson("vod_stats.json", vodStats);
  writeJson("cinema.json", cinema);
  writeJson("cinema_stats.json", cinemaStats);
  writeJson("px_stats.json", pxStats);
  writeJson("summary.json", summary);
  writeJson("labels.json", {
    origins: ORIGIN_LABELS,
    cinema_origins: CINEMA_ORIGIN_LABELS,
    cinema_units: CINEMA_UNIT_LABELS,
    vod_types: VOD_TYPE_LABELS,
    genres: GENRE_LABELS,
  });
}

main();
