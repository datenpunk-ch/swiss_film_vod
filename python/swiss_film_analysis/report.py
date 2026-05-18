from __future__ import annotations

import html
import json
from datetime import datetime, timezone
from pathlib import Path


def _esc(s: str) -> str:
    return html.escape(str(s), quote=True)


def _render_list(items: list[str]) -> str:
    if not items:
        return ""
    return "<ul>\n" + "".join(f"<li>{_esc(x)}</li>\n" for x in items) + "</ul>"


def _render_table(t: dict) -> str:
    head = "".join(f"<th>{_esc(h)}</th>" for h in t["headers"])
    rows = ""
    for row in t.get("rows", []):
        rows += "<tr>" + "".join(f"<td>{_esc(c)}</td>" for c in row) + "</tr>"
    cap = f"<caption>{_esc(t['caption'])}</caption>" if t.get("caption") else ""
    return (
        f'<div class="analysis-table-wrap"><table class="analysis-table">{cap}'
        f"<thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table></div>"
    )


def _render_figures(figures: list[dict]) -> str:
    out = []
    for f in figures:
        out.append(
            f'<figure class="analysis-figure">'
            f'<img src="{_esc(f["src"])}" alt="{_esc(f.get("caption", ""))}" loading="lazy" />'
            f'<figcaption>{_esc(f.get("caption", ""))}</figcaption>'
            f"</figure>"
        )
    return "\n".join(out)


def _render_metrics(metrics: list[dict]) -> str:
    if not metrics:
        return ""
    items = []
    for m in metrics:
        ok_cls = " is-ok" if m.get("ok") else " is-warn" if m.get("ok") is False else ""
        note = f'<span class="note">{_esc(m.get("note", ""))}</span>' if m.get("note") else ""
        items.append(
            f'<div class="analysis-metric{ok_cls}"><span class="k">{_esc(m["label"])}</span>'
            f'<span class="v">{_esc(m["value"])}</span>{note}</div>'
        )
    return f'<div class="analysis-metrics">{"".join(items)}</div>'


def _render_model(model: dict) -> str:
    if not model:
        return ""
    priors = "".join(f"<li><code>{_esc(p)}</code></li>" for p in model.get("priors", []))
    return f"""
<h3>Modelldefinition</h3>
<p><strong>{_esc(model.get("title", ""))}</strong></p>
<dl class="analysis-dl">
<dt>Likelihood</dt><dd><code>{_esc(model.get("likelihood", ""))}</code></dd>
<dt>Link</dt><dd><code>{_esc(model.get("link", ""))}</code></dd>
<dt>Priors</dt><dd><ul>{priors}</ul></dd>
</dl>
<p class="analysis-note">{_esc(model.get("notes", ""))}</p>
"""


def _render_variables(variables: list[dict]) -> str:
    if not variables:
        return ""
    rows = [
        [v.get("symbol", ""), v.get("name", ""), v.get("description", "")]
        for v in variables
    ]
    t = {
        "caption": "Variablen und Parameter",
        "headers": ["Symbol", "Name", "Bedeutung"],
        "rows": rows,
    }
    return "<h3>Variablen</h3>" + _render_table(t)


def _render_mcmc(mcmc: dict) -> str:
    if not mcmc:
        return ""
    items = [
        f"Sampler: {mcmc.get('sampler', '—')}",
        f"Ketten: {mcmc.get('chains', '—')}, Tune-in: {mcmc.get('tune', '—')}, Draws: {mcmc.get('draws', '—')}",
        f"target_accept: {mcmc.get('target_accept', '—')}",
    ]
    if mcmc.get("fit_years"):
        items.append(f"Schätzjahre: {', '.join(str(y) for y in mcmc['fit_years'])}")
    if mcmc.get("year_center") is not None:
        items.append(f"Jahr̄ (Zentrum): {mcmc['year_center']:.0f}")
    return "<h3>MCMC-Konfiguration</h3><ul>" + "".join(f"<li>{_esc(i)}</li>" for i in items) + "</ul>"


