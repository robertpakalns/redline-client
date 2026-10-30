// build.ts
import { resolve as resolvePath } from "path";
import { build, type BunPlugin } from "bun";
import { rm, mkdir } from "fs/promises";

const outdir = "./js-dist";

const rawPlugin: BunPlugin = {
  name: "raw-imports",

  setup(builder) {
    builder.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: resolvePath(args.resolveDir, args.path.replace(/\?raw$/, "")),
      namespace: "raw",
    }));

    builder.onLoad({ filter: /.*/, namespace: "raw" }, async (args) => ({
      contents: await Bun.file(args.path).text(),
      loader: "text",
    }));
  },
};

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const common = {
  target: "node" as const,
  external: ["electron", "electron-updater"],
  minify: true,
  plugins: [rawPlugin],
};

// Main process: ESM -> main.js
const mainResult = await build({
  ...common,
  entrypoints: ["./index.ts"],
  outdir,
  format: "esm",
  naming: "main.js",
});

// Preload: CommonJS -> preload.cjs
const preloadResult = await build({
  ...common,
  entrypoints: ["./src/preload/preload.ts"],
  outdir,
  format: "cjs",
  naming: "preload.js",
});

const results = [mainResult, preloadResult];
const failed = results.some((result) => !result.success);

if (failed) {
  for (const result of results) {
    for (const log of result.logs) {
      console.error(log);
    }
  }

  process.exit(1);
}

console.log("Build successful.");
