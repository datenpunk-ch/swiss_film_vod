import { chartLayout, pct, renderLegend, renderSvgAxes } from "./ml-page.js";

const ORIGIN_COLORS = { ch: "#b5542a", eu: "#c4896e", ww: "#e5d4c8" };
const GENRE_COLORS = { fic: "#0b0d10", doc: "#b5542a", ani: "#c4896e" };

const intFmt = new Intl.NumberFormat("de-CH");
const pctFmt = new Intl.NumberFormat("de-CH", { style: "percent", maximumFractionDigits: 1 });

let activeMetric = "demand";

function shareForMetric(row, metric) {
  if (metric === "supply") return row.share_supply ?? 0;
  if (metric === "intensity") return row.intensity ?? 0;
  return row.share_demand ?? row.share ?? 0;
}

function segmentsFromMetricRows(rows, { metric, labelKey = "label", idKey = "id", colors = {} }) {
  const intensities = metric === "intensity" ? rows.map((r) => r.intensity ?? 0) : null;
  const intSum = intensities ? intensities.reduce((a, b) => a + b, 0) : 0;
  return rows.map((r) => {
    const id = r[idKey];
    let share = shareForMetric(r, metric);
    if (metric === "intensity" && intSum > 0) share = (r.intensity ?? 0) / intSum;
    const demand = r.demand ?? 0;
    const supply = r.supply ?? 0;
    const tip =
      metric === "intensity"
        ? `${r[labelKey] ?? id}: ${r.intensity != null ? intFmt.format(Math.round(r.intensity)) : "—"} Besucher/Film`
        : `${r[labelKey] ?? id}: ${pct(share)} · ${intFmt.format(metric === "supply" ? supply : demand)}`;
    return {
      label: r[labelKey] ?? id,
      share,
      color: colors[id] ?? "#ccc",
      tip,
    };
  });
}

function mergePxOrigins(harmonized, rows) {
  return harmonized.origins.map((h) => {
    const row = rows?.find((o) => o.id === h.id);
    return {
      id: h.id,
      label: h.label,
      demand: row?.demand ?? 0,
      supply: row?.supply ?? 0,
      share_demand: row?.share_demand ?? 0,
      share_supply: row?.share_supply ?? 0,
      intensity: row?.intensity ?? null,
    };
  });
}

function mergePxGenres(harmonized, rows) {
  return harmonized.genres.map((g) => {
    const row = rows?.find((x) => x.id === g.id);
    return {
      id: g.id,
      label: g.label,
      demand: row?.demand ?? 0,
      supply: row?.supply ?? 0,
      share_demand: row?.share_demand ?? 0,
      share_supply: row?.share_supply ?? 0,
      intensity: row?.intensity ?? null,
    };
  });
}

function mergeChannelOrigins(harmonized, channelOrigins, channelKey) {
  return harmonized.origins.map((h) => {
    const code = h[channelKey];
    const row = channelOrigins?.find((o) => o.origin === code);
    return {
      id: h.id,
      label: h.label,
      origin: code,
      demand: row?.demand ?? 0,
      supply: row?.supply ?? 0,
      share_demand: row?.share_demand ?? 0,
      share_supply: row?.share_supply ?? 0,
      intensity: row?.intensity ?? null,
      genres: row?.genres,
    };
  });
}

function mergeGenreRows(harmonized, genreRows) {
  return harmonized.genres.map((g) => {
    const row = genreRows?.find((x) => x.id === g.id);
    return {
      id: g.id,
      label: g.label,
      demand: row?.demand ?? 0,
      supply: row?.supply ?? 0,
      share_demand: row?.share_demand ?? 0,
      share_supply: row?.share_supply ?? 0,
      intensity: row?.intensity ?? null,
    };
  });
}

function appendStackChart(parent, segments, title, { width = 240, height = 180 } = {}) {
  const card = document.createElement("div");
  card.className = "unified-card";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("chart");
  card.appendChild(svg);
  parent.appendChild(card);
  drawSingleStack(svg, segments, { title, width, height });
}

