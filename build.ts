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

await Promise.all([
  rm(`${outdir}/main.js`, { force: true }),
  rm(`${outdir}/preload.js`, { force: true }),
]);

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

const bundles = [mainBundle, preloadBundle];
const failed = bundles.some((result) => !result.success);

if (failed) {
  for (const result of bundles) {
    for (const log of result.logs) {
      console.error(log);
    }
  }

  process.exit(1);
}
