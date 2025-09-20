import {
  getBadges,
  getUser,
  mainMenuBadge,
  profileMenuBadge,
  gameTDMBadges,
  gameDMBadges,
  escGameBadges,
} from "./badges.js";
import {
  backToKirka,
  setVersions,
  setTrickoLink,
  changeLogo,
  createKDRatio,
  changeSocLinks,
} from "./preloadUtils.js";
import { Config, defaultConfig } from "../utils/config.js";
import { createEl } from "../preload/preloadFunctions.js";
import { ipcRenderer, contextBridge } from "electron";
import { domains } from "../preload/preloadUtils.js";
import { manageFriendsPage } from "./friends.js";
import MenuModal from "../modals/menu/script.js";

import modalStylesString from "../../assets/css/modalStyles.css?raw";
import clientStylesString from "../../assets/css/clientStyles.css?raw";

const config = new Config();

const { enable: enableKeybinding, content } = config.get("keybinding") as {
  enable: boolean;
  content: Record<string, string>;
};
const keybinding = enableKeybinding
  ? content
  : defaultConfig.keybinding.content;

// With contextIsolation: true, window.appconsole is an alternative for window.console
contextBridge.exposeInMainWorld("appconsole", window.console);

const appendStyles = () => {
  const modalStyles = createEl("style");
  modalStyles.innerHTML = modalStylesString;

  const fontURL = "redline://?path=assets/fonts/Roboto.ttf";

  const clientStyles = createEl("style");
  clientStyles.innerHTML =
    clientStylesString +
    `
        @font-face { font-family: "Roboto"; src: url(${fontURL}) format("truetype") }
        .clientModalHint { display: ${config.get("interface.modalHint") ? "block" : "none"} }`;

  const fastCSSStyles = createEl("style", { id: "fastCSSStyles" });
  const fastCSSLink = createEl("link", {
    id: "fastCSSLink",
    rel: "stylesheet",
  }) as HTMLAnchorElement;

  const { enable, url, value } = config.get("fastCSS") as {
    enable: boolean;
    url: string;
    value: string;
  };

  if (enable) {
    fastCSSStyles.innerHTML = value;
    fastCSSLink.href = url;
    document.head.appendChild(fastCSSLink);
  }

  document.head.append(modalStyles, clientStyles, fastCSSStyles);
};

