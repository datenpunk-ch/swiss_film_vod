#!/usr/bin/env node
/**
 * Bundle the React dashboard into dash/ (self-contained, no runtime CDN).
 */
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DASHBOARD = path.join(ROOT, "dashboard");
const OUT = path.join(ROOT, "dash");
const ESBUILD_VERSION = "0.25.5";
const ESBUILD_PKG_DIR = path.join(ROOT, "scripts", ".esbuild", "esbuild-pkg");

const ESM_CDN = {
  react: "https://esm.sh/react@19.1.0",
  "react/jsx-runtime": "https://esm.sh/react@19.1.0/jsx-runtime",
  "react-dom": "https://esm.sh/react-dom@19.1.0",
  "react-dom/client": "https://esm.sh/react-dom@19.1.0/client",
  recharts: "https://esm.sh/recharts@2.15.3?deps=react@19.1.0,react-dom@19.1.0",
};

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          fetchBuffer(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function ensureEsbuildApi() {
  const entry = path.join(ESBUILD_PKG_DIR, "package", "lib", "main.js");
  if (fs.existsSync(entry)) return entry;
  fs.mkdirSync(ESBUILD_PKG_DIR, { recursive: true });
  const url = `https://registry.npmjs.org/esbuild/-/esbuild-${ESBUILD_VERSION}.tgz`;
  console.log("Downloading esbuild package…");
  const tgz = await fetchBuffer(url);
  const tarPath = path.join(ESBUILD_PKG_DIR, "pkg.tgz");
  fs.writeFileSync(tarPath, tgz);
  execSync(`tar -xzf "${tarPath}" -C "${ESBUILD_PKG_DIR}"`, { stdio: "inherit", shell: true });
  fs.unlinkSync(tarPath);
  const extracted = path.join(ESBUILD_PKG_DIR, "package", "lib", "main.js");
  if (!fs.existsSync(extracted)) throw new Error("esbuild package extract failed");
  return extracted;
}

function writeDashHtml(assetFile) {
  const template = fs.readFileSync(path.join(DASHBOARD, "index.html"), "utf8");
  let html = template
    .replace(
      '<link rel="stylesheet" href="../assets/fonts.css" />',
      '<link rel="stylesheet" href="../assets/fonts.css" />\n    <link rel="stylesheet" href="./assets/dash.css" />'
    )
    .replace('<script type="module" src="/src/main.jsx"></script>', `<script type="module" src="./${assetFile}"></script>`);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "index.html"), html, "utf8");
}

function cdnPlugin() {
  const cache = new Map();
  function fetchText(url) {
    if (cache.has(url)) return cache.get(url);
    const p = fetchBuffer(url).then((b) => b.toString("utf8"));
    cache.set(url, p);
    return p;
  }
  return {
    name: "cdn",
    setup(build) {
      build.onResolve({ filter: /^https?:\/\// }, (args) => ({ path: args.path, namespace: "http" }));
      build.onResolve({ filter: /.*/, namespace: "http" }, (args) => {
        if (args.path.startsWith("/")) {
          return { path: `https://esm.sh${args.path}`, namespace: "http" };
        }
        if (args.path.startsWith(".")) {
          const base = args.importer.replace(/^http:/, "https:");
          const resolved = new URL(args.path, base).href;
          return { path: resolved, namespace: "http" };
        }
        return null;
      });
      build.onResolve({ filter: /.*/ }, (args) => {
        const p = args.path;
        if (
          p.startsWith(".") ||
          p.startsWith("/") ||
          p.includes("\\") ||
          /^[a-zA-Z]:/.test(p) ||
          path.isAbsolute(p)
        ) {
          return null;
        }
        if (p.startsWith("node:")) return null;
        const url = ESM_CDN[p] || `https://esm.sh/${p}`;
        return { path: url, namespace: "http" };
      });
      build.onLoad({ filter: /.*/, namespace: "http" }, async (args) => {
        const src = await fetchText(args.path);
        const loader = args.path.endsWith(".css") ? "css" : "js";
        return { contents: src, loader };
      });
    },
  };
}

async function main() {
  const esbuildMain = await ensureEsbuildApi();
  const esbuild = await import(pathToFileURL(esbuildMain).href);
  fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
  const outfile = path.join(OUT, "assets", "dash.js");
  fs.copyFileSync(path.join(DASHBOARD, "src", "App.css"), path.join(OUT, "assets", "dash.css"));
  await esbuild.build({
    entryPoints: [path.join(DASHBOARD, "src", "main.jsx")],
    bundle: true,
    outfile,
    format: "esm",
    loader: { ".jsx": "jsx", ".css": "empty" },
    jsx: "automatic",
    target: "es2020",
    define: {
      "process.env.NODE_ENV": '"production"',
      "import.meta.env.DEV": "false",
    },
    plugins: [cdnPlugin()],
    logLevel: "info",
  });
  writeDashHtml("assets/dash.js");
  console.log("wrote", path.join(OUT, "index.html"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
