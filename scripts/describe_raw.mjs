import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(ROOT, "data", "raw");

function parseCsv(text) {
  const raw = text.replace(/^\uFEFF/, "");
  const lines = raw.replace(/\r\n/g, "\n").split("\n").filter(Boolean);
  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, j) => {
      row[h] = (cols[j] || "").replace(/^"|"$/g, "");
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function uniq(rows, key) {
  return [...new Set(rows.map((r) => r[key]))].sort();
}

for (const f of ["ts-x-16.02.01.10.csv", "ts-x-16.02.01-P4.csv"]) {
  const rows = parseCsv(fs.readFileSync(path.join(RAW, f), "utf8"));
  console.log("\n===", f, "===");
  console.log("rows:", rows.length);
  for (const k of Object.keys(rows[0])) {
    const u = uniq(rows, k);
    console.log(k + " (" + u.length + "):", u.slice(0, 15).join(", "), u.length > 15 ? "..." : "");
  }
}
