import { mkdir, readFile, writeFile, readdir, access } from "fs/promises";
import { configDir } from "./config.js";
import { WebContents } from "electron";
import { join } from "path";

export interface ScriptMeta {
  file: string;
  name: string;
  description: string;
  authors: string;
  category: string;
  enabled: boolean;
}

interface IUserscripts {
  enable: boolean;
  scripts: ScriptMeta[];
  styles: Record<string, boolean>;
}

const defaultConfig: IUserscripts = {
  enable: true,
  scripts: [],
  styles: {},
};

let userScripts: string[] = [];
let userStyles: string[] = [];

const extractMetadata = (content: string, file: string): ScriptMeta => {
  const blockRegex =
    /\/\/\s*==RedlineClientPlugin==([\s\S]*?)\/\/\s*==RedlineClientPlugin==/;
  const match = content.match(blockRegex);

  const meta: ScriptMeta = {
    file,
    name: file,
    description: "",
    authors: "",
    category: "",
    enabled: true,
  };

  if (match) {
    const lines = match[1].split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("// @name"))
        meta.name = trimmed.replace("// @name", "").trim();
      if (trimmed.startsWith("// @description"))
        meta.description = trimmed.replace("// @description", "").trim();
      if (trimmed.startsWith("// @authors"))
        meta.authors = trimmed.replace("// @authors", "").trim();
      if (trimmed.startsWith("// @category"))
        meta.category = trimmed.replace("// @category", "").trim();
    }
  }

  return meta;
};

const handleConfig = (data: any): IUserscripts => ({
  enable: typeof data.enable === "boolean" ? data.enable : true,
  scripts: Array.isArray(data.scripts) ? data.scripts : [],
  styles: typeof data.styles === "object" ? data.styles : {},
});

const handleObject = (obj: Record<string, boolean>, array: string[]): void => {
  for (const key of array) if (!(key in obj)) obj[key] = true;

  const keySet = new Set(array);
  for (const key in obj) if (!keySet.has(key)) delete obj[key];
};

export const userScriptsPath = join(configDir, "userscripts.json");

const ensureConfigFile = async (): Promise<void> => {
  try {
    await access(userScriptsPath);
  } catch {
    await writeFile(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }
};

const userscriptsFolder = join(configDir, "scripts");
const userstylesFolder = join(configDir, "styles");

const prepareDirs = async (): Promise<void> => {
  await mkdir(userscriptsFolder, { recursive: true });
  await mkdir(userstylesFolder, { recursive: true });
};

const getUserScriptsFiles = async (): Promise<void> => {
  let data: IUserscripts;
  try {
    data = handleConfig(JSON.parse(await readFile(userScriptsPath, "utf8")));
  } catch {
    data = JSON.parse(JSON.stringify(defaultConfig));
    await writeFile(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  let { enable, scripts, styles } = data;

  const originalEnable = enable;
  const originalScripts = JSON.stringify(scripts);
  const originalStyles = JSON.stringify(styles);

  userScripts = (await readdir(userscriptsFolder)).filter((s) =>
    s.endsWith(".js"),
  );
  userStyles = (await readdir(userstylesFolder)).filter((s) =>
    s.endsWith(".css"),
  );

  const newScripts: ScriptMeta[] = [];
  for (const file of userScripts) {
    const path = join(userscriptsFolder, file);
    try {
      await access(path);
      const content = await readFile(path, "utf8");
      const meta = extractMetadata(content, file);

      const existing = scripts.find((s) => s.file === file);
      if (existing) meta.enabled = existing.enabled;

      newScripts.push(meta);
    } catch {}
  }

  handleObject(styles, userStyles);

  if (
    originalEnable !== enable ||
    originalScripts !== JSON.stringify(newScripts) ||
    originalStyles !== JSON.stringify(styles)
  ) {
    await writeFile(
      userScriptsPath,
      JSON.stringify({ enable, scripts: newScripts, styles }, null, 2),
    );
  }
};

const setUserscripts = async (webContents: WebContents): Promise<void> => {
  let data: IUserscripts;
  try {
    data = JSON.parse(await readFile(userScriptsPath, "utf8"));
  } catch {
    data = JSON.parse(JSON.stringify(defaultConfig));
    await writeFile(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  const { enable, scripts } = data;
  if (!enable) return;

  for (const el of userScripts) {
    const meta = scripts.find((s) => s.file === el);
    if (!meta?.enabled) continue;

    const scriptPath = join(userscriptsFolder, el);
    try {
      await access(scriptPath);
      const script = await readFile(scriptPath, "utf8");
      const content = new Function(script);
      webContents.executeJavaScript(`(${content.toString()})()`);
    } catch {}
  }
};

const setUserstyles = async (webContents: WebContents): Promise<void> => {
  let data: IUserscripts;
  try {
    data = JSON.parse(await readFile(userScriptsPath, "utf8"));
  } catch {
    data = JSON.parse(JSON.stringify(defaultConfig));
    await writeFile(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  const { enable, styles } = data;

  for (const el of userStyles) {
    if (styles[el] === false) continue;
    const stylePath = join(userstylesFolder, el);
    try {
      await access(stylePath);
      const styleContent = await readFile(stylePath, "utf8");
      if (enable) webContents.insertCSS(styleContent);
    } catch {}
  }
};

export const userscripts = async (webContents: WebContents): Promise<void> => {
  await ensureConfigFile();
  await prepareDirs();
  await getUserScriptsFiles();
  await setUserscripts(webContents);

  webContents.on(
    "did-start-navigation",
    async (_, __, isInPlace, isMainFrame) => {
      if (isMainFrame && !isInPlace) {
        await getUserScriptsFiles();
        await setUserscripts(webContents);
      }
    },
  );

  webContents.on("did-finish-load", async () => {
    await setUserstyles(webContents);
  });
};
