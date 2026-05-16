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
  SVOD: "Abo (SVoD)",
};

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

function processVod(rows) {
  const years = [...new Set(rows.map((r) => r.PERIODE))].sort();
  const currentYear = String(new Date().getFullYear());
  const completeYears = years.filter((y) => y < currentYear);
  const latestYear = completeYears.length ? completeYears[completeYears.length - 1] : years[years.length - 1];

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

  const vod = processVod(parseCsv(fs.readFileSync(vodPath, "utf8")));
  const cinema = processCinema(parseCsv(fs.readFileSync(cinemaPath, "utf8")));

  const summary = {
    generated_at: new Date().toISOString(),
    vod_latest_year: vod.latest_year,
    vod_latest_total_views: vod.latest_total_views,
    cinema_latest_year: cinema.latest_year,
    cinema_latest_admissions: cinema.latest_admissions,
    cinema_yoy_change: cinema.yoy_change,
  };

  writeJson("vod.json", vod);
  writeJson("cinema.json", cinema);
  writeJson("summary.json", summary);
  writeJson("labels.json", { origins: ORIGIN_LABELS, vod_types: VOD_TYPE_LABELS });
}

main();
