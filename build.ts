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

await mkdir(outdir, { recursive: true });

// First minify CSS files
const assetsBundle = await build({
  entrypoints: [
    "./assets/css/clientStyles.css",
    "./assets/css/modalStyles.css",
  ],
  outdir,
  target: "browser",
  minify: true,
  external: ["redline://*"],
  naming: {
    entry: "[name].[ext]",
    chunk: "[name].[ext]",
    asset: "[name].[ext]",
  },
});

const freezeBugFixBundle = await build({
  target: "browser",
  minify: true,
  outdir,
  entrypoints: ["./src/preload/freezeBugFix.js"],
  naming: "freezeBugFix.js",
});

// Then bundle and minify JS files
const common = {
  target: "node",
  external: ["electron", "electron-updater"],
  minify: true,
  plugins: [rawPlugin],
};

const mainBundle = await build({
  ...common,
  entrypoints: ["./index.ts"],
  outdir,
  format: "esm",
  naming: "main.js",
});

const preloadBundle = await build({
  ...common,
  entrypoints: ["./src/preload/preload.ts"],
  outdir,
  format: "cjs",
  naming: "preload.js",
});

// Delete minified css files because preload.js embeds them
await Promise.all([
  rm(`${outdir}/clientStyles.css`, { force: true }),
  rm(`${outdir}/modalStyles.css`, { force: true }),
  rm(`${outdir}/freezeBugFix.js`, { force: true }),
]);

const bundles = [mainBundle, preloadBundle, assetsBundle, freezeBugFixBundle];
const failed = bundles.some((result) => !result.success);

if (failed) {
  for (const result of bundles) {
    for (const log of result.logs) {
      console.error(log);
    }
  }

  process.exit(1);
}
