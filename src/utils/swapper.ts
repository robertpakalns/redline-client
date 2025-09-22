import { protocol, net, WebContents } from "electron";
import { mkdir, readdir, access } from "fs/promises";
import { domains, fromRoot } from "./functions.js";
import { Config, configDir } from "./config.js";
import { pathToFileURL } from "url";
import { join } from "path";

const config = new Config();

const swapper = async (webContents: WebContents): Promise<void> => {
  const reject = new Set<string>([
    "api.adinplay.com",
    "www.google-analytics.com",
    "www.googletagmanager.com",
    "static.cloudflareinsights.com",
  ]);

  const { adblocker, swapper } = config.get("client") as {
    adblocker: boolean;
    swapper: boolean;
  };

  const swapperFolder = join(configDir, "swapper");

  await mkdir(swapperFolder, { recursive: true });
  const swapperFiles = new Set<string>(await readdir(swapperFolder));

  // Handle protocol
  protocol.handle("redline", async ({ url }) => {
    const u = new URL(url);

    const assetName = u.searchParams.get("asset");
    const relPath = u.searchParams.get("path");

    let localPath: string | undefined;
    if (relPath) localPath = fromRoot(relPath);
    else if (assetName) localPath = join(configDir, "swapper", assetName);
    else return new Response(null, { status: 404 });

    try {
      await access(localPath);
      return net.fetch(pathToFileURL(localPath).toString());
    } catch {
      return new Response(null, { status: 404 });
    }
  });

  const swapFile = async (name: string | undefined): Promise<string | null> => {
    // Resource detection based on the file name and extension
    if (!swapperFiles.has(name as string)) return null;
    const localFilePath = join(swapperFolder, name as string);

    try {
      await access(localFilePath);
      return `file://${localFilePath}`;
    } catch {
      return null;
    }
  };

  webContents.session.webRequest.onBeforeRequest(
    async ({ url }, callback): Promise<void> => {
      const { protocol, host, pathname } = new URL(url);

      if (protocol === "file:") return callback({});

      // Block ads and other scripts which are not Kirka related
      if (adblocker && reject.has(host)) return callback({ cancel: true });

      if (domains.has(host)) {
        // Swapper
        if (swapper) {
          const fileName = pathname.split("/").pop();
          if (await swapFile(fileName))
            return callback({
              redirectURL: `redline://local?asset=${encodeURIComponent(fileName as string)}`,
            });
        }
      }

      return callback({});
    },
  );
};

export default swapper;
