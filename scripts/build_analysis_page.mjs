#!/usr/bin/env node
/**
 * Legacy: optionale SVG-Teaser aus unified.json (ohne PyMC).
 *
 * Schreibt NICHT:
 *   - content/analysis.md / content/article.md (Fliesstext manuell)
 *   - data/analysis_report.json (nur pixi run analyze)
 *   - analysis.html (lädt Markdown + JSON zur Laufzeit)
 *
 * Volle Analysen: pixi run analyze
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const unified = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "unified.json"), "utf8"));
const figDir = path.join(ROOT, "assets", "analysis", "figures");
fs.mkdirSync(figDir, { recursive: true });

const yearly = unified.primary.px.yearly.map((y) => {
  const ch = y.origins.find((o) => o.id === "ch");
  return {
    year: y.year,
    market_adm: y.market.demand,
    market_films: y.market.supply,
    ch_share_adm: ch.share_demand,
    ch_share_films: ch.share_supply,
    ch_int: ch.intensity,
    mkt_int: y.market.intensity,
  };
});

function pct(x) {
  return `${(x * 100).toFixed(1).replace(".", ",")} %`;
}
function intDe(x) {
  return Math.round(x).toLocaleString("de-CH");
}
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function svgLine(title, labels, series, h = 400) {
  const w = 900;
  const pad = { l: 56, r: 24, t: 48, b: 52 };
  const pw = w - pad.l - pad.r;
  const ph = h - pad.t - pad.b;
  const all = series.flatMap((s) => s.values);
  const yMin = Math.min(...all);
  const yMax = Math.max(...all);
  const xpx = (i) => pad.l + (i / Math.max(labels.length - 1, 1)) * pw;
  const ypx = (v) => pad.t + ph - ((v - yMin) / (yMax - yMin || 1)) * ph;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fff"/>`;
  svg += `<text x="${w / 2}" y="28" text-anchor="middle" font-weight="bold" font-size="15">${esc(title)}</text>`;
  for (const s of series) {
    const pts = s.values.map((v, i) => `${xpx(i)},${ypx(v)}`).join(" ");
    svg += `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" points="${pts}"/>`;
    s.values.forEach((v, i) => {
      svg += `<circle cx="${xpx(i)}" cy="${ypx(v)}" r="4" fill="${s.color}"/>`;
    });
  }
  labels.forEach((lab, i) => {
    if (i % 2 === 0 || i === labels.length - 1)
      svg += `<text x="${xpx(i)}" y="${h - 16}" text-anchor="middle" font-size="11" fill="#55606a">${lab}</text>`;
  });
  return svg + "</svg>";
}

function writeFig(name, svg) {
  fs.writeFileSync(path.join(figDir, name), svg, "utf8");
  return `./assets/analysis/figures/${name}`;
}

const years = yearly.map((r) => String(r.year));
writeFig(
  "01_markt_ueberblick.svg",
  svgLine("Kinomarkt: Besuche und Filme", years, [
    { color: "#0b0d10", values: yearly.map((r) => r.market_adm / 1e5) },
    { color: "#b5542a", values: yearly.map((r) => r.market_films / 10) },
  ])
);
writeFig(
  "02_ch_angebot_nachfrage.svg",
  svgLine("CH: Angebot vs. Nachfrage (%)", years, [
    { color: "#b5542a", values: yearly.map((r) => r.ch_share_films * 100) },
    { color: "#0b0d10", values: yearly.map((r) => r.ch_share_adm * 100) },
  ])
);
writeFig(
  "03_ch_erfolg_bayes.svg",
  svgLine("CH-Besuchsanteil (%)", years, [{ color: "#0b0d10", values: yearly.map((r) => r.ch_share_adm * 100) }])
);
writeFig(
  "04_ch_intensitaet.svg",
  svgLine("Besuche pro Film", years, [
    { color: "#0b0d10", values: yearly.map((r) => r.mkt_int) },
    { color: "#b5542a", values: yearly.map((r) => r.ch_int) },
  ])
);
const prof = unified.supplementary.cinema_p4.season.profile;
const chp = unified.supplementary.cinema_p4.season.ch_profile;
writeFig(
  "05_kinosaison_p4.svg",
  svgLine("Kinosaison P4 (Ø Besuche / 1000)", prof.map((p) => String(p.week)), [
    { color: "#0b0d10", values: prof.map((p) => p.mean_admissions / 1e3) },
    { color: "#b5542a", values: chp.map((p) => p.mean_admissions / 1e3) },
  ]),
  440
);

const last = yearly[yearly.length - 1];
console.log(
  "wrote assets/analysis/figures/*.svg (Legacy-Teaser)\n" +
    `  2025: ${intDe(last.market_adm)} Besuche, CH-Anteil ${pct(last.ch_share_adm)}\n` +
    "  Kein Text/JSON/HTML geschrieben — Fliesstext: content/analysis.md · Zahlen: pixi run analyze"
);
