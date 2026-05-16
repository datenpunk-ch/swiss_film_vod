import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../assets/unified",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "unified.js",
        chunkFileNames: "chunk-[name].js",
        assetFileNames: "unified.[ext]",
      },
    },
  },
});
