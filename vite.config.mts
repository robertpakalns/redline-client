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
      fileName: (_format, name) => `${name}.js`,
    },
    rolldownOptions: {
      external: [
        "electron",
        "electron-updater",
        "fs",
        "fs/promises",
        "os",
        "path",
        "module",
        "url",
        "node-enject",
      ],
      output: {
        manualChunks: undefined,
      },
    },
  },
});