function drawSingleStack(svg, segments, { title, width = 260, height = 200 }) {
  const W = width;
  const H = height;
  const layout = chartLayout({ W, H, padL: 8, padR: 8, padT: 28, padB: 8 });
  const { innerW, innerH, padT } = layout;
  const total = segments.reduce((s, x) => s + x.share, 0) || 1;
  let y0 = padT + innerH;
  const parts = [
    `<rect width="${W}" height="${H}" fill="#f4f4f4"/>`,
    `<text x="${W / 2}" y="18" text-anchor="middle" font-size="11" font-weight="600" fill="#0b0d10">${title}</text>`,
  ];
  for (const seg of segments) {
    const h = (seg.share / total) * innerH;
    y0 -= h;
    const tip = seg.tip ?? `${seg.label}: ${pct(seg.share)}`;
    parts.push(
      `<rect x="8" y="${y0}" width="${innerW}" height="${h}" fill="${seg.color}"><title>${tip}</title></rect>`
    );
  }
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = parts.join("");
}

function drawHBarChart(svg, items, { title, width = 360, height = 280, valueKey = "value" }) {
  const W = width;
  const H = height;
  const padL = 120;
  const padR = 16;
  const padT = 28;
  const padB = 12;
  const barH = Math.max(14, (H - padT - padB) / Math.max(items.length, 1) - 4);
  const max = Math.max(...items.map((i) => i[valueKey]), 1);
  const innerW = W - padL - padR;
  const parts = [
    `<rect width="${W}" height="${H}" fill="#f4f4f4"/>`,
    `<text x="${padL}" y="16" font-size="11" font-weight="600" fill="#0b0d10">${title}</text>`,
  ];
  items.forEach((item, i) => {
    const y = padT + i * (barH + 4);
    const w = (item[valueKey] / max) * innerW;
    const tip =
      item.tip ??
      `${item.label}: ${intFmt.format(item[valueKey])}${item.share != null ? ` (${pctFmt.format(item.share)})` : ""}`;
    parts.push(
      `<text x="${padL - 6}" y="${y + barH / 2 + 4}" text-anchor="end" font-size="10" fill="#55606a">${item.label.slice(0, 22)}</text>`,
      `<rect x="${padL}" y="${y}" width="${w}" height="${barH}" fill="#b5542a"><title>${tip}</title></rect>`
    );
  });
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = parts.join("");
}

function drawMultiLine(svg, seriesList, { width = 360, height = 220, yLabel = "" }) {
  const W = width;
  const H = height;
  const layout = chartLayout({ W, H, padL: 48, padR: 12, padT: 16, padB: 36 });
  const { innerW, innerH, padL, padT } = layout;
  const allY = seriesList.flatMap((s) => s.points.map((p) => p.value));
  const yMax = Math.max(...allY, 1);
  const xLabels = seriesList[0]?.points.map((p) => String(p.year)) ?? [];
  const parts = [`<rect width="${W}" height="${H}" fill="#f4f4f4"/>`];
  for (const s of seriesList) {
    const pts = s.points
      .map((p, i) => {
        const x = padL + (i / Math.max(s.points.length - 1, 1)) * innerW;
        const y = padT + innerH - (p.value / yMax) * innerH;
        return `${x},${y}`;
      })
      .join(" ");
    parts.push(`<polyline fill="none" stroke="${s.color}" stroke-width="2" points="${pts}"/>`);
  }
  renderSvgAxes(parts, {
    layout,
    yMin: 0,
    yMax,
    yFormat: (v) => (yMax <= 1 ? pctFmt.format(v) : intFmt.format(v)),
    yTicks: 4,
    xLabels: xLabels.filter((_, i) => i % 2 === 0 || i === xLabels.length - 1),
    xLabel: "Jahr",
    yLabel,
  });
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = parts.join("");
}

function drawSeason(svg, profile) {
  drawMultiLine(
    svg,
    [{ color: "#b5542a", points: profile.map((p) => ({ year: p.week, value: p.share })) }],
    { width: 720, height: 220, yLabel: "Anteil (normiert)" }
  );
}

function metricLabel(metric) {
  if (metric === "supply") return "Angebot (Filme)";
  if (metric === "intensity") return "Intensität (Besucher/Film)";
  return "Nachfrage (Besucher)";
}

function renderKpis(pxRow) {
  const root = document.getElementById("pxKpis");
  root.innerHTML = "";
  if (!pxRow) return;
  const cards = [
    { k: "Besucher (Markt)", v: intFmt.format(pxRow.market.demand) },
    { k: "Filme im Programm", v: intFmt.format(pxRow.market.supply) },
    { k: "CH-Anteil (Besucher)", v: pctFmt.format(pxRow.switzerland.share_demand) },
    { k: "CH-Anteil (Filme)", v: pctFmt.format(pxRow.switzerland.share_supply) },
    {
      k: "Besucher / CH-Film",
      v: pxRow.switzerland.intensity ? intFmt.format(Math.round(pxRow.switzerland.intensity)) : "—",
    },
  ];
  for (const c of cards) {
    const el = document.createElement("div");
    el.className = "peak-low-card";
    el.innerHTML = `<div class="k">${c.k}</div><div class="v">${c.v}</div>`;
    root.appendChild(el);
  }
}