def _render_analysis(a: dict, index: int) -> str:
    aid = _esc(a["id"])
    n = index + 1
    model_block = _render_model(a.get("model"))
    vars_block = _render_variables(a.get("variables"))
    mcmc_block = _render_mcmc(a.get("mcmc"))
    diag = _render_metrics(a.get("diagnostics", []))
    metrics = _render_metrics(a.get("metrics", []))
    tables = "".join(_render_table(t) for t in a.get("tables", []))
    figures = _render_figures(a.get("figures", []))

    diag_section = ""
    if a.get("diagnostics"):
        diag_section = f"<h3>Modellgüte (MCMC-Diagnostik)</h3>{diag}"

    results_heading = (
        "Posterior &amp; Interpretation" if a.get("model") else "Ergebnisse &amp; Interpretation"
    )

    return f"""
<section class="analysis-block" id="{aid}">
  <div class="container">
    <div class="section-label">Analyse {n:02d}</div>
    <div class="sec-head">
      <div class="sec-num">{n:02d}</div>
      <h2>{_esc(a["title"])}</h2>
    </div>
    <div class="measure analysis-body">
      <h3>Fragestellung</h3>
      <p>{_esc(a["question"])}</p>
      <h3>Daten</h3>
      <p>{_esc(a["data"])}</p>
      {model_block}
      {vars_block}
      <h3>Methode</h3>
      <p>{_esc(a["method"])}</p>
      {mcmc_block}
      <h3>Ergebnisse (Grafiken)</h3>
      {figures}
      {diag_section}
      <h3>{results_heading}</h3>
      {tables}
      {_render_list(a.get("findings", []))}
      {metrics}
      <h3>Grenzen</h3>
      {_render_list(a.get("limits", []))}
    </div>
  </div>
</section>
"""


def build_nav(analyses: list[dict]) -> str:
    links = "".join(
        f'<li><a href="#{_esc(a["id"])}">{_esc(a["title"])}</a></li>' for a in analyses
    )
    return f'<nav class="analysis-nav" aria-label="Analysen"><ol>{links}</ol></nav>'


def write_report(root: Path, analyses: list[dict], generated_at: str | None = None) -> None:
    generated_at = generated_at or datetime.now(timezone.utc).isoformat()
    payload = {
        "generated_at": generated_at,
        "locale": "de-CH",
        "scope": "Kino (BFS PX + P4)",
        "analyses": analyses,
    }
    json_path = root / "data" / "analysis_report.json"
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    nav = build_nav(analyses)
    blocks = "".join(_render_analysis(a, i) for i, a in enumerate(analyses))
    html_doc = f"""<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Swiss Film — Kino-Analysen (Python)</title>
    <meta name="description" content="Kino-Analysen mit Bayes-Modell: Posterior, HDI, Pd (Probability of Direction), MCMC-Diagnostik." />
    <link rel="stylesheet" href="./assets/fonts.css" />
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body class="page-article page-analysis">
    <header class="hero analysis-hero">
      <div class="container">
        <div class="hero-tag">Python · Bayesian · BFS Kino</div>
        <h1>Kino-Analysen im Detail</h1>
        <p class="hero-sub">Auswertungen mit Modelldefinition, Posterior-Ausgabe, 95 %-credible intervals (HDI) und Probability of Direction (Pd). Aktualisieren: <code>pixi run analyze</code>. Stand: {_esc(generated_at[:10])}.</p>
        <p class="hero-byline"><a href="./index.html">← Artikel</a> · <a href="./unified.html">Übersicht</a></p>
      </div>
    </header>
    <div class="container analysis-nav-wrap">
      {nav}
    </div>
    <main>
      {blocks}
    </main>
    <footer class="site-footer site-footer-chrome">
      Swiss Film · <a href="./index.html">Artikel</a> · <a href="./unified.html">Übersicht</a>
    </footer>
  </body>
</html>
"""
    (root / "analysis.html").write_text(html_doc, encoding="utf-8")
