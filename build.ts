import { rm, mkdir, writeFile } from "fs/promises";
import { resolve as resolvePath } from "path";
import { build, type BunPlugin } from "bun";

const outdir = "./js-dist";
await mkdir(outdir, { recursive: true });

const minifyHTML = (source: string): string => {
  return source
    .replace(/<!--[\s\S]*?-->/g, "") // Remove comments
    .replace(/\s*\n\s*/g, " ") // Convert newlines to spaces
    .replace(/\s{2,}/g, " ") // Collapse multiple spaces
    .replace(/>\s+</g, "><") // Remove spaces between tags
    .replace(/\s+\/>/g, "/>"); // Remove space before self-closing
};

// Import *?raw as raw string
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

// First minify CSS files
const menuHTML = await Bun.file("./assets/html/menu.html").text();
await writeFile(`${outdir}/menu.html`, minifyHTML(menuHTML));

const cssBundles = await build({
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
  minify: true,
  outdir,
  external: ["electron", "electron-updater"],
  plugins: [rawPlugin],
};

const mainBundle = await build({
  ...common,
  entrypoints: ["./src/main.ts"],
  format: "esm",
  naming: "main.js",
});

const preloadBundle = await build({
  ...common,
  entrypoints: ["./src/preload/preload.ts"],
  format: "cjs",
  naming: "preload.js",
});

// Delete these assets because preload.js embeds them
await Promise.all([
  rm(`${outdir}/menu.html`, { force: true }),
  rm(`${outdir}/clientStyles.css`, { force: true }),
  rm(`${outdir}/modalStyles.css`, { force: true }),
  rm(`${outdir}/freezeBugFix.js`, { force: true }),
]);

// Output errors when bundling
const bundles = [mainBundle, preloadBundle, cssBundles, freezeBugFixBundle];
const failed = bundles.some((result) => !result.success);

if (failed) {
  for (const result of bundles) {
    for (const log of result.logs) {
      console.error(log);
    }
  }

  process.exit(1);
}