function renderYear(data, year, vodOriginId, metric) {
  const snap = data.by_year.find((y) => y.year === year);
  const px = snap?.px;
  if (!px) return;

  renderKpis(px);

  document.getElementById("pxOriginHeading").textContent = `Herkunft — ${metricLabel(metric)}`;
  document.getElementById("pxGenreHeading").textContent = `Genre — ${metricLabel(metric)}`;

  const pxStack = document.getElementById("pxOriginStack");
  pxStack.innerHTML = "";
  const card = document.createElement("div");
  card.className = "unified-card";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("chart");
  card.appendChild(svg);
  pxStack.appendChild(card);
  drawSingleStack(
    svg,
    segmentsFromMetricRows(px.origins, {
      metric,
      idKey: "id",
      labelKey: "label",
      colors: ORIGIN_COLORS,
    }),
    { title: String(year) }
  );

  const topValueKey = metric === "supply" ? "supply" : metric === "intensity" ? "intensity" : "demand";
  drawHBarChart(
    document.getElementById("topCountriesChart"),
    (px.top_countries ?? []).map((c) => ({
      label: c.label,
      value: c[topValueKey] ?? 0,
      share: shareForMetric(c, metric === "intensity" ? "demand" : metric),
      tip:
        metric === "intensity" && c.intensity
          ? `${c.label}: ${intFmt.format(Math.round(c.intensity))} Besucher/Film`
          : undefined,
    })),
    { title: `Top-Länder ${year} (${metricLabel(metric)})`, valueKey: "value" }
  );

  const genreStack = document.getElementById("pxGenreStack");
  genreStack.innerHTML = "";
  const gCard = document.createElement("div");
  gCard.className = "unified-card";
  const gSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  gSvg.classList.add("chart");
  gCard.appendChild(gSvg);
  genreStack.appendChild(gCard);
  drawSingleStack(
    gSvg,
    segmentsFromMetricRows(px.genres, {
      metric,
      idKey: "id",
      labelKey: "label",
      colors: GENRE_COLORS,
    }),
    { title: `Genre ${year}` }
  );

  const supp = snap;
  const suppRoot = document.getElementById("suppOriginCharts");
  suppRoot.innerHTML = "";
  const suppChannels = [];
  if (supp.vod) {
    suppChannels.push({
      title: "VoD (EST)",
      rows: (supp.vod.origins ?? []).map((o) => {
        const h = data.harmonized.origins.find((x) => x.vod === o.origin);
        return { ...o, id: h?.id ?? o.origin, label: h?.label ?? o.origin };
      }),
    });
  }
  if (supp.cinema_p4) {
    suppChannels.push({
      title: "Kino P4",
      rows: (supp.cinema_p4.origins ?? []).map((o) => {
        const h = data.harmonized.origins.find((x) => x.cinema === o.origin);
        return { ...o, id: h?.id ?? o.origin, label: h?.label ?? o.origin };
      }),
    });
  }
  for (const ch of suppChannels) {
    const c = document.createElement("div");
    c.className = "unified-card";
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.classList.add("chart");
    c.appendChild(s);
    suppRoot.appendChild(c);
    drawSingleStack(
      s,
      segmentsFromMetricRows(ch.rows, { metric, colors: ORIGIN_COLORS }),
      { title: `${ch.title} · ${metricLabel(metric)}`, width: 240, height: 180 }
    );
  }

  const vodOrigin = supp.vod?.origins?.find((o) => o.origin === vodOriginId);
  const vodGenreRoot = document.getElementById("suppGenreChart");
  vodGenreRoot.innerHTML = "";
  const vodGenreNote = document.getElementById("vodGenreNote");
  if (vodOrigin?.genres?.length) {
    vodGenreNote.hidden = false;
    const vc = document.createElement("div");
    vc.className = "unified-card";
    const vs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    vs.classList.add("chart");
    vc.appendChild(vs);
    vodGenreRoot.appendChild(vc);
    const label = data.harmonized.origins.find((h) => h.vod === vodOriginId)?.label ?? vodOriginId;
    drawSingleStack(
      vs,
      segmentsFromMetricRows(
        vodOrigin.genres.map((g) => ({
          ...g,
          label: data.harmonized.genres.find((x) => x.id === g.id)?.label ?? g.id,
        })),
        { metric, idKey: "id", labelKey: "label", colors: GENRE_COLORS }
      ),
      { title: `VoD · ${label}`, width: 240, height: 180 }
    );
  } else {
    vodGenreNote.hidden = true;
  }
}

