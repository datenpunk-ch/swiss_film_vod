#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIV = String.fromCharCode(100, 105, 118);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "unified-app", "src");

function fixContent(before) {
  return before
    .replace(/<\s*motion\.motion\.div/g, `<${DIV}`)
    .replace(/<\/\s*motion\.div>/g, `</${DIV}>`)
    .replace(/<\s*motion\.div\s/g, `<${DIV} `)
    .replace(/<\s*motion\s+className=/g, `<${DIV} className=`)
    .replace(/<\s*motion>/g, `<${DIV}>`)
    .replace(/<\/\s*motion>/g, `</${DIV}>`);
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".jsx")) {
      const before = fs.readFileSync(p, "utf8");
      const fixed = fixContent(before);
      if (fixed !== before) {
        fs.writeFileSync(p, fixed);
        console.log("fixed", p);
      }
    }
  }
}
walk(root);
