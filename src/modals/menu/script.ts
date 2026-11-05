import { createEl, popup } from "../../preload/preloadFunctions";
import { ipcRenderer } from "electron";
import Modal from "../modal";

import menuModalHTML from "../../../js-dist/menu.html?raw";

import createCustomizationSection from "./customization";
import createUserscriptsSection from "./userscripts";
import { generateConfigs } from "./generateConfigs";
import createChangelogSection from "./changelog";
import createAnalyticsSection from "./analytics";
import createSettingsSection from "./settings";
import { getVersions } from "../../preload/preloadUtils";

class MenuModal extends Modal {
  constructor() {
    super(menuModalHTML, "menuModal");
  }

  async work() {
    generateConfigs();

    const _version = this.cont.querySelector("#clientVersion") as HTMLElement;
    _version!.textContent = (await getVersions()).REDLINE_CLIENT;

    // Open by default
    this.cont
      .querySelector(".mainContentBlock:first-child")!
      .classList.add("active");
    this.cont
      .querySelector(".sideBarItem:first-child")!
      .classList.add("active");

    const defaultSection = this.cont.querySelector(
      "#menuMainContent > div[name='settingsSection']",
    );
    createSettingsSection(defaultSection as HTMLElement);

    for (const item of Array.from(this.cont.querySelectorAll(".sideBarItem")))
      item.addEventListener("click", (e) => {
        const activeDiv = this.cont.querySelector(".mainContentBlock.active");
        if (activeDiv) activeDiv.classList.remove("active");

        const activeBar = this.cont.querySelector(".sideBarItem.active");
        if (activeBar) activeBar.classList.remove("active");
        item.classList.add("active");

        const targetDiv = this.cont.querySelector(
          `#menuMainContent > div[name="${(e.target as HTMLElement)?.id}"]`,
        ) as HTMLElement;
        if (targetDiv) targetDiv.classList.add("active");

        // Load sections only when needed
        switch (targetDiv?.getAttribute("name")) {
          case "changelogSection":
            createChangelogSection();
            break;
          case "analyticsSection":
            createAnalyticsSection(targetDiv);
            break;
          case "settingsSection":
            createSettingsSection(targetDiv);
            break;
          case "customizationSection":
            createCustomizationSection(targetDiv);
            break;
          case "userscriptsSection":
            createUserscriptsSection();
            break;
        }
      });

    for (const el of Array.from(
      this.cont.querySelectorAll(".url"),
    ) as HTMLAnchorElement[])
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        await ipcRenderer.invoke("shell-open-external", el.href);
      });

    for (const el of Array.from(this.cont.querySelectorAll(".copy")))
      el.addEventListener("click", (e) => {
        navigator.clipboard.writeText((e.target as HTMLElement).innerText);
        popup("rgb(206, 185, 45)", "Copied!");
      });

    // Update client
    ipcRenderer.on("client-update", (_, data) => {
      if (data === null) popup("rgb(45, 206, 72)", "Update available!");
      else if (data === true) {
        const _updateButton = createEl(
          "button",
          { textContent: "Update!" },
          "clientUpdateButton",
        );
        _updateButton.addEventListener("click", () => {
          ipcRenderer.send("client-update", "update");
          _version!.innerText = "Updating...";
        });
        _version.innerText = "";
        _version.appendChild(_updateButton);
      } else _version.innerText = `Downloading... ${Math.round(data.percent)}%`;
    });

    // Open directories/files
    const openFromShell = {
      configFolder: "config.json",
      userscriptsFolder: "scripts",
      userstylesFolder: "styles",
      swapperFolder: "swapper",
    };
    for (const [key, value] of Object.entries(openFromShell))
      this.cont
        .querySelector(`#${key}`)
        ?.addEventListener(
          "click",
          async () =>
            await ipcRenderer.invoke(
              "shell-open-path",
              await ipcRenderer.invoke("from-config-dir", value),
            ),
        );
  }
}

export default MenuModal;
