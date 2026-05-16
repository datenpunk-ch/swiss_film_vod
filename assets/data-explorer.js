import {
  createFormatters,
  chartColors,
  fillTable,
  renderKpiCards,
  renderDescList,
  renderDatasetInfo,
} from "./stats-common.js";

const DATASETS = {
  vod: {
    label: "Video on Demand (StatVoD)",
    file: "ts-x-16.02.01.10.csv",
    json: "./data/vod_stats.json",
    intro:
      "Jährliche BFS-Statistik zu VoD: Filme und Views nach Modell, Herkunft und Genre.",
  },
  cinema: {
    label: "Kinostatistik (wöchentlich)",
    file: "ts-x-16.02.01-P4.csv",
    json: "./data/cinema_stats.json",
    intro: "Wöchentliche Kinostatistik nach Beobachtungseinheit, Herkunft und Neuaufführungen.",
  },
  px: {
    label: "Filmangebot & Nachfrage (PX)",
    file: "px-x-1602010000_200.px",
    json: "./data/px_stats.json",
    intro: "BFS-Tabelle (PC-Axis/STAT-TAB), Jahresreihen aus der PX-Matrix extrahiert.",
  },
};

const VOD_LABELS = { EST: "Kauf (EST)", TVOD: "Leihe (TVoD)", SVOD: "Abo (SVoD)" };
const UNIT_LABELS = { view: "Views", film: "Filme" };
const GENRE_COLS = [
  { id: "fic", label: "Fiktion" },
  { id: "doc", label: "Dokumentar" },
  { id: "ani", label: "Animation" },
];
const VOD_ORIGIN_ORDER = ["och", "oep", "oot"];
const CINEMA_ORIGIN_ORDER = ["och", "oeu", "oot", "ous"];
const PX_METRIC_LABELS = {
  admissions: "Kinoeintritte",
  films: "Filme",
  screenings: "Vorführungen",
};

function panel(label, id, inner) {
  return `<section class="panel" aria-labelledby="${id}-heading">
    <div class="panel-label" id="${id}-heading">${label}</div>
    ${inner}
  </section>`;
}

function vodKey(ctx) {
  return `${ctx.vodType}|${ctx.unit}|${ctx.typeFilm}`;
}

function cinemaKey(ctx) {
  return `${ctx.unit}|${ctx.recent}`;
}

function seriesStats(yearly, getTotal) {
  const series = yearly.map(getTotal);
  const first = series[0];
  const last = series[series.length - 1];
  const sorted = [...series].sort((a, b) => a - b);
  const med = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  return {
    mean: Math.round(series.reduce((a, b) => a + b, 0) / (series.length || 1)),
    median: Math.round(med),
    min: series.length ? Math.min(...series) : 0,
    max: series.length ? Math.max(...series) : 0,
    min_year: yearly.find((y) => getTotal(y) === Math.min(...series))?.year,
    max_year: yearly.find((y) => getTotal(y) === Math.max(...series))?.year,
    std_dev: Math.round(
      Math.sqrt(
        series.reduce((s, x, _, arr) => {
          const m = arr.reduce((a, b) => a + b, 0) / arr.length;
          return s + (x - m) ** 2;
        }, 0) / Math.max(1, series.length - 1)
      )
    ),
    sum: series.reduce((a, b) => a + b, 0),
    cagr: first > 0 && series.length > 1 ? (last / first) ** (1 / (series.length - 1)) - 1 : null,
    yoy: yearly.map((y, i) => {
      if (i === 0) return { year: y.year, change: null };
      const prev = getTotal(yearly[i - 1]);
      const cur = getTotal(y);
      return { year: y.year, change: prev > 0 ? (cur - prev) / prev : null };
    }),
  };
}

