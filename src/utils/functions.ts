import { app, nativeImage, type NativeImage } from "electron";
import { DOMAINS, MAIN_DOMAIN } from "../constants";
import { Config } from "./config";
import { join } from "path";

const config = new Config();

// Project root path
export const fromRoot = (path: string): string => join(app.getAppPath(), path);

const host = config.get("client.domain") as string;
export const getHost = (): string => (DOMAINS.has(host) ? host : MAIN_DOMAIN);

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
