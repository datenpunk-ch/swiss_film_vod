/**
 * index.html (Artikel): lädt data/analysis_report.json und ersetzt
 * <!--INJECT:id:typ--> / <!--ARTICLE:kpis--> im gerenderten HTML.
 */
(function () {
  const MC = window.MarkdownContent;
  if (!MC) return;

  const INJECT_RE = /<!--INJECT:([a-z0-9_]+):([a-z]+)(?::(\d+))?-->/gi;
  const ARTICLE_RE = /<!--ARTICLE:([a-z]+)-->/gi;
  const PP_SUFFIX = "Pp.";

  const intFmt = new Intl.NumberFormat("de-CH");
  const pctFmt = new Intl.NumberFormat("de-CH", {
    style: "percent",
    maximumFractionDigits: 1,
  });

  const pctAbsFmt = new Intl.NumberFormat("de-CH", {
    style: "percent",
    maximumFractionDigits: 1,
  });

  function formatDeltaArrow(cur, prev) {
    const c = Number(cur);
    const p = Number(prev);
    if (!Number.isFinite(c) || !Number.isFinite(p) || p === 0) return null;
    const change = c / p - 1;
    if (Math.abs(change) < 1e-12) return pctAbsFmt.format(0);
    const arrow = change > 0 ? "↑" : "↓";
    return `${arrow} ${pctAbsFmt.format(Math.abs(change))}`;
  }

  function formatPpNumber(value, digits = 1) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return Math.abs(n).toFixed(digits);
  }

  function formatYoYSharePp(cur, prev) {
    const c = Number(cur);
    const p = Number(prev);
    if (!Number.isFinite(c) || !Number.isFinite(p)) return null;
    const pp = (c - p) * 100;
    if (Math.abs(pp) < 1e-12) return `0 ${PP_SUFFIX}`;
    const arrow = pp > 0 ? "↑" : "↓";
    return `${arrow} ${formatPpNumber(pp)} ${PP_SUFFIX}`;
  }

  function formatPpValue(value, digits = 1) {
    const n = formatPpNumber(value, digits);
    if (n === "—") return n;
    return `${n} ${PP_SUFFIX}`;
  }

  const COUNTRY_ID_TO_ISO = {
    ch: "ch",
    us: "us",
    fr: "fr",
    de: "de",
    uk: "gb",
    it: "it",
  };

  function countryFlagImg(countryId, size = 16) {
    const iso = COUNTRY_ID_TO_ISO[String(countryId ?? "").toLowerCase()];
    if (!iso) return "";
    const h = Math.round(size * 0.72);
    return (
      `<img class="country-flag kpi-card-flag" src="https://flagcdn.com/w40/${iso}.png" ` +
      `width="${size}" height="${h}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
    );
  }

  function chFlagImg(size = 16) {
    return countryFlagImg("ch", size);
  }

  function pctDirection(pct) {
    if (!pct) return "";
    const t = String(pct).trim();
    if (t.startsWith("↑") || t.startsWith("+")) return " stat-pct--up";
    if (t.startsWith("↓") || t.startsWith("-")) return " stat-pct--down";
    return "";
  }

  const formatYoYCount = formatDeltaArrow;

  function byId(analyses, id) {
    return analyses.find((a) => a.id === id) || null;
  }

  function normalizePpText(text) {
    return String(text ?? "")
      .replace(/(\d[\d,]*)\s*Prozentpunkte/gi, "$1 Pp.")
      .replace(/\b(\d[\d,.]*)\s*pp\.?/gi, "$1 Pp.")
      .replace(/\bPP\b/g, "Pp.")
      .replace(/\bPp\.{2,}/gi, "Pp.");
  }

  function humanizeMetricText(text) {
    let t = normalizePpText(text);
    t = t.replace(/P\(Lücke\s*≤\s*0\)/gi, "Wahrscheinlichkeit: Lücke ausgeglichen");
    t = t.replace(/P\(T\*\s*≤\s*(\d+)\)/gi, "Chance, dass Kreuzung bis $1 eintritt");
    t = t.replace(/Median T\*\s*\(Kreuzung\)/gi, "Median Kreuzungsjahr (Lücke = 0)");
    t = t.replace(/P\(β\s*<\s*0\s*\|\s*Daten\)/gi, "Wahrscheinlichkeit");
    t = t.replace(/P\(Trend\s+steigt\)\s*=\s*/gi, "Wahrscheinlichkeit: ");
    t = t.replace(/P\(Trend\s+sinkt\)\s*=\s*/gi, "Wahrscheinlichkeit: ");
    t = t.replace(/\(logit\)/gi, "");
    t = t.replace(/logit-Skala/gi, "Anteils-Skala");
    t = t.replace(/P\(([^)]+)\)/g, "Wahrscheinlichkeit ($1)");
    return t;
  }

  function isYoYDelta(text) {
    return /^[↑↓+-]/.test(String(text ?? "").trim());
  }

  function formatKpiValueHtml(valueText, { isCountryTrend = false } = {}) {
    const text = String(valueText ?? "");
    if (isCountryTrend && /\/\s*Jahr/i.test(text)) {
      return MC.escapeHtml(text).replace(
        /(\s+Pp\.)\s*(\/\s*Jahr)/i,
        '$1<span class="kpi-trend-unit">$2</span>'
      );
    }
    return MC.escapeHtml(text);
  }

  function renderKpiCard(card, index) {
    const delay = (index ?? 0) * 60;
    const valueText = humanizeMetricText(card.value);
    const pctText = card.pct ? humanizeMetricText(card.pct) : null;
    const yoyCtx =
      pctText && (card.yoyContext || isYoYDelta(pctText))
        ? `<span class="stat-pct-context"> ggü. Vorjahr</span>`
        : "";
    const pct = pctText
      ? `<div class="stat-pct${pctDirection(pctText)}"><span class="stat-pct-delta">${MC.escapeHtml(
          pctText
        )}</span>${yoyCtx}</div>`
      : "";
    const mod = card.modifier ? ` ${card.modifier}` : "";
    const wideMod = card.wide || /Pp\.|Prozentpunkt/i.test(valueText) ? " stat-card--wide is-pp-metric" : "";
    const countryId = card.countryId || (card.showChFlag ? "ch" : null);
    const labelText = humanizeMetricText(card.label);
    const isCountryTrend = Boolean(countryId && /^Trend$/i.test(String(card.label ?? "").trim()));
    const flagInLabel = card.flagInLabel ?? (isCountryTrend || false);
    const flagInValue = Boolean(countryId && card.showChFlag && !flagInLabel);
    const chMod =
      (card.rowVariant === "ch" || card.showChFlag || (countryId === "ch" && !isCountryTrend)) &&
      !isCountryTrend
        ? " stat-card--ch"
        : "";
    const countryMod = isCountryTrend ? " stat-card--country" : "";
    const flagHtml = countryId ? countryFlagImg(countryId, 16) : "";
    const valueInner = formatKpiValueHtml(valueText, { isCountryTrend });
    const value =
      flagInValue && flagHtml
        ? `<span class="kpi-value-with-flag">${flagHtml}<span>${valueInner}</span></span>`
        : valueInner;
    const label =
      flagInLabel && flagHtml
        ? `<span class="k kpi-card-label kpi-card-label--with-flag">${flagHtml}<span>${MC.escapeHtml(labelText)}</span></span>`
        : `<span class="k kpi-card-label"><span>${MC.escapeHtml(labelText)}</span></span>`;
    return (
      `<div class="stat-card flip${mod}${chMod}${countryMod}${wideMod}" role="listitem" style="animation-delay:${delay}ms">` +
      `<div class="v">${value}</div>` +
      pct +
      label +
      `</div>`
    );
  }

  function kpiGroupCardCount(group) {
    const rows = group.rows ?? [{ cards: group.cards ?? [] }];
    return rows.reduce((n, row) => n + (row.cards?.length ?? 0), 0);
  }

  function renderKpiGroup(group, baseIndex) {
    let i = baseIndex;
    const label = group.label
      ? `<div class="article-kpi-group-label">${MC.escapeHtml(group.label)}</div>`
      : "";
    const rows = group.rows ?? [{ cards: group.cards ?? [] }];
    const colCount = Math.max(0, ...rows.map((r) => r.cards?.length ?? 0));
    const pairsHtml = Array.from({ length: colCount }, (_, col) => {
      const pairCards = rows
        .map((row) => {
          const card = row.cards?.[col];
          if (!card) return "";
          return renderKpiCard({ ...card, rowVariant: row.variant }, i++);
        })
        .filter(Boolean)
        .join("");
      return `<div class="article-kpi-pair" role="group">${pairCards}</div>`;
    }).join("");
    return `<div class="article-kpi-group">${label}<div class="article-kpi-grid" role="list">${pairsHtml}</div></div>`;
  }

  function renderKpiStrip(groups) {
    if (!groups?.length) return "";
    let idx = 0;
    const inner = groups
      .map((g) => {
        const block = renderKpiGroup(g, idx);
        idx += kpiGroupCardCount(g);
        return block;
      })
      .join("");
    return `<div class="article-kpi-strip reveal">${inner}</div>`;
  }

  function buildPxKpiGroups(unified) {
    const years = unified?.primary?.px?.years ?? unified?.years ?? [];
    if (!years.length || !unified?.by_year?.length) return [];

    const year = years[years.length - 1];
    const snap = unified.by_year.find((y) => y.year === year);
    const prev = unified.by_year.find((y) => y.year === year - 1);
    const px = snap?.px;
    const ppx = prev?.px;
    if (!px?.market) return [];

    const m = px.market;
    const ch = px.switzerland ?? {};
    const pm = ppx?.market;
    const pch = ppx?.switzerland ?? {};
    const marketIntensity = m.intensity ?? 0;
    const chIntensity = ch.intensity ?? 0;
    const chIntensityYoY = formatYoYCount(chIntensity, pch?.intensity);
    let chIntensityPct = chIntensityYoY;
    if (marketIntensity > 0 && chIntensity) {
      const ratio = chIntensity / marketIntensity;
      const vs =
        Math.abs(ratio - 1) < 1e-12
          ? pctAbsFmt.format(0)
          : `${ratio > 1 ? "↑" : "↓"} ${pctAbsFmt.format(Math.abs(ratio - 1))} ggü. Markt-Ø`;
      chIntensityPct = [chIntensityYoY, vs].filter(Boolean).join(" · ");
    }
    return [
      {
        label: `Kernzahlen · ${year} (PX)`,
        rows: [
          {
            variant: "market",
            cards: [
              {
                label: "Kinobesuche",
                value: intFmt.format(m.demand ?? 0),
                pct: formatYoYCount(m.demand, pm?.demand),
                yoyContext: true,
              },
              {
                label: "Filme im Programm",
                value: intFmt.format(m.supply ?? 0),
                pct: formatYoYCount(m.supply, pm?.supply),
                yoyContext: true,
              },
              {
                label: "Interesse (Ø Besuche/Film)",
                value: marketIntensity ? intFmt.format(Math.round(marketIntensity)) : "—",
                pct: formatYoYCount(marketIntensity, pm?.intensity),
                yoyContext: true,
              },
            ],
          },
          {
            variant: "ch",
            cards: [
              {
                label: "Anteil Besuche",
                showChFlag: true,
                value: pctFmt.format(ch.share_demand ?? 0),
                pct: formatYoYSharePp(ch.share_demand, pch?.share_demand),
                yoyContext: true,
              },
              {
                label: "Anteil Filme",
                showChFlag: true,
                value: pctFmt.format(ch.share_supply ?? 0),
                pct: formatYoYSharePp(ch.share_supply, pch?.share_supply),
                yoyContext: true,
              },
              {
                label: "Interesse (Ø Besuche/Film)",
                showChFlag: true,
                value: chIntensity ? intFmt.format(Math.round(chIntensity)) : "—",
                pct: chIntensityPct || null,
                yoyContext: Boolean(chIntensityYoY),
              },
            ],
          },
        ],
      },
    ];
  }

  function renderMetricCards(metrics) {
    if (!metrics?.length) return "";
    const items = metrics.filter(
      (m) =>
        m?.label &&
        m.label !== "Hinweis" &&
        m.ok !== false &&
        !/^(Lücke|Programm-Lücke)\s/i.test(String(m.label)) &&
        !/CH-Besuchsanteil.*letzte/i.test(String(m.label)) &&
        !/\(logit\)/i.test(String(m.value ?? ""))
    );
    if (!items.length) return "";

    const cards = items.map((m, i) => {
      const label = humanizeMetricText(m.label);
      const value = humanizeMetricText(m.value ?? "—");
      const note = m.note ? humanizeMetricText(m.note) : null;
      return renderKpiCard(
        {
          label,
          value,
          pct: note,
          countryId: m.country_id,
          modifier: m.ok === true && !m.country_id ? " is-ok" : "",
          wide:
            !m.country_id && /Lücke|Prozentpunkt|Pp\./i.test(`${label}${value}${note ?? ""}`),
        },
        i
      );
    });
    return `<div class="article-kpi-cards article-kpi-cards--countries reveal"><div class="stats-cards" role="list">${cards.join("")}</div></div>`;
  }

  function renderFigure(f) {
    if (!f) return "";
    return (
      `<figure class="analysis-figure reveal">` +
      `<img src="${MC.escapeHtml(f.src)}" alt="${MC.escapeHtml(f.caption || "")}" loading="lazy" />` +
      `<figcaption>${MC.renderInlineMarkdown(f.caption || "")}</figcaption></figure>`
    );
  }

  function renderFigures(figures) {
    if (!figures?.length) return "";
    return figures.map((f) => renderFigure(f)).join("\n");
  }

  function renderTable(t) {
    if (!t) return "";
    const head = (t.headers || []).map((h) => `<th>${MC.renderInlineMarkdown(h)}</th>`).join("");
    const rows = (t.rows || [])
      .map(
        (row) =>
          "<tr>" + row.map((c) => `<td>${MC.escapeHtml(humanizeMetricText(c))}</td>`).join("") + "</tr>"
      )
      .join("");
    const cap = t.caption ? `<caption>${MC.escapeHtml(t.caption)}</caption>` : "";
    return (
      `<div class="analysis-table-wrap reveal"><table class="analysis-table">${cap}` +
      `<thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`
    );
  }

  function injectBlock(analysis, type, indexStr) {
    if (!analysis) {
      return `<p class="reveal">Keine Daten — bitte <code>pixi run analyze</code> ausführen.</p>`;
    }
    const idx = indexStr != null && indexStr !== "" ? parseInt(indexStr, 10) : null;
    switch (type) {
      case "figure":
        return renderFigure(analysis.figures?.[Number.isFinite(idx) ? idx : 0]);
      case "figures":
        return renderFigures(analysis.figures);
      case "tables":
        return (analysis.tables || []).map(renderTable).join("\n");
      case "metrics":
        return renderMetricCards(analysis.metrics);
      default:
        return "";
    }
  }

  function replacePlaceholders(html, analyses, unified) {
    let out = html.replace(INJECT_RE, (_full, id, type, indexStr) =>
      injectBlock(byId(analyses, id), type.toLowerCase(), indexStr)
    );
    out = out.replace(ARTICLE_RE, (_full, key) => {
      if (key === "kpis") return renderKpiStrip(buildPxKpiGroups(unified));
      return "";
    });
    return out;
  }

  window.__articleInjectReady = (async function () {
    await (window.__contentReady || Promise.resolve());
    const main = document.getElementById("content");
    const hero = document.querySelector("header.hero[data-part='hero'], [data-part='hero']");
    if (!main) return;
    try {
      const [reportRes, unifiedRes] = await Promise.all([
        fetch("./data/analysis_report.json", { cache: "no-cache" }),
        fetch("./data/unified.json", { cache: "no-cache" }),
      ]);
      if (!reportRes.ok) return;

      const data = await reportRes.json();
      const unified = unifiedRes.ok ? await unifiedRes.json() : null;
      const analyses = data.analyses || [];

      main.innerHTML = replacePlaceholders(main.innerHTML, analyses, unified);
      if (hero) {
        hero.innerHTML = replacePlaceholders(hero.innerHTML, analyses, unified);
      }

      const stand = document.getElementById("article-stand");
      if (stand && data.generated_at) {
        const d = new Date(data.generated_at);
        stand.textContent = d.toLocaleDateString("de-CH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch (e) {
      console.warn("article inject:", e);
    }
  })();
})();
