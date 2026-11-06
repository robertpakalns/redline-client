import { version as clientVersion } from "../../package.json";
import { type, release, arch } from "os";

export const CLIENT_VERSION = clientVersion;

// Passed to from main to renderer process; generated at runtime but remains constant
export const APP_INFO = {
  CHROMIUM: `v${process.versions.chrome}`,
  ELECTRON: `v${process.versions.electron}`,
  NODE: `v${process.versions.node}`,
  REDLINE_CLIENT: `v${clientVersion}`,
  OS: `${type()} ${release()} (${arch()})`,
};

// Assets blocked from these domains when adblocker is enabled
export const BLOCKED_DOMAINS = new Set<string>([
  "api.adinplay.com",
  "www.google-analytics.com",
  "www.googletagmanager.com",
  "static.cloudflareinsights.com",
]);
