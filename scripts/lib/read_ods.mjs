/**
 * Minimal ODS reader (ZIP + content.xml table rows). No dependencies.
 */
import fs from "node:fs";
import zlib from "node:zlib";

const LOCAL_SIG = 0x04034b50;

/** @returns {string[][]} */
export function readOdsTable(odsPath) {
  const buf = fs.readFileSync(odsPath);
  const xml = extractZipEntry(buf, "content.xml");
  if (!xml) throw new Error(`content.xml missing in ${odsPath}`);
  return parseContentXml(xml.toString("utf8")).map(normalizeOdsRow);
}

/** Collapse ODS column-repeat padding — keep only non-empty leading cells. */
export function normalizeOdsRow(row, maxCols = 8) {
  const cells = [];
  for (let i = 0; i < row.length && cells.length < maxCols; i++) {
    if (row[i]) cells.push(row[i]);
  }
  return cells;
}

function extractZipEntry(buf, wantName) {
  let offset = 0;
  while (offset + 30 <= buf.length) {
    if (buf.readUInt32LE(offset) !== LOCAL_SIG) {
      offset++;
      continue;
    }
    const compMethod = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const uncompSize = buf.readUInt32LE(offset + 22);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.toString("utf8", offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;
    const dataEnd = dataStart + compSize;
    if (name === wantName || name.endsWith(`/${wantName}`)) {
      const compressed = buf.subarray(dataStart, dataEnd);
      if (compMethod === 0) return compressed;
      if (compMethod === 8) return zlib.inflateRawSync(compressed);
      throw new Error(`Unsupported ZIP method ${compMethod} for ${wantName}`);
    }
    offset = dataEnd;
  }
  return null;
}

/** @returns {string[][]} */
function parseContentXml(xml) {
  const rows = [];
  const rowRe = /<table:table-row[^>]*>([\s\S]*?)<\/table:table-row>/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const cells = [];
    const cellRe = /<table:table-cell([^>]*)>([\s\S]*?)<\/table:table-cell>|<table:table-cell([^>]*)\/>/g;
    let cm;
    while ((cm = cellRe.exec(rm[1]))) {
      const attrs = cm[1] || cm[3] || "";
      const inner = cm[2] || "";
      const repMatch = attrs.match(/number-columns-repeated="(\d+)"/);
      const repeats = repMatch ? Number(repMatch[1]) : 1;
      const texts = [...inner.matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)].map((m) =>
        decodeXml(m[1].replace(/<[^>]+>/g, ""))
      );
      const val = texts.join(" ").trim();
      for (let i = 0; i < repeats; i++) cells.push(val);
    }
    if (cells.some((c) => c)) rows.push(cells);
  }
  return rows;
}

function decodeXml(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}
