import {
  readFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  writeFileSync,
} from "fs";
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
  // Fill the object if missing keys
  for (const key of array) if (!(key in obj)) obj[key] = true;

  // Clear unexpected keys
  const keySet = new Set(array);
  for (const key in obj) if (!keySet.has(key)) delete obj[key];
};

export const userScriptsPath = join(configDir, "userscripts.json");
if (!existsSync(userScriptsPath))
  writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2));

const userscriptsFolder = join(configDir, "scripts");
if (!existsSync(userscriptsFolder))
  mkdirSync(userscriptsFolder, { recursive: true });

const userstylesFolder = join(configDir, "styles");
if (!existsSync(userstylesFolder))
  mkdirSync(userstylesFolder, { recursive: true });

const getUserScriptsFiles = (): void => {
  let data: IUserscripts;
  try {
    data = handleConfig(JSON.parse(readFileSync(userScriptsPath, "utf8")));
  } catch {
    data = JSON.parse(JSON.stringify(defaultConfig));
    writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  let { enable, scripts, styles } = data;

  if (!Array.isArray(scripts)) scripts = [];

  const originalEnable = enable;
  const originalScripts = JSON.stringify(scripts);
  const originalStyles = JSON.stringify(styles);

  userScripts = readdirSync(userscriptsFolder).filter((script) =>
    script.endsWith(".js"),
  );
  userStyles = readdirSync(userstylesFolder).filter((style) =>
    style.endsWith(".css"),
  );

  const newScripts: ScriptMeta[] = [];
  for (const file of userScripts) {
    const path = join(userscriptsFolder, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    const meta = extractMetadata(content, file);

    const existing = scripts.find((s) => s.file === file);
    if (existing) meta.enabled = existing.enabled;

    newScripts.push(meta);
  }

  handleObject(styles, userStyles);

  if (
    originalEnable !== enable ||
    originalScripts !== JSON.stringify(newScripts) ||
    originalStyles !== JSON.stringify(styles)
  ) {
    writeFileSync(
      userScriptsPath,
      JSON.stringify({ enable, scripts: newScripts, styles }, null, 2),
    );
  }
};

// User scripts
// .js files only
const setUserscripts = (webContents: WebContents): void => {
  let data: IUserscripts;
  try {
    data = JSON.parse(readFileSync(userScriptsPath, "utf8"));
  } catch {
    data = JSON.parse(JSON.stringify(defaultConfig));
    writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  const { enable, scripts } = data;
  if (!enable) return;

  for (const el of userScripts) {
    const meta = scripts.find((s) => s.file === el);
    if (!meta?.enabled) continue;

    const scriptPath = join(userscriptsFolder, el);
    if (existsSync(scriptPath)) {
      const script = readFileSync(scriptPath, "utf8");
      const content = new Function(script);
      webContents.executeJavaScript(`(${content.toString()})()`);
    }
  }
};

// User styles
// .css files only
const setUserstyles = (webContents: WebContents): void => {
  let data;
  try {
    data = JSON.parse(readFileSync(userScriptsPath, "utf8"));
  } catch {
    data = JSON.parse(JSON.stringify(defaultConfig));
    writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2));
  }

  const { enable, styles } = data;

  for (const el of userStyles) {
    if (styles[el] === false) continue;
    const stylePath = join(userstylesFolder, el);
    if (enable && existsSync(stylePath)) {
      const styleContent = readFileSync(stylePath, "utf8");
      webContents.insertCSS(styleContent);
    }
  }
};

export const userscripts = (webContents: WebContents): void => {
  getUserScriptsFiles();
  setUserscripts(webContents);

  webContents.on("did-start-navigation", (_, __, isInPlace, isMainFrame) => {
    if (isMainFrame && !isInPlace) {
      getUserScriptsFiles();
      setUserscripts(webContents);
    }
  });

  webContents.on("did-finish-load", () => setUserstyles(webContents));
};
