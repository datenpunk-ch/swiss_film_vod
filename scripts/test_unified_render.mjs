#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const json = JSON.parse(readFileSync(path.join(ROOT, "data", "unified.json"), "utf8"));
  const dom = new JSDOM("<!DOCTYPE html><html><body><div id='unified-root'></div></body></html>", {
    url: "http://localhost:3456/",
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.fetch = async (url) => {
    if (String(url).includes("unified.json")) {
      return { ok: true, json: async () => json };
    }
    throw new Error(`unexpected fetch ${url}`);
  };

  const { default: App } = await import(`file://${path.join(ROOT, "unified-app", "src", "App.jsx")}`);
  const html = renderToString(createElement(App));
  console.log("render ok, length", html.length);
  console.log(html.slice(0, 500));
}

main().catch((e) => {
  console.error("RENDER FAIL", e);
  process.exit(1);
});
