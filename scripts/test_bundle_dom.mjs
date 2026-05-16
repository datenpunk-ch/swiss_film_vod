#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = JSON.parse(readFileSync(path.join(ROOT, "data", "unified.json"), "utf8"));

const dom = new JSDOM("<!DOCTYPE html><html><body><div id='unified-root'></div></body></html>", {
  url: "http://localhost:3456/",
  runScripts: "dangerously",
  resources: "usable",
});

const win = dom.window;
globalThis.window = win;
globalThis.document = win.document;
globalThis.navigator = win.navigator;
globalThis.HTMLElement = win.HTMLElement;

win.fetch = async (url) => {
  if (String(url).includes("unified.json")) {
    return { ok: true, json: async () => json };
  }
  return { ok: false, status: 404 };
};

const code = readFileSync(path.join(ROOT, "assets", "unified", "unified.js"), "utf8");

try {
  win.eval(code);
} catch (e) {
  console.error("eval error", e);
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 800));

const el = win.document.getElementById("unified-root");
console.log("innerHTML length:", el.innerHTML.length);
if (el.innerHTML.length < 50) {
  console.log("CONTENT:", el.innerHTML);
} else {
  console.log("preview:", el.innerHTML.slice(0, 500));
}

const err = win.document.querySelector(".panel-error");
if (err) console.log("ERROR TEXT:", err.textContent);
