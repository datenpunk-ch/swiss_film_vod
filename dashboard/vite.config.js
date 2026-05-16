import fs from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const dataDir = resolve(__dirname, "../data");

function serveDataFromParent() {
  return {
    name: "serve-data-from-parent",
    configureServer(server) {
      server.middlewares.use("/data", (req, res, next) => {
        const rel = (req.url || "").replace(/^\//, "");
        if (!rel.endsWith(".json")) return next();
        const fp = resolve(dataDir, rel);
        if (!fp.startsWith(dataDir) || !fs.existsSync(fp)) return next();
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        fs.createReadStream(fp).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveDataFromParent()],
  base: "./",
  build: {
    outDir: resolve(__dirname, "../dash"),
    emptyOutDir: true,
  },
});