window.addEventListener("DOMContentLoaded", async () => {
  (window as any).trustedTypes.createPolicy("default", {
    createHTML: (html: string) => html,
  });

  backToKirka();
  appendStyles();

  if (!domains.has(window.location.host)) return;

  const menuModal = new MenuModal();
  menuModal.init();
  menuModal.work();

  const app: HTMLElement | null = document.getElementById("app");
  if (!app) return;

  await getUser();
  await getBadges();

  const logoCont = app.querySelector("img.logo#logo") as HTMLImageElement;
  if (logoCont) changeLogo(logoCont);

  const socCont = app.querySelector(".settings-and-socicons") as HTMLElement;
  if (socCont) changeSocLinks(socCont);

  // Modal hint
  const _hint = createEl("div", {}, "clientModalHint", [
    `Press ${keybinding.MenuModal} to open menu`,
  ]);

  if (
    app.querySelector("#left-icons") &&
    !app.querySelector("#left-icons")?.querySelector(".clientModalHint")
  )
    app.querySelector("#left-icons")?.appendChild(_hint);

  ipcRenderer.on(
    "toggle-menu-modal",
    (_, toggle) => (_hint.style.display = toggle ? "block" : "none"),
  );

  // K/D ratio
  ipcRenderer.on("toggle-kd-ratio", () => {
    const cont = document.querySelector(".kd-ratio");
    if (cont) cont.classList.toggle("open");
  });

  // Observers
  const appObserver = new MutationObserver(async () => {
    appObserver.disconnect();

    const logoCont = app.querySelector("img.logo#logo") as HTMLImageElement;
    if (logoCont) changeLogo(logoCont);

    const socCont = app.querySelector(".settings-and-socicons") as HTMLElement;
    if (socCont) changeSocLinks(socCont);

    const profileCont = app.querySelector(".profile-cont") as HTMLElement;
    if (profileCont) {
      setTrickoLink(profileCont);
      profileMenuBadge(profileCont);
    }

    const friendsCont = app.querySelector(".container .friends") as HTMLElement;
    if (friendsCont) manageFriendsPage(friendsCont);

    const tdmCont = app.querySelector(".tab-team-info") as HTMLElement;
    if (tdmCont) gameTDMBadges(tdmCont);
    const dmCont = app.querySelector(".tab-info") as HTMLElement;
    if (dmCont) gameDMBadges(dmCont);
    const parkourCont = app.querySelector(".tab-parkour-info") as HTMLElement;
    if (parkourCont) gameDMBadges(parkourCont);

    const escPlayersCont = app.querySelector(
      ".game-interface .left-container",
    ) as HTMLElement;
    if (escPlayersCont) escGameBadges(escPlayersCont);

    const playerCont = app.querySelector(
      "#team-section > .player-cont",
    ) as HTMLElement;
    if (playerCont) mainMenuBadge(playerCont);

    if (
      app.querySelector("#left-icons") &&
      !app.querySelector("#left-icons")?.querySelector(".clientModalHint")
    )
      app.querySelector("#left-icons")?.appendChild(_hint);

    const kdrCont: HTMLElement | null = app.querySelector(".kill-death");
    if (kdrCont && !kdrCont.dataset.kdrObserved) {
      kdrCont.dataset.kdrObserved = "true";
      await createKDRatio(kdrCont);

      kdrObserver.observe(kdrCont, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    appObserver.observe(app, { childList: true, subtree: true });
  });
  appObserver.observe(app, { childList: true, subtree: true });

  const kdrObserver = new MutationObserver(async () => {
    kdrObserver.disconnect();

    const kdrCont = app.querySelector(".kill-death") as HTMLElement;
    if (!kdrCont) return;

    await createKDRatio(kdrCont);

    kdrObserver.observe(kdrCont, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });

  const overlay = document.getElementById("overlay") as HTMLElement;
  let lastVersionState: boolean | null = null;
  const consoleObserver = new MutationObserver((mut) => {
    // Ping always has textContent
    let isNonEmpty = mut[3].target.textContent !== "";
    if (isNonEmpty === lastVersionState) return;

    lastVersionState = isNonEmpty;
    setVersions(overlay, isNonEmpty);
  });
  consoleObserver.observe(overlay!, { childList: true, subtree: true });

  // Fast CSS
  const fastCSSStyles = document.getElementById("fastCSSStyles") as HTMLElement;
  let fastCSSLink = document.getElementById(
    "fastCSSLink",
  ) as HTMLLinkElement | null;

  ipcRenderer.on("change-fast-css", (_, enable, url, value) => {
    if (!enable) {
      fastCSSStyles.innerHTML = "";
      if (fastCSSLink) {
        fastCSSLink.remove();
        fastCSSLink = null;
      }
      return;
    }

    fastCSSStyles.innerHTML = value;

    if (url) {
      if (!fastCSSLink) {
        fastCSSLink = createEl("link", {
          id: "fastCSSLink",
          rel: "stylesheet",
        }) as HTMLLinkElement;
        document.head.appendChild(fastCSSLink!);
      }
      if (fastCSSLink) fastCSSLink.href = url;
    } else if (fastCSSLink) {
      fastCSSLink.remove();
      fastCSSLink = null;
    }
  });
});

ipcRenderer.on("toggle-window", (_, modal) => {
  // Toggles modals on keybinds
  const openedModal = document.querySelector(".modalWrapper.open");

  // Not in-game
  if (document.querySelector("img.logo#logo")) {
    openedModal?.classList.toggle("open");
    if (openedModal?.id !== modal)
      document.getElementById(modal)?.classList.toggle("open");
    return;
  }

  if (modal === "null")
    document.querySelector(".enmYtp")
      ? document.querySelector("canvas")?.requestPointerLock()
      : document.exitPointerLock();
  if (openedModal) {
    openedModal.classList.toggle("open");
    if (modal === "null" || openedModal.id === modal)
      document.querySelector("canvas")?.requestPointerLock();
    else document.getElementById(modal)?.classList.toggle("open");
  } else if (modal !== "null") {
    document.getElementById(modal)?.classList.toggle("open");
    document.exitPointerLock();
  }
});