function drawBarChart(container, items, valueKey, idKey) {
  const { fmt } = createFormatters();
  const CHART = chartColors();
  const W = 480;
  const H = 200;
  const pad = 24;
  const maxV = Math.max(1, ...items.map((o) => o[valueKey]));
  const barW = (W - pad * 2) / items.length - 12;
  let bars = "";
  items.forEach((o, i) => {
    const v = o[valueKey];
    const h = (v / maxV) * (H - pad * 2);
    const x = pad + i * (barW + 12);
    const y = H - pad - h;
    const fill =
      o[idKey] === "och" ? CHART.accent : o[idKey] === "oep" || o[idKey] === "oeu" ? CHART.eu : CHART.ww;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${fill}"><title>${o.label}: ${fmt.format(v)}</title></rect>`;
  });
  container.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="${W}" height="${H}" fill="${CHART.bgSoft}"/>` + bars + `</svg>`;
}

function renderVodPanels(root, data, year, ctx, { fmt, pctFmt, decFmt }) {
  const key = vodKey(ctx);
  const r = data.yearly.find((y) => y.year === year);
  const slice = r?.slices?.[key];
  const unitLabel = UNIT_LABELS[ctx.unit] || ctx.unit;
  const vodLabel = VOD_LABELS[ctx.vodType] || ctx.vodType;

  root.innerHTML =
    panel("Überblick", "kpi", '<div class="stat-grid" id="kpiCards"></div>') +
    panel(
      "Deskriptive Maße",
      "desc",
      `<p class="panel-intro" id="descIntro"></p><dl class="desc-list" id="descList"></dl>`
    ) +
    `<div class="two-col">
      ${panel(
        "Veränderung zum Vorjahr",
        "yoy",
        `<div class="data-table-wrap"><table class="data-table" id="yoyTable"><thead><tr><th scope="col">Jahr</th><th scope="col">Δ</th></tr></thead><tbody></tbody></table></div>`
      )}
      ${panel(
        "Genre",
        "genre",
        `<div class="data-table-wrap"><table class="data-table" id="genreTable"><thead><tr><th scope="col">Genre</th><th scope="col">${unitLabel}</th></tr></thead><tbody></tbody></table></div>`
      )}
    </div>` +
    panel(
      "Alle Jahre",
      "yearly",
      `<div class="data-table-wrap"><table class="data-table" id="yearlyTable"><thead><tr><th scope="col">Jahr</th><th scope="col">EST</th><th scope="col">TVoD</th><th scope="col">SVoD</th><th scope="col">CH-Anteil</th></tr></thead><tbody></tbody></table></div>`
    ) +
    panel(
      "Herkunft",
      "origin",
      `<svg class="chart" id="originChart" role="img" aria-label="Nach Herkunft"></svg>
       <div class="data-table-wrap"><table class="data-table" id="originTable"><thead><tr><th scope="col">Herkunft</th><th scope="col">${unitLabel}</th><th scope="col">Anteil</th></tr></thead><tbody></tbody></table></div>`
    ) +
    panel(
      "Herkunft × Genre",
      "matrix",
      `<div class="data-table-wrap"><table class="data-table" id="matrixTable"><thead><tr><th scope="col">Herkunft</th><th scope="col">Fiktion</th><th scope="col">Dokumentar</th><th scope="col">Animation</th></tr></thead><tbody></tbody></table></div>
       <p class="chart-caption" id="metaCaption"></p>`
    );

  if (!slice) return;

  const allGenre = slice.by_genre.find((g) => g.id === "all");
  document.getElementById("descIntro").textContent =
    `${vodLabel} · ${unitLabel} · Filmebene ${ctx.typeFilm === "cin" ? "Kino" : "alle"}.`;

  const stats = seriesStats(data.yearly, (y) => y.slices?.[key]?.total ?? 0);
  renderDescList(document.getElementById("descList"), [
    ["Mittelwert", fmt.format(stats.mean)],
    ["Median", fmt.format(stats.median)],
    ["Minimum", fmt.format(stats.min) + (stats.min_year ? " (" + stats.min_year + ")" : "")],
    ["Maximum", fmt.format(stats.max) + (stats.max_year ? " (" + stats.max_year + ")" : "")],
    ["Std.-Abw.", fmt.format(stats.std_dev)],
    ["CAGR", stats.cagr == null ? "—" : pctFmt.format(stats.cagr)],
    ["Summe", fmt.format(stats.sum)],
  ]);

  renderKpiCards(document.getElementById("kpiCards"), [
    { v: fmt.format(slice.total), k: `${unitLabel}\n${year}` },
    { v: fmt.format(allGenre?.value || 0), k: "Total Genre\n(alle)" },
    { v: pctFmt.format(slice.share_ch), k: "CH-Anteil\n(nach Region)" },
    {
      v:
        ctx.unit === "view" && allGenre?.value > 0
          ? decFmt.format(slice.total / allGenre.value)
          : "—",
      k: ctx.unit === "view" ? "Views/Film\n(alle)" : "—",
    },
  ]);

  fillTable(
    document.querySelector("#yoyTable tbody"),
    stats.yoy.map((y) => ({
      year: y.year,
      cols: [String(y.year), y.change == null ? "—" : pctFmt.format(y.change)],
    }))
  );

  fillTable(
    document.querySelector("#genreTable tbody"),
    slice.by_genre.map((g) => ({ cols: [g.label, fmt.format(g.value)] }))
  );

  fillTable(
    document.querySelector("#yearlyTable tbody"),
    data.yearly.map((y) => {
      const s = y.slices?.[key];
      return {
        year: y.year,
        cols: [
          String(y.year),
          fmt.format(y.by_vod_type.EST?.[ctx.unit === "view" ? "views" : "films"] || 0),
          fmt.format(y.by_vod_type.TVOD?.[ctx.unit === "view" ? "views" : "films"] || 0),
          fmt.format(y.by_vod_type.SVOD?.[ctx.unit === "view" ? "views" : "films"] || 0),
          pctFmt.format(s?.share_ch ?? 0),
        ],
      };
    }),
    year
  );

  const sum = slice.by_origin.reduce((s, o) => s + o.value, 0);
  fillTable(
    document.querySelector("#originTable tbody"),
    slice.by_origin.map((o) => ({
      cols: [o.label, fmt.format(o.value), sum > 0 ? pctFmt.format(o.value / sum) : "—"],
    }))
  );
  drawBarChart(
    document.getElementById("originChart"),
    slice.by_origin.map((o) => ({ ...o, views: o.value, id: o.id })),
    "views",
    "id"
  );

  const tbody = document.querySelector("#matrixTable tbody");
  tbody.innerHTML = "";
  VOD_ORIGIN_ORDER.forEach((oid) => {
    const tr = document.createElement("tr");
    const label = slice.by_origin.find((o) => o.id === oid)?.label || oid;
    const td0 = document.createElement("td");
    td0.textContent = label;
    tr.appendChild(td0);
    GENRE_COLS.forEach((g) => {
      const cell = slice.matrix_origin_genre.find((m) => m.origin === oid && m.genre === g.id);
      const td = document.createElement("td");
      td.className = "num";
      td.textContent = fmt.format(cell?.value || 0);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  document.getElementById("metaCaption").textContent =
    data.source_file + " · " + data.overview.year_span + " · " + vodLabel + " / " + unitLabel;
}

function renderCinemaPanels(root, data, year, ctx, { fmt, pctFmt }) {
  const key = cinemaKey(ctx);
  const r = data.yearly.find((y) => y.year === year);
  const slice = r?.slices?.[key];
  root.innerHTML =
    panel("Überblick", "kpi", '<div class="stat-grid" id="kpiCards"></div>') +
    panel(
      "Deskriptive Maße",
      "desc",
      `<p class="panel-intro" id="descIntro"></p><dl class="desc-list" id="descList"></dl>`
    ) +
    `<div class="two-col">
      ${panel(
        "Veränderung zum Vorjahr",
        "yoy",
        `<div class="data-table-wrap"><table class="data-table" id="yoyTable"><thead><tr><th scope="col">Jahr</th><th scope="col">Wert</th><th scope="col">Δ</th></tr></thead><tbody></tbody></table></div>`
      )}
      ${panel(
        "Alle Kombinationen (Jahr)",
        "combo",
        `<div class="data-table-wrap"><table class="data-table" id="comboTable"><thead><tr><th scope="col">Einheit</th><th scope="col">Wert</th></tr></thead><tbody></tbody></table></div>`
      )}
    </div>` +
    panel(
      "Herkunft",
      "origin",
      `<svg class="chart" id="originChart" role="img" aria-label="Nach Herkunft"></svg>
       <div class="data-table-wrap"><table class="data-table" id="originTable"><thead><tr><th scope="col">Herkunft</th><th scope="col">Wert</th><th scope="col">Anteil</th></tr></thead><tbody></tbody></table></div>`
    ) +
    panel(
      "Alle Jahre",
      "yearly",
      `<div class="data-table-wrap"><table class="data-table" id="yearlyTable"><thead><tr><th scope="col">Jahr</th><th scope="col">Wert</th><th scope="col">Wochen</th></tr></thead><tbody></tbody></table></div>
       <p class="chart-caption" id="metaCaption"></p>`
    );

  if (!slice) return;

  const unitOpt = data.stat_options.find((o) => o.id === "unit");
  const recentOpt = data.stat_options.find((o) => o.id === "recent");
  const unitName = unitOpt?.options.find((o) => o.id === ctx.unit)?.label || ctx.unit;
  const recentName = recentOpt?.options.find((o) => o.id === ctx.recent)?.label || ctx.recent;

  document.getElementById("descIntro").textContent = `${unitName} · ${recentName}.`;

  const stats = seriesStats(data.yearly, (y) => y.slices?.[key]?.total ?? 0);
  const weekly = data.weekly_by_key?.[key] || [];
  const wMean = weekly.length
    ? Math.round(weekly.reduce((s, w) => s + w.value, 0) / weekly.length)
    : 0;
  const wSorted = [...weekly.map((w) => w.value)].sort((a, b) => a - b);
  const wMed = wSorted.length ? wSorted[Math.floor(wSorted.length / 2)] : 0;

  renderDescList(document.getElementById("descList"), [
    ["Mittelwert (Jahr)", fmt.format(stats.mean)],
    ["Median (Jahr)", fmt.format(stats.median)],
    ["Minimum", fmt.format(stats.min) + (stats.min_year ? " (" + stats.min_year + ")" : "")],
    ["Maximum", fmt.format(stats.max) + (stats.max_year ? " (" + stats.max_year + ")" : "")],
    ["Std.-Abw.", fmt.format(stats.std_dev)],
    [
      `Ø Woche ${data.weekly_focus_year}`,
      weekly.length ? fmt.format(wMean) + " (Median " + fmt.format(wMed) + ")" : "—",
    ],
  ]);

  renderKpiCards(document.getElementById("kpiCards"), [
    { v: fmt.format(slice.total), k: `${unitName}\n${year}` },
    { v: String(r.weeks_recorded), k: "Erfasste\nWochen" },
    { v: weekly.length ? fmt.format(wMean) : "—", k: "Ø pro\nWoche" },
    { v: stats.yoy.find((y) => y.year === year)?.change == null ? "—" : pctFmt.format(stats.yoy.find((y) => y.year === year).change), k: "Δ zum\nVorjahr" },
  ]);

  fillTable(
    document.querySelector("#yoyTable tbody"),
    stats.yoy.map((y) => ({
      year: y.year,
      cols: [
        String(y.year),
        fmt.format(data.yearly.find((yr) => yr.year === y.year)?.slices?.[key]?.total ?? 0),
        y.change == null ? "—" : pctFmt.format(y.change),
      ],
    })),
    year
  );

  const combos = [];
  for (const u of unitOpt?.options || []) {
    combos.push({
      cols: [u.label, fmt.format(r.slices?.[`${u.id}|${ctx.recent}`]?.total ?? 0)],
    });
  }
  fillTable(document.querySelector("#comboTable tbody"), combos);

  const sum = slice.by_origin.reduce((s, o) => s + o.value, 0);
  const sorted = CINEMA_ORIGIN_ORDER.map((id) => slice.by_origin.find((o) => o.id === id)).filter(Boolean);
  fillTable(
    document.querySelector("#originTable tbody"),
    sorted.map((o) => ({
      cols: [o.label, fmt.format(o.value), sum > 0 ? pctFmt.format(o.value / sum) : "—"],
    }))
  );
  drawBarChart(
    document.getElementById("originChart"),
    sorted.map((o) => ({ ...o, views: o.value, id: o.id })),
    "views",
    "id"
  );

  fillTable(
    document.querySelector("#yearlyTable tbody"),
    data.yearly.map((yr) => ({
      year: yr.year,
      cols: [String(yr.year), fmt.format(yr.slices?.[key]?.total ?? 0), String(yr.weeks_recorded)],
    })),
    year
  );

  document.getElementById("metaCaption").textContent =
    data.source_file + " · " + data.overview.year_span + " · " + unitName;
}

function renderPxPanels(root, data, ctx, { fmt, pctFmt }) {
  const rows = ctx.slice === "ch" ? data.yearly_ch : data.yearly_total;
  const metric = ctx.metric || "admissions";
  const metricLabel = PX_METRIC_LABELS[metric] || metric;
  const sliceLabel =
    ctx.slice === "ch" ? "Schweizer Filme (Herkunftsland)" : "Alle Herkünfte, Sprachgebiet Schweiz";
  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const yoy =
    prev && prev[metric] > 0 ? (latest[metric] - prev[metric]) / prev[metric] : null;
  const series = rows.map((y) => y[metric]);
  const stats = seriesStats(rows, (y) => y[metric]);

  root.innerHTML =
    panel("Überblick", "kpi", '<div class="stat-grid" id="kpiCards"></div>') +
    panel(
      "Deskriptive Maße",
      "desc",
      `<p class="panel-intro" id="descIntro">Schnitt: ${sliceLabel}.</p><dl class="desc-list" id="descList"></dl>`
    ) +
    panel(
      "Jahresreihe",
      "yearly",
      `<div class="data-table-wrap"><table class="data-table" id="yearlyTable"><thead><tr><th scope="col">Jahr</th><th scope="col">${metricLabel}</th><th scope="col">Filme</th><th scope="col">Vorführungen</th></tr></thead><tbody></tbody></table></div>
       <p class="chart-caption" id="metaCaption"></p>`
    );

  renderKpiCards(document.getElementById("kpiCards"), [
    { v: fmt.format(latest[metric]), k: `${metricLabel}\n${latest.year}` },
    { v: fmt.format(latest.films), k: "Filme\n" + latest.year },
    { v: fmt.format(latest.screenings), k: "Vorführungen\n" + latest.year },
    { v: yoy == null ? "—" : pctFmt.format(yoy), k: "Δ zum\nVorjahr" },
  ]);

  renderDescList(document.getElementById("descList"), [
    ["Mittelwert", fmt.format(stats.mean)],
    ["Median", fmt.format(stats.median)],
    ["Minimum", fmt.format(stats.min)],
    ["Maximum", fmt.format(stats.max)],
    ["Std.-Abw.", fmt.format(stats.std_dev)],
  ]);

  fillTable(
    document.querySelector("#yearlyTable tbody"),
    rows.map((y) => ({
      year: y.year,
      cols: [String(y.year), fmt.format(y[metric]), fmt.format(y.films), fmt.format(y.screenings)],
    })),
    latest.year
  );

  document.getElementById("metaCaption").textContent =
    data.source_file + " · " + data.overview.year_span + " · " + metricLabel;
}

function buildStatControls(container, data, params, onChange) {
  container.replaceChildren();
  if (!data?.stat_options?.length) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  for (const opt of data.stat_options) {
    const wrap = document.createElement("div");
    wrap.className = "control-group";
    const label = document.createElement("label");
    label.htmlFor = `opt_${opt.id}`;
    label.textContent = opt.label;
    const sel = document.createElement("select");
    sel.id = `opt_${opt.id}`;
    sel.setAttribute("aria-label", opt.label);
    for (const o of opt.options) {
      const option = document.createElement("option");
      option.value = o.id;
      option.textContent = o.label;
      sel.appendChild(option);
    }
    const def = data.defaults?.[opt.id] ?? opt.options[0]?.id;
    sel.value = params.get(opt.id) || def;
    sel.addEventListener("change", onChange);
    wrap.append(label, sel);
    container.appendChild(wrap);
  }
}

function readStatContext(data) {
  const ctx = {};
  for (const opt of data?.stat_options || []) {
    const sel = document.getElementById(`opt_${opt.id}`);
    if (sel) ctx[opt.id] = sel.value;
  }
  return ctx;
}

export async function initDataExplorer() {
  const formatters = createFormatters();
  const datasetSel = document.getElementById("datasetSelect");
  const viewControls = document.getElementById("viewControls");
  const yearWrap = document.getElementById("yearControl");
  const yearSel = document.getElementById("yearSelect");
  const statOptionsEl = document.getElementById("statOptions");
  const introEl = document.getElementById("pageIntro");
  const root = document.getElementById("explorerPanels");
  let params = new URLSearchParams(window.location.search);

  const cache = {};
  for (const [key, cfg] of Object.entries(DATASETS)) {
    const o = document.createElement("option");
    o.value = key;
    o.textContent = cfg.label;
    datasetSel.appendChild(o);
    try {
      cache[key] = await fetch(cfg.json, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      });
    } catch {
      cache[key] = null;
    }
  }

  datasetSel.value = params.get("dataset") in DATASETS ? params.get("dataset") : "vod";
  let controlsDatasetId = null;

  function populateYears(data, { reset = false } = {}) {
    const keep = !reset ? yearSel.value : null;
    yearSel.replaceChildren();
    (data.years || []).forEach((y) => {
      const o = document.createElement("option");
      o.value = String(y);
      o.textContent = String(y);
      yearSel.appendChild(o);
    });
    if (keep && data.years?.includes(Number(keep))) {
      yearSel.value = keep;
    } else {
      const want = params.get("year");
      yearSel.value =
        want && data.years?.includes(Number(want)) ? want : String(data.latest_year);
    }
  }

  function syncUrl() {
    const id = datasetSel.value;
    const data = cache[id];
    params = new URLSearchParams();
    params.set("dataset", id);
    if (data?.years?.length) params.set("year", yearSel.value);
    for (const opt of data?.stat_options || []) {
      const sel = document.getElementById(`opt_${opt.id}`);
      if (sel) params.set(opt.id, sel.value);
    }
    history.replaceState(null, "", "?" + params.toString());
  }

  function render({ resetControls = false, resetYear = false } = {}) {
    const id = datasetSel.value;
    const cfg = DATASETS[id];
    const data = cache[id];

    introEl.innerHTML = `Auswertung von <code>${cfg.file}</code>. ${cfg.intro}`;

    if (!data) {
      viewControls.hidden = true;
      statOptionsEl.replaceChildren();
      root.innerHTML =
        "<p class='panel-intro'>Daten konnten nicht geladen werden. Bitte <code>node scripts/export_site.mjs</code> ausführen.</p>";
      renderDatasetInfo({ dataset: { summary: "—", source_file: cfg.file } });
      return;
    }

    const hasStatOptions = (data.stat_options?.length ?? 0) > 0;
    const hasYear = (data.years?.length ?? 0) > 0;
    viewControls.hidden = !hasStatOptions && !hasYear;
    yearWrap.hidden = !hasYear;

    if (resetControls || controlsDatasetId !== id) {
      buildStatControls(statOptionsEl, data, params, () => render());
      controlsDatasetId = id;
    }

    renderDatasetInfo(data);

    const ctx = readStatContext(data);

    if (hasYear) {
      populateYears(data, { reset: resetYear });
      const year = Number(yearSel.value);
      if (id === "vod") renderVodPanels(root, data, year, ctx, formatters);
      else renderCinemaPanels(root, data, year, ctx, formatters);
    } else {
      renderPxPanels(root, data, ctx, formatters);
    }

    syncUrl();
  }

  datasetSel.addEventListener("change", () => {
    controlsDatasetId = null;
    render({ resetControls: true, resetYear: true });
  });
  yearSel.addEventListener("change", () => render());

  render({ resetControls: true, resetYear: true });
}
