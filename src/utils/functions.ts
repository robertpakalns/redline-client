import { nativeImage, NativeImage } from "electron";
import { Config, ConfigType } from "./config.js";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const config = new Config();

// Project root path
const __root = resolve(dirname(fileURLToPath(import.meta.url)), "../");
export const fromRoot = (path: string): string => join(__root, path);

// Kirka.io Domains
export const domains = new Set<string>([
  "kirka.io",
  "snipers.io",
  "ask101math.com",
  "fpsiogame.com",
  "cloudconverts.com",
]);

const host: ConfigType = config.get("client.domain");
export const getHost = (): string =>
  domains.has(host as string) ? (host as string) : "kirka.io";

// Redline Client icon
const extObj: Record<string, string> = {
  win32: "ico",
  darwin: "icns",
  linux: "png",
};

let cachedIcon: NativeImage | undefined;
export const getIcon = (): NativeImage | undefined => {
  if (cachedIcon) return cachedIcon;

  const ext: string = extObj[process.platform];
  if (!ext) return undefined;

  cachedIcon = nativeImage.createFromPath(
    fromRoot(`./assets/icons/icon.${ext}`),
  );
  return cachedIcon;
};
