import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "js-dist",
    emptyOutDir: true,
    lib: {
      entry: {
        main: resolve("index.ts"),
        preload: resolve("src/preload/preload.ts"),
      },
      formats: ["cjs"],
      fileName: (format, name) => `${name}.${format}.js`,
    },
    rollupOptions: {
      external: [
        "discord-rpc",
        "electron",
        "electron-updater",
        "fs",
        "os",
        "path",
        "module",
        "url",
        "@juice-client/node-enject",
        // "chart.js",
      ],
      output: {
        entryFileNames: "[name].js",
        manualChunks: undefined,
      },
    },
  },
});
