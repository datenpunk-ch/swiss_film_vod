#!/usr/bin/env node
/**
 * Build data/bfs_metadata.json from BFS *-APPENDIX.ods (paired with CSV data files).
 * Run before enrich_ml_json / export_site.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseVodAppendix, parseCinemaP4Appendix } from "./lib/parse_bfs_appendix.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "config", "analysis.json"), "utf8"));

function resolve(rel) {
  return path.join(ROOT, rel);
}

function codeLabel(dim, code) {
  return dim?.codes?.find((c) => c.code === code)?.label_de ?? code;
}

function build() {
  const vodOds = resolve(CFG.paths.vod_appendix);
  const p4Ods = resolve(CFG.paths.cinema_appendix);
  for (const p of [vodOds, p4Ods]) {
    if (!fs.existsSync(p)) throw new Error(`Appendix missing: ${p}`);
  }

  const vod = parseVodAppendix(vodOds);
  const cinema_p4 = parseCinemaP4Appendix(p4Ods);
  const sl = CFG.vod.slice;

  const out = {
    generated_at: new Date().toISOString(),
    sources: {
      vod: {
        data: CFG.paths.vod_csv,
        appendix: CFG.paths.vod_appendix,
        title_de: vod.title_de,
      },
      cinema_p4: {
        data: CFG.paths.cinema_csv,
        appendix: CFG.paths.cinema_appendix,
        title_de: cinema_p4.title_de,
      },
    },
    vod: {
      dimensions: vod.dimensions,
      active_slice: {
        TYPE_VOD: { code: sl.type_vod, label_de: codeLabel(vod.dimensions.TYPE_VOD, sl.type_vod) },
        TYPE_FILM: { code: sl.type_film, label_de: codeLabel(vod.dimensions.TYPE_FILM, sl.type_film) },
        UNIT: { code: sl.unit, label_de: codeLabel(vod.dimensions.UNIT, sl.unit) },
        STATUS: { code: sl.status, label_de: codeLabel(vod.dimensions.STATUS, sl.status) },
        ORIGIN: CFG.vod.origins.map((o) => ({
          code: o.id,
          label_de: codeLabel(vod.dimensions.ORIGIN, o.id),
        })),
        GENRE: CFG.vod.genres.map((g) => ({
          code: g.id,
          label_de: codeLabel(vod.dimensions.GENRE, g.id),
        })),
      },
    },
    cinema_p4: {
      dimensions: cinema_p4.dimensions,
      active_filters: {
        unit: {
          code: CFG.cinema.weekly.unit,
          label_de: codeLabel(cinema_p4.dimensions.unit, CFG.cinema.weekly.unit),
        },
        recent: {
          code: CFG.cinema.weekly.recent,
          label_de: codeLabel(cinema_p4.dimensions.recent, CFG.cinema.weekly.recent),
        },
        origin_all: {
          code: CFG.cinema.weekly.origin_all,
          label_de: codeLabel(cinema_p4.dimensions.origin, CFG.cinema.weekly.origin_all),
        },
        origins: CFG.cinema.origins.map((o) => ({
          code: o.id,
          label_de: codeLabel(cinema_p4.dimensions.origin, o.id),
        })),
      },
    },
  };

  const outPath = resolve(CFG.paths.bfs_metadata);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log("wrote", outPath);
  return out;
}

build();
