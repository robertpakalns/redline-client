import { protocol, net, WebContents } from "electron";
import { mkdir, readdir, access } from "fs/promises";
import { BLOCKED_DOMAINS } from "../constants/main";
import { DOMAINS } from "../constants/shared";
import { Config, configDir } from "./config";
import { fromRoot } from "./functions";
import { pathToFileURL } from "url";
import { join } from "path";

const config = new Config();

const swapper = async (webContents: WebContents): Promise<void> => {
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

  const swapFile = async (name: string): Promise<string | null> => {
    // Resource detection based on the file name and extension
    if (!swapperFiles.has(name)) return null;
    const localFilePath = join(swapperFolder, name);

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
      if (adblocker && BLOCKED_DOMAINS.has(host))
        return callback({ cancel: true });

      if (DOMAINS.has(host)) {
        // Swapper
        if (swapper) {
          const fileName = pathname.split("/").pop();
          if (fileName && (await swapFile(fileName)))
            return callback({
              redirectURL: `redline://local?asset=${encodeURIComponent(fileName)}`,
            });
        }
      }

      return callback({});
    },
  );
};

export default swapper;
