/**
 * Gemeinsamer Markdown/HTML-Loader (Artikel + Analysen).
 * window.MarkdownContent: { escapeHtml, renderInlineMarkdown, mdToHtml, splitParts, fetchTextCached }
 */
(function () {
  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderInlineMarkdown(s) {
    let out = escapeHtml(s);
    out = out.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_m, t, url) => `<a href="${escapeHtml(url)}">${escapeHtml(t)}</a>`
    );
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return out;
  }

  function mdToHtml(md) {
    const lines = String(md || "").replace(/\r\n?/g, "\n").split("\n");
    const out = [];
    let inUl = false;

    function closeUl() {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.trimEnd();
      const t = line.trim();

      if (!t) {
        closeUl();
        continue;
      }

      if (t.startsWith("<")) {
        closeUl();
        out.push(raw);
        continue;
      }

      const h3 = t.match(/^###\s+(.*)$/);
      if (h3) {
        closeUl();
        out.push(`<h3>${renderInlineMarkdown(h3[1])}</h3>`);
        continue;
      }
      const h2 = t.match(/^##\s+(.*)$/);
      if (h2) {
        closeUl();
        out.push(`<h2>${renderInlineMarkdown(h2[1])}</h2>`);
        continue;
      }

      const li = t.match(/^- (.*)$/);
      if (li) {
        if (!inUl) {
          out.push("<ul>");
          inUl = true;
        }
        out.push(`<li>${renderInlineMarkdown(li[1])}</li>`);
        continue;
      }

      closeUl();
      out.push(`<p class="analysis-prose">${renderInlineMarkdown(t)}</p>`);
    }
    closeUl();
    return out.join("\n");
  }

  function splitParts(md) {
    const text = String(md || "").replace(/\r\n?/g, "\n");
    const re = /^<!--PART:([a-zA-Z0-9_-]+)-->\s*$/gm;
    const matches = Array.from(text.matchAll(re));
    if (!matches.length) return null;
    const parts = {};
    for (let i = 0; i < matches.length; i++) {
      const key = matches[i][1];
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      parts[key] = text.slice(start, end).trim();
    }
    return parts;
  }

  async function fetchTextCached(cache, src) {
    if (cache.has(src)) return cache.get(src);
    const p = (async () => {
      const r = await fetch(src, { cache: "no-cache" });
      if (!r.ok) throw new Error("Failed to load: " + src);
      return await r.text();
    })();
    cache.set(src, p);
    return p;
  }

  window.MarkdownContent = {
    escapeHtml,
    renderInlineMarkdown,
    mdToHtml,
    splitParts,
    fetchTextCached,
  };
})();
