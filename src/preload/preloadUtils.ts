import { createEl, isNum } from "../preload/preloadFunctions.js";
import { ipcRenderer } from "electron";

// Kirka.io Domains
export const domains = new Set<string>([
  "kirka.io",
  "snipers.io",
  "ask101math.com",
  "fpsiogame.com",
  "cloudconverts.com",
]);

const getHostRenderer = async (): Promise<string> => {
  const host = (await config.get("client.domain")) as string;
  return domains.has(host) ? host : "kirka.io";
};

// Configs
export const config = {
  get: (key: string) => ipcRenderer.invoke("config-get", key),
  set: (key: string, value: string | boolean) =>
    ipcRenderer.invoke("config-set", key, value),
};

export const backToKirka = (): void => {
  if (domains.has(window.location.host)) return;

  const _back = createEl("div", {}, "backToKirka", ["Back to Kirka"]);
  _back.addEventListener(
    "click",
    async () => (window.location.href = `https://${await getHostRenderer()}`),
  );
  document.body.appendChild(_back);
};

// In-game console versions
let versionsCache: Record<string, string>;

export const getVersions = async (): Promise<Record<string, string>> => {
  if (!versionsCache) {
    versionsCache = await ipcRenderer.invoke("get-app-info");
  }
  return versionsCache;
};

export const setVersions = async (cont: HTMLElement, toggle: boolean) => {
  if (!cont) return;
  const versions = await getVersions();

  for (const [key, value] of Object.entries(versions)) {
    const el = cont.querySelector(`#${key}`) as HTMLElement;
    if (el) {
      el.style.display = toggle ? "block" : "none";
      continue;
    }

    const _span = createEl("span", { id: key }, "", [
      `${key.replace("_", " ")}: ${value}`,
    ]);
    const _div = createEl("div", {}, "", [_span]);
    cont.appendChild(_div);
  }
};

// Tricko links in profile
export const setTrickoLink = (cont: HTMLElement): void => {
  if (!cont) return;

  if (cont.querySelector(".playerTrickoLink")) return;

  const idCont = cont.querySelector(".copy-cont .value");
  if (!idCont) return;

  const bottomCont = cont.querySelector(".bottom");
  if (!bottomCont) return;

  const children = Array.from(bottomCont.childNodes).filter(
    (node) => node instanceof HTMLElement,
  );
  const copiedNode = children[0]?.cloneNode(true) as HTMLElement;
  if (!copiedNode) return;

  copiedNode.classList.add("playerTrickoLink");
  copiedNode.textContent = "TRICKO";
  copiedNode.addEventListener("click", async () => {
    const playerID = encodeURIComponent(idCont.innerHTML.replace("#", ""));
    const trickoLink = `https://tricko.pro/kirka/player/${playerID}`;
    await ipcRenderer.invoke("shell-open-external", trickoLink);
  });

  bottomCont.prepend(copiedNode);
};

export const changeSocLinks = (cont: HTMLElement): void => {
  const btns = cont.querySelectorAll(".card-cont.soc-group");
  if (
    btns.length === 0 ||
    cont.querySelector("#redline-discord") ||
    cont.querySelector("#redline-download")
  )
    return;

  const discordButton = btns[0].cloneNode(true) as HTMLButtonElement;
  discordButton.id = "redline-discord";
  discordButton.className = "card-cont soc-group";
  const discordButtonImg = createEl("img", {
    src: "redline://local?path=assets/icons/discord.svg",
  });
  discordButton.querySelector("svg")!.replaceWith(discordButtonImg);
  discordButton.onclick = () =>
    ipcRenderer.invoke("shell-open-external", "https://discord.gg/cTE6CVuGen");

  btns[0].replaceWith(discordButton);

  const trickoButton = btns[1].cloneNode(true) as HTMLButtonElement;
  trickoButton.id = "redline-download";
  trickoButton.className = "card-cont soc-group";
  const trickoButtonImg = createEl("img", {
    src: "redline://local?path=assets/icons/tricko.svg",
  });
  trickoButton.querySelector("svg")!.replaceWith(trickoButtonImg);
  trickoButton.onclick = () =>
    ipcRenderer.invoke("shell-open-external", "https://tricko.pro/redline");

  const texts = Array.from(
    trickoButton.querySelector(".text-soc")!.children,
  ) as HTMLLinkElement[];
  texts[0].innerText = "REDLINE";
  texts[1].innerText = "TRICKO PAGE";

  btns[1].replaceWith(trickoButton);
};
