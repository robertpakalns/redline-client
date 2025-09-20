import { appendConfig, Setting, sendNotification } from "./generateConfigs.js";
import settingsJson from "../../../assets/userscriptsSettings.json";
import { createEl } from "../../preload/preloadFunctions";
import { ScriptMeta } from "../../utils/userscripts.js";
import { shell, ipcRenderer } from "electron";

const data = settingsJson as Setting[];

const testCont = (
  className: string,
  children: (HTMLElement | string | null | undefined)[],
): HTMLElement | null => {
  const valid = children.filter(Boolean);
  return valid.length
    ? createEl("div", {}, className, valid as (HTMLElement | string)[])
    : null;
};

const appendUserscriptConfig = (
  meta: ScriptMeta,
  configCont: HTMLElement,
  sh: string,
  parentCont: HTMLElement,
): void => {
  const name = createEl("div", {}, "name", [meta.name]);
  const description = meta.description
    ? createEl("div", {}, "subText", [meta.description])
    : null;
  const authors = meta.authors
    ? createEl("div", {}, "subText", [`by ${meta.authors}`])
    : null;
  const category = meta.category
    ? createEl("div", {}, "category", [meta.category])
    : null;

  const open = createEl("a", {}, "", ["Open"]);
  open.addEventListener("click", async () =>
    shell.openPath(
      await ipcRenderer.invoke("from-config-dir", `${sh}/${meta.file}`),
    ),
  );

  const requires = createEl("div", {}, "refresh", ["Requires page refresh"]);

  const upCont = testCont("upCont", [name, requires, category]);
  const downCont = testCont("downCont", [description, authors, open]);

  const leftCont = testCont("leftCont", [upCont, downCont]);
  const cont = createEl("div", {}, "configCont", [leftCont!, configCont]);

  parentCont?.appendChild(cont);
};

let loaded = false;
const createUserscriptsSection = async () => {
  if (loaded) return;
  loaded = true;

  const writeConfig = async (): Promise<void> => {
    await ipcRenderer.invoke("write-userscripts-config", userScriptsConfig);
  };

  const userScriptsConfig = JSON.parse(
    await ipcRenderer.invoke("read-userscripts-config"),
  );
  const { enable: userScriptsEnabled, scripts, styles } = userScriptsConfig;

  const userscriptsInit = (arr: ScriptMeta[]): void => {
    const cont = document.querySelector(`#userscriptsCont`) as HTMLElement;

    if (arr.length === 0) {
      cont!.innerText = "No .js files found";
      return;
    }

    for (const el of arr) {
      const _checkbox = createEl("input", {
        type: "checkbox",
        checked: el.enabled,
      });
      _checkbox.addEventListener("change", async (e) => {
        el.enabled = (e.target as HTMLInputElement).checked;
        await writeConfig();
        sendNotification("refresh");
      });

      appendUserscriptConfig(el, _checkbox, "scripts", cont);
    }
  };

  const userstylesInit = (obj: Record<string, boolean>): void => {
    const cont = document.querySelector(`#userstylesCont`) as HTMLElement;

    if (Object.keys(obj).length === 0) {
      cont!.innerText = "No .css files found";
      return;
    }

    if (cont?.children.length !== 0) return;

    for (const key in obj) {
      const meta: ScriptMeta = {
        file: key,
        name: key,
        description: "",
        authors: "",
        category: "",
        enabled: obj[key],
      };

      const checkbox = createEl("input", {
        type: "checkbox",
        checked: obj[key],
      });
      checkbox.addEventListener("change", async (e) => {
        obj[key] = (e.target as HTMLInputElement).checked;
        await writeConfig();
        sendNotification("refresh");
      });

      appendUserscriptConfig(meta, checkbox, "styles", cont);
    }
  };

  userscriptsInit(scripts);
  userstylesInit(styles);

  const userscriptsEnabled = createEl(
    "input",
    { type: "checkbox" },
    "",
    [],
  ) as HTMLInputElement;

  userscriptsEnabled!.checked = userScriptsEnabled;
  userscriptsEnabled!.addEventListener("change", async (e) => {
    toggleUserScripts();
    userScriptsConfig.enable = (e.target as HTMLInputElement).checked;
    await writeConfig();
    sendNotification("refresh");
  });

  appendConfig(data[0], userscriptsEnabled);

  const toggleUserScripts = () => {
    const checked = userscriptsEnabled?.checked;
    document
      .querySelector("#userscriptsCont")
      ?.classList.toggle("disabled", !checked);
    document
      .querySelector("#userstylesCont")
      ?.classList.toggle("disabled", !checked);
    for (const item of Array.from(
      document.querySelector("#userscriptsCont")!.querySelectorAll("input"),
    ))
      item.disabled = !checked;
    for (const item of Array.from(
      document.querySelector("#userstylesCont")!.querySelectorAll("input"),
    ))
      item.disabled = !checked;
  };

  toggleUserScripts();
};

export default createUserscriptsSection;