function renderPxTrends(px, metric) {
  const s = px.series;
  drawMultiLine(
    document.getElementById("marketTrendChart"),
    [
      { color: "#0b0d10", label: "Besucher", points: s.market_demand ?? s.market_admissions ?? [] },
      { color: "#c4896e", label: "Filme", points: s.market_supply ?? s.market_films ?? [] },
    ],
    { width: 720, height: 240, yLabel: "Anzahl" }
  );
  renderLegend(document.getElementById("marketTrendLegend"), [
    { color: "#0b0d10", label: "Kinobesucher (Markt)" },
    { color: "#c4896e", label: "Filme im Programm" },
  ]);

  const genreSeries =
    metric === "supply"
      ? [
          { color: GENRE_COLORS.fic, label: "Fiktion", points: s.genre_fic_supply_share ?? [] },
          { color: GENRE_COLORS.doc, label: "Dokumentar", points: s.genre_doc_supply_share ?? [] },
          { color: GENRE_COLORS.ani, label: "Animation", points: s.genre_ani_supply_share ?? [] },
        ]
      : [
          { color: GENRE_COLORS.fic, label: "Fiktion", points: s.genre_fic_demand_share ?? s.genre_fic_share ?? [] },
          { color: GENRE_COLORS.doc, label: "Dokumentar", points: s.genre_doc_demand_share ?? s.genre_doc_share ?? [] },
          { color: GENRE_COLORS.ani, label: "Animation", points: s.genre_ani_demand_share ?? s.genre_ani_share ?? [] },
        ];

  drawMultiLine(document.getElementById("genreTrendChart"), genreSeries, {
    width: 360,
    height: 220,
    yLabel: "Anteil",
  });
}

export async function initUnifiedView() {
  const res = await fetch("./data/unified.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("unified.json");
  const data = await res.json();

  const px = data.primary?.px;
  document.getElementById("pageLead").textContent = data.lead;
  document.getElementById("pxSliceNote").textContent = px?.slice_label ?? "";

  const vod = data.supplementary?.vod;
  const p4 = data.supplementary?.cinema_p4;
  document.getElementById("suppIntro").textContent = [vod?.note, p4?.note].filter(Boolean).join(" ");
  document.getElementById("p4GenreNote").hidden = false;

  document.getElementById("limitations").innerHTML = (data.limitations ?? [])
    .map((t) => `<li>${t}</li>`)
    .join("");

  renderLegend(
    document.getElementById("pxOriginLegend"),
    data.harmonized.origins.map((o) => ({ color: ORIGIN_COLORS[o.id], label: o.label }))
  );
  renderLegend(
    document.getElementById("pxGenreLegend"),
    data.harmonized.genres.map((g) => ({ color: GENRE_COLORS[g.id], label: g.label }))
  );
  renderLegend(
    document.getElementById("suppOriginLegend"),
    data.harmonized.origins.map((o) => ({ color: ORIGIN_COLORS[o.id], label: o.label }))
  );

  const metricSelect = document.getElementById("metricSelect");
  function refreshTrends() {
    activeMetric = metricSelect.value;
    if (px?.series) renderPxTrends(px, activeMetric);
  }
  refreshTrends();
  metricSelect.addEventListener("change", () => {
    refreshTrends();
    update();
  });

  drawSeason(document.getElementById("seasonChart"), p4?.season?.profile ?? []);

  const years = px?.years ?? data.years ?? [];
  const yearSelect = document.getElementById("yearSelect");
  yearSelect.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join("");
  const defaultYear = years[years.length - 1];

  function update() {
    renderYear(data, Number(yearSelect.value) || defaultYear, metricSelect.value);
  }
  yearSelect.addEventListener("change", update);
  yearSelect.value = String(defaultYear);
  update();
}

initUnifiedView().catch((e) => {
  document.getElementById("pageLead").textContent = `Fehler: ${e.message}`;
});
