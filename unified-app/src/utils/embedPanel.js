const PANELS = new Set([
  "supply",
  "demand",
  "season",
  "genre",
  "countries",
  "forecast",
  "chgenre",
  "gap",
  "year",
]);

/** Einzelgrafik für Artikel-Embed (?embed=1&panel=…). */
export function getEmbedPanel() {
  try {
    const raw = new URLSearchParams(window.location.search).get("panel");
    const panel = raw?.trim().toLowerCase();
    if (!panel || panel === "full") return null;
    return PANELS.has(panel) ? panel : null;
  } catch {
    return null;
  }
}
