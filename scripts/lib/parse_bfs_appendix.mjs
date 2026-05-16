/**
 * Parse BFS Statistik-Appendix ODS tables (code lists + dimension descriptions).
 */
import { readOdsTable } from "./read_ods.mjs";

const VOD_DIM_ORDER = ["PERIOD", "TYPE_VOD", "TYPE_FILM", "ORIGIN", "GENRE", "UNIT", "STATUS"];
const P4_DIM_ORDER = ["year", "week", "date", "unit", "recent", "origin", "value"];

function isCodeEntry(code) {
  if (!code || code === "…" || code === "CODE") return false;
  if (code.startsWith("©") || code.includes("BFS")) return false;
  if (code.startsWith("Nutzungshinweis") || code.startsWith("Remarque") || code.startsWith("Note on")) return false;
  if (code.startsWith("Das Aufsummieren") || code.startsWith("Il n'est pas")) return false;
  if (code.startsWith("Values cannot") || code.startsWith("Besteht kein")) return false;
  return true;
}

function codeFromRow(row) {
  const label_en = row.length >= 5 ? row[4] : row[3];
  return {
    code: row[0],
    label_de: row[1] ?? "",
    label_fr: row[2] ?? "",
    label_it: row.length >= 5 ? row[3] : undefined,
    label_en: label_en ?? "",
  };
}

/**
 * @param {string[][]} rows
 * @param {string[]} dimOrder
 */
function parseAppendixRows(rows, dimOrder) {
  const dimensions = Object.fromEntries(
    dimOrder.map((name) => [name, { name, codes: [], usage_note_de: null }])
  );
  const dimQueue = [];
  let currentDim = null;
  let usageLines = [];
  let title_de = "";
  let title_fr = "";
  let title_en = "";

  for (const row of rows) {
    const a = row[0];
    if (!a) continue;

    if (!title_de && a.includes("StatVoD")) {
      title_de = row[0];
      title_fr = row[1] ?? "";
      title_en = row[2] ?? "";
      continue;
    }
    if (!title_de && (a === "Title" || a.includes("Kinostatistik"))) {
      title_de = a === "Title" ? row[1] ?? "" : row[0];
      title_fr = a === "Title" ? row[2] ?? "" : row[1] ?? "";
      title_en = a === "Title" ? row[4] ?? row[3] ?? "" : row[4] ?? row[3] ?? "";
      continue;
    }

    if (dimOrder.includes(a) && row[1]) {
      dimensions[a].description_de = row[1];
      dimensions[a].description_fr = row[2] ?? "";
      dimensions[a].description_en = row[3] ?? row[4] ?? "";
      dimQueue.push(a);
      continue;
    }

    if (a === "CODE") {
      if (currentDim) {
        dimensions[currentDim].codes = dimensions[currentDim]._pending ?? [];
        delete dimensions[currentDim]._pending;
        if (usageLines.length) {
          dimensions[currentDim].usage_note_de = usageLines.join(" ").trim();
          usageLines = [];
        }
      }
      currentDim = dimQueue.shift() ?? null;
      if (currentDim) dimensions[currentDim]._pending = [];
      continue;
    }

    if (a.startsWith("Nutzungshinweis")) {
      usageLines = [];
      continue;
    }
    if (usageLines.length === 0 && a.startsWith("Besteht kein")) {
      usageLines.push(a);
      continue;
    }
    if (usageLines.length && row[1] && !row[1].startsWith("Remarque") && !row[1].startsWith("Note on")) {
      usageLines.push(row[1]);
      continue;
    }

    if (currentDim && isCodeEntry(a)) {
      const entry = codeFromRow(row);
      if (!dimensions[currentDim]._pending) dimensions[currentDim]._pending = [];
      dimensions[currentDim]._pending.push(entry);
    }
  }

  if (currentDim && dimensions[currentDim]._pending) {
    dimensions[currentDim].codes = dimensions[currentDim]._pending;
    delete dimensions[currentDim]._pending;
    if (usageLines.length) dimensions[currentDim].usage_note_de = usageLines.join(" ").trim();
  }

  for (const d of Object.values(dimensions)) {
    delete d._pending;
  }

  return { title_de, title_fr, title_en, dimensions };
}

export function parseVodAppendix(odsPath) {
  const rows = readOdsTable(odsPath);
  const parsed = parseAppendixRows(rows, VOD_DIM_ORDER);
  return {
    dataset: "vod",
    appendix: pathBasename(odsPath),
    ...parsed,
  };
}

export function parseCinemaP4Appendix(odsPath) {
  const rows = readOdsTable(odsPath);
  const parsed = parseAppendixRows(rows, P4_DIM_ORDER);
  return {
    dataset: "cinema_p4",
    appendix: pathBasename(odsPath),
    ...parsed,
  };
}

function pathBasename(p) {
  return p.replace(/\\/g, "/").split("/").pop();
}
