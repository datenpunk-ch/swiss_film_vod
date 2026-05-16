/**
 * PC-Axis (.px) parser helpers (shared by export_site and build_unified).
 */

export function extractPxValuesBlock(text, dimName) {
  const re = new RegExp(
    `VALUES\\("(${dimName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})"\\)=([^\\n]+(?:\\n[^A-Z][^\\n]*)*)`,
    "m"
  );
  const m = text.match(re);
  if (!m) return [];
  const raw = m[2].replace(/\r?\n/g, "").replace(/"\s*"/g, "");
  const parts = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) {
      const v = cur.trim().replace(/^"|"$/g, "");
      if (v) parts.push(v);
      cur = "";
    } else cur += ch;
  }
  const last = cur.trim().replace(/^"|"$/g, "");
  if (last) parts.push(last);
  return parts.map((v) => v.replace(/;+\s*$/, "").trim()).filter(Boolean);
}

export function extractPxField(text, key) {
  const re = new RegExp(`^${key}="([^"]*)"`, "m");
  const m = text.match(re);
  return m ? m[1] : "";
}

export function parsePxData(text) {
  const idx = text.indexOf("DATA=");
  if (idx < 0) return [];
  const chunk = text.slice(idx + 5);
  const nums = [];
  const re = /-?\d+/g;
  let m;
  while ((m = re.exec(chunk))) nums.push(Number(m[0]));
  return nums;
}

/** @returns {{ years: number[], countries: string[], readCell: Function, genreBlock: string[], units: string[] }} */
export function openPxCube(pxText) {
  const years = extractPxValuesBlock(pxText, "Jahr").map(Number).filter(Number.isFinite);
  const countries = extractPxValuesBlock(pxText, "Herkunftsland");
  const langRegions = extractPxValuesBlock(pxText, "Sprachgebiet");
  const filmTypes = extractPxValuesBlock(pxText, "Alle Filme - Erstaufführungen");
  const genreBlock = extractPxValuesBlock(pxText, "Sprachfassung - Projektionsart - Genre");
  const units = extractPxValuesBlock(pxText, "Beobachtungseinheit");
  const data = parsePxData(pxText);

  const nUnit = units.length;
  const nGenre = genreBlock.length;
  const nFilm = filmTypes.length;
  const nLang = langRegions.length;
  const nCountry = countries.length;
  const blockSize = nGenre * nUnit;
  const countrySize = nLang * nFilm * blockSize;
  const yearSize = nCountry * countrySize;

  const idxLang = langRegions.indexOf("Schweiz");
  const idxFilm = filmTypes.findIndex((f) => f.startsWith("Alle vorgeführten"));
  const idxUnitAdm = units.findIndex((u) => u.startsWith("Kinoeintritte"));
  const idxUnitFilms = units.findIndex((u) => u.startsWith("Anzahl Filme"));

  function readCell(yearIdx, countryIdx, genreIdx, unitIdx) {
    if ([idxLang, idxFilm, genreIdx, unitIdx].some((i) => i < 0) || countryIdx < 0) return 0;
    const i =
      yearIdx * yearSize +
      countryIdx * countrySize +
      idxLang * nFilm * blockSize +
      idxFilm * blockSize +
      genreIdx * nUnit +
      unitIdx;
    return data[i] ?? 0;
  }

  return {
    years,
    countries,
    genreBlock,
    units,
    idxUnitAdm,
    idxUnitFilms,
    readCell,
    genreIndex: (match) => genreBlock.findIndex((g) => g.startsWith(match)),
    countryIndex: (pred) => countries.findIndex(pred),
  };
}
