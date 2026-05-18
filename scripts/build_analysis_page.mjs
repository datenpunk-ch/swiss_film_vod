#!/usr/bin/env node
/**
 * Legacy-Fallback (SVG-Teaser). Hauptpipeline:
 *   pixi run analyze  → data/analysis_report.json + Grafiken
 *   content/analysis.md + analysis.html (Markdown + JSON)
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
const fig1 = writeFig(
  "01_markt_ueberblick.svg",
  svgLine("Kinomarkt: Besuche und Filme", years, [
    { color: "#0b0d10", values: yearly.map((r) => r.market_adm / 1e5) },
    { color: "#b5542a", values: yearly.map((r) => r.market_films / 10) },
  ])
);
const fig2 = writeFig(
  "02_ch_angebot_nachfrage.svg",
  svgLine("CH: Angebot vs. Nachfrage (%)", years, [
    { color: "#b5542a", values: yearly.map((r) => r.ch_share_films * 100) },
    { color: "#0b0d10", values: yearly.map((r) => r.ch_share_adm * 100) },
  ])
);
const fig3 = writeFig(
  "03_ch_erfolg_bayes.svg",
  svgLine("CH-Besuchsanteil (%)", years, [{ color: "#0b0d10", values: yearly.map((r) => r.ch_share_adm * 100) }])
);
const fig4 = writeFig(
  "04_ch_intensitaet.svg",
  svgLine("Besuche pro Film", years, [
    { color: "#0b0d10", values: yearly.map((r) => r.mkt_int) },
    { color: "#b5542a", values: yearly.map((r) => r.ch_int) },
  ])
);
const prof = unified.supplementary.cinema_p4.season.profile;
const chp = unified.supplementary.cinema_p4.season.ch_profile;
const fig5 = writeFig(
  "05_kinosaison_p4.svg",
  svgLine("Kinosaison P4 (Ø Besuche / 1000)", prof.map((p) => String(p.week)), [
    { color: "#0b0d10", values: prof.map((p) => p.mean_admissions / 1e3) },
    { color: "#b5542a", values: chp.map((p) => p.mean_admissions / 1e3) },
  ]),
  440
);

const last = yearly[yearly.length - 1];
const analyses = [
  {
    id: "market_overview",
    title: "Kinomarkt: Besuche und Programmumfang",
    question: "Wie entwickeln sich Kinobesuche und Filme im Programm?",
    data: "BFS «Filmangebot und Nachfrage» (PX), Sprachgebiet Schweiz, 2014–2025.",
    method: "Jährliche Aggregation; nur Kino.",
    findings: [
      `2025: ${intDe(last.market_adm)} Besuche, ${intDe(last.market_films)} Filme im Programm.`,
      "Nach 2020 Erholung, aber unter dem Niveau von 2015.",
    ],
    figures: [{ src: fig1, caption: "Schwarz: Besuche (÷100 000); Rostrot: Filme (÷10)." }],
    tables: [],
    limits: ["Kein VoD."],
  },
  {
    id: "ch_supply_demand",
    title: "Schweizer Filme: Angebot vs. Nachfrage",
    question: "Kommen Schweizer Filme beim Publikum an?",
    data: "BFS PX, Herkunft Schweiz.",
    method: "Jährliche Marktanteile Angebot (Filme) und Nachfrage (Besuche).",
    findings: [
      `2025: ${pct(last.ch_share_films)} der Filme, ${pct(last.ch_share_adm)} der Besuche.`,
      `Lücke: ${((last.ch_share_films - last.ch_share_adm) * 100).toFixed(1).replace(".", ",")} Prozentpunkte.`,
    ],
    figures: [{ src: fig2, caption: "Rostrot = Angebot, Schwarz = Nachfrage." }],
    tables: [],
    limits: ["Herkunft nach BFS-Regeln."],
  },
  {
    id: "ch_success_bayes",
    title: "Erfolg Schweizer Filme über Zeit",
    question: "Steigt der Besuchsanteil CH am Kinomarkt?",
    data: "BFS PX.",
    method:
      "Grafik: beobachteter Anteil. Volles Bayes-Modell (PyMC): python python/run_analyses.py nach pip install -r python/requirements.txt.",
    findings: [
      "2024–2025: höchster CH-Besuchsanteil seit der Vorkrise.",
      "Bayes-Trend-Schätzung mit PyMC liefert Posterior und Unsicherheitsband.",
    ],
    figures: [{ src: fig3, caption: "Besuchsanteil CH je Jahr (%)." }],
    tables: [],
    limits: ["MCMC-Block erfordert Python + pymc."],
  },
  {
    id: "ch_intensity",
    title: "Besuche pro Film (Intensität)",
    question: "Erzielen CH-Filme pro Titel mehr Besuche?",
    data: "BFS PX.",
    method: "Kinobesuche ÷ Filme im Programm.",
    findings: [
      `2025: CH Ø ${Math.round(last.ch_int).toLocaleString("de-CH")} vs. Markt Ø ${Math.round(last.mkt_int).toLocaleString("de-CH")} Besuche/Film.`,
    ],
    figures: [{ src: fig4, caption: "Intensität Markt und CH." }],
    tables: [],
    limits: [],
  },
  {
    id: "cinema_season",
    title: "Kinosaison nach Wochen",
    question: "Wann ist das Kino am vollsten?",
    data: `BFS P4; Basisjahre ${unified.supplementary.cinema_p4.season.years.join(", ")} (2020–2021 ausgeschlossen).`,
    method: "Ø Besuche pro Kinowoche; CH separat. Ohne Pandemiejahre — typisches Saisonprofil.",
    findings: ["Hochphase Dezember/Jahreswechsel; Frühling (z. B. KW 17) zweiter Schwerpunkt."],
    figures: [{ src: fig5, caption: "Schwarz = alle Herkünfte, Rostrot = CH (Ø/1000)." }],
    tables: [],
    limits: ["Kein Genre in P4.", "2020–2021 bewusst ausgeschlossen."],
  },
];

const generated_at = new Date().toISOString();
fs.writeFileSync(
  path.join(ROOT, "data", "analysis_report.json"),
  JSON.stringify({ generated_at, locale: "de-CH", scope: "Kino (BFS PX + P4)", analyses }, null, 2),
  "utf8"
);

function renderAnalysis(a, i) {
  const n = String(i + 1).padStart(2, "0");
  const figs = a.figures
    .map(
      (f) =>
        `<figure class="analysis-figure"><img src="${f.src}" alt="${esc(f.caption)}" loading="lazy"/><figcaption>${esc(f.caption)}</figcaption></figure>`
    )
    .join("\n");
  const findings = a.findings.map((x) => `<li>${esc(x)}</li>`).join("");
  const limits = a.limits.map((x) => `<li>${esc(x)}</li>`).join("");
  return `<section class="analysis-block" id="${a.id}"><div class="container">
<div class="section-label">Analyse ${n}</div><div class="sec-head"><div class="sec-num">${n}</div><h2>${esc(a.title)}</h2></div>
<div class="measure analysis-body">
<h3>Fragestellung</h3><p>${esc(a.question)}</p>
<h3>Daten</h3><p>${esc(a.data)}</p>
<h3>Methode</h3><p>${esc(a.method)}</p>
${figs}
<h3>Ergebnisse</h3><ul>${findings}</ul>
<h3>Grenzen</h3><ul>${limits}</ul>
</div></div></section>`;
}

const nav = analyses.map((a) => `<li><a href="#${a.id}">${esc(a.title)}</a></li>`).join("");
const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Swiss Film — Kino-Analysen</title>
<link rel="stylesheet" href="./assets/fonts.css"/>
<link rel="stylesheet" href="./style.css"/>
</head>
<body class="page-article page-analysis">
<header class="hero analysis-hero"><div class="container">
<div class="hero-tag">Kino · BFS · Python</div>
<h1>Kino-Analysen im Detail</h1>
<p class="hero-sub">Fünf Auswertungen zum Schweizer Kinomarkt (PX + P4). Texte und Grafiken aus <code>data/unified.json</code>. Stand: ${esc(generated_at.slice(0, 10))}.</p>
<p class="hero-byline"><a href="./index.html">← Artikel</a> · <a href="./unified.html">Übersicht</a></p>
<p class="hero-sub" style="font-size:0.9rem;margin-top:1rem">Volles Bayes-MCMC: <code>pip install -r python/requirements.txt</code> und <code>python python/run_analyses.py</code></p>
</div></header>
<div class="container analysis-nav-wrap"><nav class="analysis-nav" aria-label="Analysen"><ol>${nav}</ol></nav></div>
<main>${analyses.map(renderAnalysis).join("\n")}</main>
<footer class="site-footer site-footer-chrome">Swiss Film · <a href="./index.html">Artikel</a> · <a href="./unified.html">Übersicht</a></footer>
</body></html>`;

fs.writeFileSync(path.join(ROOT, "analysis.html"), html.replace(/motion\.div/g, "div"), "utf8");
console.log("wrote analysis.html, data/analysis_report.json, assets/analysis/figures/*.svg");
