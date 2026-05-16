#!/usr/bin/env node
/** Install react, react-dom, recharts into unified-app/node_modules (no npm required). */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NM = path.join(ROOT, "unified-app", "node_modules");

const PACKAGES = [
  { name: "react", version: "19.1.0" },
  { name: "react-dom", version: "19.1.0" },
  { name: "recharts", version: "2.15.3" },
  { name: "scheduler", version: "0.26.0" },
  { name: "clsx", version: "2.1.1" },
  { name: "lodash", version: "4.17.21" },
  { name: "react-is", version: "18.3.1" },
  { name: "eventemitter3", version: "5.0.1" },
  { name: "recharts-scale", version: "0.4.5" },
  { name: "tiny-invariant", version: "1.3.3" },
  { name: "decimal.js-light", version: "2.5.1" },
  { name: "d3-shape", version: "3.2.0" },
  { name: "d3-path", version: "3.1.0" },
  { name: "d3-scale", version: "4.0.2" },
  { name: "d3-array", version: "3.2.4" },
  { name: "d3-format", version: "3.1.0" },
  { name: "d3-interpolate", version: "3.0.1" },
  { name: "d3-time", version: "3.1.0" },
  { name: "d3-time-format", version: "4.1.0" },
  { name: "d3-color", version: "3.1.0" },
  { name: "internmap", version: "2.0.3" },
  { name: "prop-types", version: "15.8.1" },
  { name: "object-assign", version: "4.1.1" },
  { name: "react-smooth", version: "4.0.4" },
  { name: "react-transition-group", version: "4.4.5" },
  { name: "dom-helpers", version: "5.2.1" },
  { name: "@babel/runtime", version: "7.27.1" },
  { name: "fast-equals", version: "5.2.2" },
  { name: "victory-vendor", version: "36.9.2" },
];

function fetchTar(name, version) {
  const platform = process.platform === "win32" ? "win32-x64" : `${process.platform}-${process.arch}`;
  const pkg = name.startsWith("@") ? name : name;
  const url = `https://registry.npmjs.org/${encodeURIComponent(pkg).replace("%40", "@")}/-/${name.includes("/") ? name.split("/")[1] : name}-${version}.tgz`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, (r2) => {
          const dest = path.join(NM, `.cache-${name.replace("/", "_")}-${version}.tgz`);
          pipeline(r2, createWriteStream(dest)).then(() => resolve(dest)).catch(reject);
        }).on("error", reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`${name}@${version} HTTP ${res.statusCode}`));
        return;
      }
      const dest = path.join(NM, `.cache-${name.replace("/", "_")}-${version}.tgz`);
      pipeline(res, createWriteStream(dest)).then(() => resolve(dest)).catch(reject);
    }).on("error", reject);
  });
}

async function extractPkg(name, version) {
  const dir = path.join(NM, ...name.split("/"));
  if (fs.existsSync(path.join(dir, "package.json"))) return;
  fs.mkdirSync(NM, { recursive: true });
  const tgz = await fetchTar(name, version);
  fs.mkdirSync(dir, { recursive: true });
  execFileSync("tar", ["-xzf", tgz, "-C", dir, "--strip-components=1"], { stdio: "pipe" });
}

async function main() {
  fs.mkdirSync(NM, { recursive: true });
  for (const p of PACKAGES) {
    process.stdout.write(`install ${p.name}@${p.version} …\n`);
    await extractPkg(p.name, p.version);
  }
  console.log("done:", NM);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
