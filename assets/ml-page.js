/**
 * Shared chart/legend helpers for unified.html.
 * Copy and panel labels come from data.page in the JSON export.
 */

export function pct(n) {
  return new Intl.NumberFormat("de-CH", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(n);
}

export function dec(n, d = 2) {
  return new Intl.NumberFormat("de-CH", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
}

export function fmt(n) {
  return new Intl.NumberFormat("de-CH").format(n);
}

export function chartLayout({
  W = 900,
  H = 280,
  padL = 56,
  padR = 20,
  padT = 28,
  padB = 48,
} = {}) {
  return { W, H, padL, padR, padT, padB, innerW: W - padL - padR, innerH: H - padT - padB };
}

/**
 * Draw Cartesian axes, grid, and tick labels. Returns scale functions { x, y }.
 */
export function renderSvgAxes(parts, { layout, yMin, yMax, yFormat, yTicks = 4, xLabels, xLabel, yLabel }) {
  const { W, H, padL, padT, innerW, innerH } = layout;
  const span = Math.max(yMax - yMin, 1e-9);
  const y = (v) => padT + innerH - ((v - yMin) / span) * innerH;
  const n = Math.max(xLabels.length, 1);
  const x = (i) => padL + (i / Math.max(n - 1, 1)) * innerW;

  parts.push(
    `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + innerH}" stroke="#8a949c" stroke-width="1"/>`,
    `<line x1="${padL}" y1="${padT + innerH}" x2="${padL + innerW}" y2="${padT + innerH}" stroke="#8a949c" stroke-width="1"/>`
  );

  for (let t = 0; t <= yTicks; t++) {
    const v = yMin + (span * t) / yTicks;
    const yy = y(v);
    parts.push(
      `<line x1="${padL}" y1="${yy}" x2="${padL + innerW}" y2="${yy}" stroke="#d6d6d6" stroke-dasharray="3 3"/>`,
      `<text x="${padL - 8}" y="${yy + 4}" text-anchor="end" font-size="10" fill="#55606a">${yFormat(v)}</text>`
    );
  }

  xLabels.forEach((lbl, i) => {
    parts.push(
      `<text x="${x(i)}" y="${H - 14}" text-anchor="middle" font-size="10" fill="#55606a">${lbl}</text>`
    );
  });

  if (yLabel) {
    parts.push(
      `<text x="16" y="${padT + innerH / 2}" text-anchor="middle" font-size="11" fill="#55606a" transform="rotate(-90 16 ${padT + innerH / 2})">${yLabel}</text>`
    );
  }
  if (xLabel) {
    parts.push(
      `<text x="${padL + innerW / 2}" y="${H - 2}" text-anchor="middle" font-size="11" fill="#55606a">${xLabel}</text>`
    );
  }

  return { x, y };
}

export function emptyChart(svg, message = "Keine Daten") {
  const W = 900;
  const H = 280;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = `<rect width="${W}" height="${H}" fill="#f4f4f4"/><text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="14" fill="#55606a">${message}</text>`;
}

/** Apply page metadata from JSON to static HTML shells. */
export function applyPageMeta(data) {
  const page = data.page;
  if (!page) return;

  document.title = `Swiss Film — ${page.title}`;
  const h1 = document.querySelector(".page-head h1");
  if (h1) h1.textContent = page.title;
  const lead = document.getElementById("pageLead");
  if (lead) lead.textContent = page.lead;

  document.querySelectorAll("[data-panel]").forEach((el) => {
    const key = el.getAttribute("data-panel");
    const panel = page.panels?.[key];
    if (!panel) return;
    const label = el.querySelector(".panel-label");
    if (label) label.textContent = panel.label;
    const intro = el.querySelector(".panel-intro[data-dynamic]");
    if (intro && panel.intro) intro.textContent = panel.intro;
    const method = el.querySelector("#bayesMethodNote");
    if (method && panel.method_note) method.textContent = panel.method_note;
  });
}

/**
 * HTML legend for chart series or categories.
 * @param {HTMLElement|null} container
 * @param {Array<{ color?: string, label: string, reference?: boolean, dash?: boolean }>} items
 */
export function renderLegend(container, items, { className = "legend legend-genre" } = {}) {
  if (!container) return;
  container.className = className;
  if (!items?.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = items
    .map((item) => {
      const label = item.label ?? String(item);
      const suffix = item.reference ? " (Ref.)" : "";
      const color = item.color ?? "#888";
      const swatch = item.dash
        ? `border:2px dashed ${color};background:transparent`
        : `background:${color}`;
      return `<span class="lg-item"><span class="lg-swatch" style="${swatch}"></span>${label}${suffix}</span>`;
    })
    .join("");
}

/** Create and append a legend element; returns the new node. */
export function appendLegend(parent, items, className = "legend legend-genre") {
  const el = document.createElement("d" + "iv");
  renderLegend(el, items, { className });
  parent.appendChild(el);
  return el;
}

/** Legend for sequential heatmaps (low → high). */
export function renderHeatmapScaleLegend(
  container,
  { lowLabel = "weniger", highLabel = "mehr", lowColor = "#f4f4f4", highColor = "#b5542a" } = {}
) {
  if (!container) return;
  container.className = "legend legend-scale";
  container.innerHTML = `
    <span class="lg-item"><span class="lg-swatch" style="background:${lowColor}"></span>${lowLabel}</span>
    <span class="lg-scale-bar" style="background:linear-gradient(90deg, ${lowColor}, ${highColor})"></span>
    <span class="lg-item"><span class="lg-swatch" style="background:${highColor}"></span>${highLabel}</span>`;
}

/** Resolve hex/CSS color from entity (supports `fill` → theme palette). */
export function resolveEntityColor(entity, palette = {}) {
  if (entity?.color) return entity.color;
  if (entity?.fill && palette[entity.fill]) return palette[entity.fill];
  return palette.accent ?? "#b5542a";
}

/** Ensure every origin/genre has a `color` for SVG fills. */
export function withResolvedColors(entities, palette) {
  return (entities ?? []).map((e) => ({
    ...e,
    color: resolveEntityColor(e, palette),
  }));
}

export function legendFromGenres(genres, palette) {
  return genres.map((g) => ({
    color: resolveEntityColor(g, palette),
    label: g.label,
    reference: !!g.reference,
  }));
}

export function renderInsightsList(ul, items, max = 8) {
  if (!ul || !items?.length) return;
  ul.innerHTML = items
    .slice(0, max)
    .map((s) => `<li>${String(s).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</li>`)
    .join("");
}

/** BFS Appendix: active filters and code definitions (from ``bfs`` block in ML JSON). */
export function renderBfsMetadata(container, bfs) {
  if (!container || !bfs?.active) return;
  const details = document.createElement("details");
  details.className = "bfs-metadata";
  const summary = document.createElement("summary");
  summary.textContent = "BFS-Metadaten (Appendix)";
  const wrap = document.createElement("d" + "iv");
  wrap.className = "bfs-metadata-body";

  if (bfs.sources?.appendix) {
    const src = document.createElement("p");
    src.className = "meta-note";
    src.textContent = `Code-Listen: ${bfs.sources.appendix}${bfs.sources.title_de ? ` — ${bfs.sources.title_de}` : ""}`;
    wrap.appendChild(src);
  }

  const active = bfs.active;
  const list = document.createElement("dl");
  list.className = "bfs-active-filters";
  for (const [key, val] of Object.entries(active)) {
    if (Array.isArray(val)) {
      const dt = document.createElement("dt");
      dt.textContent = key;
      list.appendChild(dt);
      const dd = document.createElement("dd");
      dd.textContent = val.map((x) => `${x.code}: ${x.label_de}`).join(" · ");
      list.appendChild(dd);
    } else if (val?.code) {
      const dt = document.createElement("dt");
      dt.textContent = key;
      list.appendChild(dt);
      const dd = document.createElement("dd");
      dd.textContent = `${val.code} — ${val.label_de}`;
      list.appendChild(dd);
    }
  }
  wrap.appendChild(list);
  details.append(summary, wrap);
  container.replaceChildren(details);
}

export function renderMethodology(container, methodology) {
  if (!container || !methodology?.sections?.length) return;
  const details = document.createElement("details");
  details.className = "bayes-methodology";
  details.open = true;
  const summary = document.createElement("summary");
  summary.textContent = methodology.title ?? "Methodik";
  const wrap = document.createElement("d" + "iv");
  wrap.className = "bayes-methodology-body";
  methodology.sections.forEach((s) => {
    const article = document.createElement("article");
    const h4 = document.createElement("h4");
    h4.textContent = s.heading;
    const p = document.createElement("p");
    p.textContent = s.body;
    article.append(h4, p);
    wrap.appendChild(article);
  });
  details.append(summary, wrap);
  container.replaceChildren(details);
}

export function trendPd(t) {
  if (t.pd != null) return t.pd;
  const pos = t.pd_positive ?? t.p_increase;
  const neg = t.pd_negative ?? t.p_decrease;
  if (pos != null && neg != null) return Math.max(pos, neg);
  return pos ?? neg ?? null;
}

const DIRECTION_LABEL = { positive: "↑", negative: "↓", unclear: "—" };

export function formatDirection(t) {
  return DIRECTION_LABEL[t.direction] ?? (t.direction ?? "—");
}

export function applyTableHeaders(table, columnKeys) {
  if (!table || !columnKeys?.length) return;
  const thead = table.querySelector("thead tr");
  if (!thead) return;
  thead.innerHTML = columnKeys.map((h) => `<th scope="col">${h}</th>`).join("");
}

export function renderBayesTrendTable(tbody, trends, columns) {
  if (!tbody) return;
  tbody.innerHTML = "";
  trends.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = columns.map((col) => `<td>${col.format(t)}</td>`).join("");
    tbody.appendChild(tr);
  });
}

/** Seasonal band chart (mean + optional CI) with axes. */
export function drawSeasonBandChart(
  svg,
  profile,
  { stroke = "#b5542a", fill = "#b5542a", yFormat = fmt, yLabel = "Besuche", xLabel = "Kalenderwoche" } = {}
) {
  if (!profile?.length) {
    emptyChart(svg);
    return;
  }

  const layout = chartLayout();
  const { W, H, padL, padT, innerH } = layout;
  const maxV = Math.max(...profile.map((p) => p.hi ?? p.max ?? p.mean ?? 0), 1);
  const parts = [`<rect width="${W}" height="${H}" fill="#f4f4f4"/>`];
  const xLabels = profile.map((p) => (p.week % 4 === 1 ? String(p.week) : ""));
  const { x, y } = renderSvgAxes(parts, {
    layout,
    yMin: 0,
    yMax: maxV,
    yFormat,
    xLabels,
    xLabel,
    yLabel,
  });

  let area = "";
  profile.forEach((p, i) => {
    const hi = p.hi ?? p.max ?? p.mean;
    area += `${i === 0 ? "M" : "L"}${x(i)},${y(hi)} `;
  });
  for (let i = profile.length - 1; i >= 0; i--) {
    const lo = profile[i].lo ?? profile[i].min ?? profile[i].mean;
    area += `L${x(i)},${y(lo)} `;
  }
  area += "Z";

  let meanLine = profile.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.mean)}`).join(" ");
  parts.push(
    `<path d="${area}" fill="${fill}" opacity="0.15"/>`,
    `<path d="${meanLine}" fill="none" stroke="${stroke}" stroke-width="2.5"/>`
  );

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = parts.join("");
}

/** Multi-series line chart (shares or counts) with axes. */
export function drawMultiLineChart(
  svg,
  { series, xLabels, yFormat = pct, yLabel = "Anteil", xLabel = "Jahr", yMax } = {}
) {
  if (!series?.length || !series.some((s) => s.points?.length)) {
    emptyChart(svg);
    return;
  }

  const layout = chartLayout();
  const { W, H } = layout;
  const maxY =
    yMax ??
    Math.max(0.05, ...series.flatMap((s) => s.points.map((p) => p.value ?? 0)));
  const parts = [`<rect width="${W}" height="${H}" fill="#f4f4f4"/>`];
  const { x, y } = renderSvgAxes(parts, {
    layout,
    yMin: 0,
    yMax: maxY,
    yFormat,
    xLabels,
    xLabel,
    yLabel,
  });

  series.forEach((s) => {
    const pts = s.points
      .map((p, i) => (p.value != null ? `${x(i)},${y(p.value)}` : null))
      .filter(Boolean)
      .join(" ");
    if (pts) {
      const dash = s.dash ? ' stroke-dasharray="6 4"' : "";
      parts.push(
        `<polyline fill="none" stroke="${s.color}" stroke-width="${s.width ?? 2}" opacity="${s.opacity ?? 1}"${dash} points="${pts}"><title>${s.label ?? ""}</title></polyline>`
      );
    }
  });

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = parts.join("");
}

/** Build line-series for posterior shares (all genres, including reference). */
export function buildPosteriorShareSeries(genres, rows, { originId = null, key = "origin" } = {}) {
  const filtered = originId != null ? rows.filter((r) => r[key] === originId) : rows;
  return genres.map((g) => ({
    color: g.color,
    label: g.label,
    strokeWidth: g.reference ? 2.5 : 2,
    opacity: g.reference ? 1 : 0.9,
    points: [...filtered]
      .sort((a, b) => a.year - b.year)
      .map((r) => ({
        year: r.year,
        value: r[g.id] ?? r.share,
        lo: r[`${g.id}_lo`] ?? r.share_lo,
        hi: r[`${g.id}_hi`] ?? r.share_hi,
      })),
  }));
}

/** Cinema genre_px.shares rows: one row per (year, genre). */
export function buildPosteriorGenreSeries(genres, shareRows) {
  return genres.map((g) => ({
    color: g.color,
    label: g.label,
    strokeWidth: g.reference ? 2.5 : 2,
    points: shareRows
      .filter((r) => r.genre === g.id)
      .sort((a, b) => a.year - b.year)
      .map((r) => ({ year: r.year, value: r.share, lo: r.share_lo, hi: r.share_hi })),
  }));
}

/** Stacked 100 % bars from posterior mean shares per year. */
export function drawPosteriorStacked(
  svg,
  { years, genres, rows, title, bg = "#f4f4f4" }
) {
  if (!years?.length || !rows?.length) {
    emptyChart(svg);
    return;
  }

  const W = Math.max(320, years.length * 48);
  const H = 220;
  const layout = chartLayout({ W, H, padL: 44, padR: 12, padT: 32, padB: 40 });
  const { innerH, padL, padT } = layout;
  const barW = layout.innerW / Math.max(years.length, 1) - 6;

  const parts = [
    `<rect width="${W}" height="${H}" fill="${bg}"/>`,
    `<text x="${padL}" y="18" font-size="11" font-weight="600">${title}</text>`,
  ];
  renderSvgAxes(parts, {
    layout,
    yMin: 0,
    yMax: 1,
    yFormat: pct,
    yTicks: 4,
    xLabels: years.map(String),
    xLabel: "Jahr",
    yLabel: "Posterior-Anteil",
  });

  years.forEach((yr, i) => {
    const row = rows.find((r) => r.year === yr);
    if (!row) return;
    let y0 = padT + innerH;
    const x = padL + i * (barW + 6);
    genres.forEach((g) => {
      const share = row[g.id] ?? 0;
      const h = share * innerH;
      y0 -= h;
      parts.push(
        `<rect x="${x}" y="${y0}" width="${barW}" height="${h}" fill="${g.color}"><title>${yr} ${g.label}: ${pct(share)}</title></rect>`
      );
    });
  });

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = parts.join("");
}

/** SVG line chart with vertical CI segments (posterior shares). */
export function drawPosteriorLine(svg, series, { yFormat = pct, height = 280, yLabel = "Anteil", xLabel = "Jahr" } = {}) {
  if (!series?.length || !series.some((s) => s.points?.length)) {
    emptyChart(svg, "Keine Posterior-Daten");
    return;
  }

  const allYears = [...new Set(series.flatMap((s) => s.points.map((p) => p.year)))].sort((a, b) => a - b);
  const xLabels = allYears.map(String);
  const maxY = Math.max(0.01, ...series.flatMap((s) => s.points.map((p) => p.hi ?? p.value ?? 0)));

  const layout = chartLayout({ H: height });
  const { W, H } = layout;
  const parts = [`<rect width="${W}" height="${H}" fill="#f4f4f4"/>`];
  const yearIndex = new Map(allYears.map((yr, i) => [yr, i]));
  const { x, y } = renderSvgAxes(parts, {
    layout,
    yMin: 0,
    yMax: maxY,
    yFormat,
    xLabels,
    xLabel,
    yLabel,
  });

  series.forEach((s) => {
    s.points.forEach((p) => {
      const i = yearIndex.get(p.year);
      if (i == null) return;
      const cx = x(i);
      const lo = p.lo ?? p.value;
      const hi = p.hi ?? p.value;
      parts.push(
        `<line x1="${cx}" y1="${y(lo)}" x2="${cx}" y2="${y(hi)}" stroke="${s.color}" stroke-width="3" opacity="0.35"/>`
      );
    });
    const pts = s.points
      .map((p) => {
        const i = yearIndex.get(p.year);
        return i != null ? `${x(i)},${y(p.value)}` : null;
      })
      .filter(Boolean)
      .join(" ");
    if (pts) {
      parts.push(`<polyline fill="none" stroke="${s.color}" stroke-width="2" points="${pts}"/>`);
    }
  });

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = parts.join("");
}
