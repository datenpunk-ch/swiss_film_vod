#!/usr/bin/env node
/**
 * Full bundle → assets/unified/unified.js (IIFE, no CDN importmap).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "unified-app");
const ESBUILD_DIR = path.join(APP, ".esbuild");
const ESBUILD_EXE = path.join(ESBUILD_DIR, process.platform === "win32" ? "esbuild.exe" : "esbuild");
const OUT = path.join(ROOT, "assets", "unified", "unified.js");
const NM = path.join(APP, "node_modules");

async function ensureEsbuild() {
  if (fs.existsSync(ESBUILD_EXE)) return;
  fs.mkdirSync(ESBUILD_DIR, { recursive: true });
  const platform = process.platform === "win32" ? "win32-x64" : `${process.platform}-${process.arch}`;
  const url = `https://registry.npmjs.org/@esbuild/${platform}/-/esbuild-0.25.5.tgz`;
  const tgz = path.join(ESBUILD_DIR, "pkg.tgz");
  await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`esbuild HTTP ${res.statusCode}`));
        return;
      }
      pipeline(res, createWriteStream(tgz)).then(resolve).catch(reject);
    }).on("error", reject);
  });
  execFileSync("tar", ["-xzf", tgz, "-C", ESBUILD_DIR], { stdio: "inherit" });
  fs.copyFileSync(
    path.join(ESBUILD_DIR, "package", process.platform === "win32" ? "esbuild.exe" : "esbuild"),
    ESBUILD_EXE
  );
}

async function main() {
  if (!fs.existsSync(path.join(NM, "react", "package.json"))) {
    console.log("Installing unified-app dependencies …");
    execFileSync(process.execPath, [path.join(ROOT, "scripts", "install_unified_deps.mjs")], {
      stdio: "inherit",
    });
  }
  await ensureEsbuild();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  execFileSync(
    ESBUILD_EXE,
    [
      path.join(APP, "src", "main.jsx"),
      "--bundle",
      "--format=iife",
      "--platform=browser",
      `--outfile=${OUT}`,
      "--jsx=automatic",
      "--jsx-import-source=react",
      "--minify",
    ],
    { stdio: "inherit" }
  );
  console.log("wrote", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
