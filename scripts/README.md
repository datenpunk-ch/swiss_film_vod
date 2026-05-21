# Scripts

## Datenpipeline (einziger Auswertungsweg)

```text
node scripts/export_site.mjs
```

Führt aus:

1. `build_bfs_metadata.mjs` — Appendix-ODS → `data/bfs_metadata.json`
2. Aufbereitung Artikel-KPIs → `data/summary.json`, `data/vod.json`, `data/cinema.json`
3. `build_unified.mjs` — VoD + P4 + PX → `data/unified.json`

## Einzeln

```text
node scripts/build_bfs_metadata.mjs
node scripts/build_unified.mjs
```

## Frontend

- **Artikel:** `index.html` (lädt KPI-JSON)
- **Auswertung:** `unified.html` (React/Recharts, lädt `data/unified.json`)

```text
node scripts/bundle_unified_ui.mjs

**Kino-Analysen (Pixi):** `pixi run analyze` → `data/analysis_report.json` + Grafiken (vorher ggf. `pixi run build-unified`). Fliesstext nur in `content/analysis.md` (manuell). Optional: `pixi run build-analysis-figures` für Legacy-SVG-Teaser ohne Text/JSON.
```

Baut nach `assets/unified/unified.js` (esbuild; optional `cd unified-app && npm run build`).
