/**
 * analysis.html: lädt content/analysis.md + data/analysis_report.json,
 * ersetzt <!--INJECT:id:typ--> durch MCMC-Ergebnisse aus Python.
 */
(function () {
  const MC = window.MarkdownContent;
  if (!MC) return;

  const INJECT_RE = /<!--INJECT:([a-z0-9_]+):([a-z]+)-->/gi;

  function byId(analyses, id) {
    return analyses.find((a) => a.id === id) || null;
  }

  function renderFigures(figures) {
    if (!figures?.length) return "";
    return figures
      .map(
        (f) =>
          `<figure class="analysis-figure">` +
          `<img src="${MC.escapeHtml(f.src)}" alt="${MC.escapeHtml(f.caption || "")}" loading="lazy" />` +
          `<figcaption>${MC.escapeHtml(f.caption || "")}</figcaption></figure>`
      )
      .join("\n");
  }

  function renderTable(t) {
    if (!t) return "";
    const head = (t.headers || []).map((h) => `<th>${MC.escapeHtml(h)}</th>`).join("");
    const rows = (t.rows || [])
      .map((row) => "<tr>" + row.map((c) => `<td>${MC.escapeHtml(c)}</td>`).join("") + "</tr>")
      .join("");
    const cap = t.caption ? `<caption>${MC.escapeHtml(t.caption)}</caption>` : "";
    return (
      `<div class="analysis-table-wrap"><table class="analysis-table">${cap}` +
      `<thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`
    );
  }

  function renderTables(tables) {
    if (!tables?.length) return "";
    return tables.map(renderTable).join("\n");
  }

  function renderDiagnostics(diagnostics) {
    if (!diagnostics?.length) return "";
    const items = diagnostics
      .map((m) => {
        const okCls = m.ok === true ? " is-ok" : m.ok === false ? " is-warn" : "";
        const note = m.note ? `<span class="note">${MC.escapeHtml(m.note)}</span>` : "";
        return (
          `<div class="analysis-metric${okCls}">` +
          `<span class="k">${MC.escapeHtml(m.label)}</span>` +
          `<span class="v">${MC.escapeHtml(m.value)}</span>${note}</div>`
        );
      })
      .join("");
    return `<div class="analysis-metrics">${items}</div>`;
  }

  function renderMcmc(mcmc) {
    if (!mcmc) return "";
    const items = [
      `MCMC: Markov Chain Monte Carlo (Sampler: ${mcmc.sampler || "—"})`,
      `Ketten: ${mcmc.chains ?? "—"}, Tune-in: ${mcmc.tune ?? "—"}, Draws: ${mcmc.draws ?? "—"}`,
      `target_accept: ${mcmc.target_accept ?? "—"}`,
    ];
    if (mcmc.fit_years?.length) {
      items.push(`Schätzjahre: ${mcmc.fit_years.join(", ")}`);
    }
    if (mcmc.year_center != null) {
      items.push(`Jahr̄ (Zentrum): ${Math.round(mcmc.year_center)}`);
    }
    return "<ul>" + items.map((i) => `<li>${MC.escapeHtml(i)}</li>`).join("") + "</ul>";
  }

  function injectBlock(analysis, type) {
    if (!analysis) {
      return `<p class="analysis-prose">Keine Daten — bitte <code>pixi run analyze</code> ausführen.</p>`;
    }
    switch (type) {
      case "figures":
        return renderFigures(analysis.figures);
      case "tables":
        return renderTables(analysis.tables);
      case "diagnostics":
        return renderDiagnostics(analysis.diagnostics);
      case "mcmc":
        return renderMcmc(analysis.mcmc);
      case "metrics":
        return renderDiagnostics(analysis.metrics);
      default:
        return "";
    }
  }

  function applyInjections(html, analyses) {
    return html.replace(INJECT_RE, (_full, id, type) => injectBlock(byId(analyses, id), type.toLowerCase()));
  }

  function buildNav(main) {
    const nav = document.getElementById("analysis-nav-list");
    if (!nav) return;
    const sections = main.querySelectorAll("section.analysis-block[id]");
    nav.innerHTML = Array.from(sections)
      .map((sec) => {
        const id = sec.id;
        const h2 = sec.querySelector("h2");
        const title = h2 ? h2.textContent.trim() : id;
        const label =
          id === "gesamtinterpretation" ? `<strong>${MC.escapeHtml(title)}</strong>` : MC.escapeHtml(title);
        return `<li><a href="#${MC.escapeHtml(id)}">${label}</a></li>`;
      })
      .join("");
  }

  window.__analysisReady = (async function () {
    const hero = document.querySelector("[data-analysis-part='hero']");
    const main = document.getElementById("analysis-content");
    if (!hero || !main) return;

    try {
      const cache = new Map();
      const [md, report] = await Promise.all([
        MC.fetchTextCached(cache, "./content/analysis.md"),
        fetch("./data/analysis_report.json", { cache: "no-cache" }).then((r) => {
          if (!r.ok) throw new Error("analysis_report.json");
          return r.json();
        }),
      ]);

      const parts = MC.splitParts(md);
      if (!parts?.body) throw new Error("analysis.md: PART:body fehlt");

      hero.innerHTML = MC.mdToHtml(parts.hero || "");
      main.innerHTML = applyInjections(MC.mdToHtml(parts.body), report.analyses || []);
      buildNav(main);

      const stand = document.getElementById("analysis-stand");
      if (stand && report.generated_at) {
        stand.textContent = report.generated_at.slice(0, 10);
      }
    } catch (e) {
      console.error(e);
      main.innerHTML =
        "<section><div class='container'><div class='note-box'>" +
        "<div class='note-box-label'>Hinweis</div>" +
        "<p>Inhalt oder Analyse-Daten fehlen. Text: <a href='./content/analysis.md'>analysis.md</a>. " +
        "Zahlen: <code>pixi run analyze</code>.</p></div></div></section>";
    }
  })();
})();
