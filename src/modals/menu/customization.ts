import { createEl, restartMessage } from "../../preload/preloadFunctions.js";
import { config } from "../../preload/preloadUtils.js";
import { ipcRenderer } from "electron";

let loaded = false;
const createCustomizationSection = async (cont: HTMLElement): Promise<void> => {
  if (loaded) return;
  loaded = true;

  // Fast CSS
  const fastCSSURL = cont.querySelector("#fastCSSURL") as HTMLInputElement;
  fastCSSURL?.addEventListener(
    "change",
    async (e) =>
      await config.set("fastCSS.url", (e.target as HTMLInputElement).value),
  );
  fastCSSURL!.value = (await config.get("fastCSS.url")) as string;

  const fastCSSValue = cont.querySelector(
    "#fastCSSValue",
  ) as HTMLTextAreaElement;
  fastCSSValue?.addEventListener(
    "input",
    async (e) =>
      await config.set("fastCSS.value", (e.target as HTMLInputElement).value),
  );
  fastCSSValue!.value = (await config.get("fastCSS.value")) as string;

  const enableFastCSS = cont.querySelector(
    "#enableFastCSS",
  ) as HTMLInputElement;

  for (const id of ["enableFastCSS", "fastCSSURL", "fastCSSValue"]) {
    const eventType = id === "enableFastCSS" ? "change" : "input";
    cont.querySelector(`#${id}`)?.addEventListener(eventType, () => {
      ipcRenderer.send(
        "change-fast-css",
        enableFastCSS.checked,
        fastCSSURL.value,
        fastCSSValue.value,
      );
    });
  }

  const toggleFastCSS = () => {
    const checked = enableFastCSS?.checked;
    fastCSSURL.disabled = !checked;
    fastCSSValue.disabled = !checked;
    fastCSSURL.classList.toggle("disabled", !checked);
    fastCSSValue.classList.toggle("disabled", !checked);
  };

  toggleFastCSS();
  enableFastCSS.addEventListener("change", toggleFastCSS);

  // Keybinding
  const keybindingCont = cont.querySelector("#keybindingBody") as HTMLElement;
  const keybindingRow = (name: string, key: string): void => {
    const _inputChild = createEl("input", {
      type: "text",
      value: key,
    }) as HTMLInputElement;
    _inputChild.addEventListener("keydown", async (e) => {
      e.preventDefault();
      _inputChild.value = e.code;
      await config.set(`keybinding.content.${name}`, e.code);
      restartMessage();
    });

    const _name = createEl("td", { textContent: name });
    const _input = createEl("td", {}, "", [_inputChild]);
    const tr = createEl("tr", {}, "", [_name, _input]);

    keybindingCont.appendChild(tr);
  };

  const { content: c2 } = (await config.get("keybinding")) as {
    content: Record<string, string>;
  };
  if (keybindingCont.children.length === 0)
    for (const key in c2) keybindingRow(key, c2[key]);

  const _enableKeybinding = cont.querySelector(
    "#enableKeybinding",
  ) as HTMLInputElement;
  const _keybindingTable = cont.querySelector(
    "#keybindingTable",
  ) as HTMLElement;

  const toggleKeybinding = () => {
    const checked = _enableKeybinding.checked;
    _keybindingTable.classList.toggle("disabled", !checked);
    for (const item of Array.from(_keybindingTable.querySelectorAll("input")))
      item.disabled = !checked;
  };

  toggleKeybinding();
  _enableKeybinding.addEventListener("change", toggleKeybinding);
};

export default createCustomizationSection;
