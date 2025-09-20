import { createEl, popup } from "../../utils/functions.js";
import { configDir } from "../../utils/config.js";
import { shell, ipcRenderer } from "electron";
import Modal from "../modal.js";
import { join } from "path";

import menuModalHTML from "../../../assets/html/menu.html?raw";
import packageJson from "../../../package.json";

import createCustomizationSection from "./customization.js";
import createUserscriptsSection from "./userscripts.js";
import { generateConfigs } from "./generateConfigs.js";
import createChangelogSection from "./changelog.js";
import createAnalyticsSection from "./analytics.js";
import createSettingsSection from "./settings.js";

class MenuModal extends Modal {
  modalHTMLString = menuModalHTML;

  constructor() {
    super();
  }

  init() {
    super.init();
    this.modal!.id = "menuModal";
  }

  work() {
    generateConfigs();

    const _version = this.modal?.querySelector("#clientVersion") as HTMLElement;
    _version!.textContent = `v${packageJson.version}`;

    const sidebar = document.getElementById("menuSideBar");
    const redlineIcon = sidebar!.querySelector(
      "#redlineIcon",
    ) as HTMLImageElement;
    redlineIcon!.src = "redline://?path=assets/icons/icon.png";

    // Open by default
    this.modal!.querySelector(".mainContentBlock:first-child")!.classList.add(
      "active",
    );
    this.modal!.querySelector(".sideBarItem:first-child")!.classList.add(
      "active",
    );

    for (const item of Array.from(this.modal!.querySelectorAll(".sideBarItem")))
      item.addEventListener("click", (e) => {
        const activeDiv = this.modal?.querySelector(".mainContentBlock.active");
        if (activeDiv) activeDiv.classList.remove("active");

        const activeBar = this.modal?.querySelector(".sideBarItem.active");
        if (activeBar) activeBar.classList.remove("active");
        item.classList.add("active");

        const targetDiv = this.modal?.querySelector(
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
      this.modal!.querySelectorAll(".url"),
    ) as HTMLAnchorElement[])
      el.addEventListener("click", (e) => {
        e.preventDefault();
        shell.openPath(el.href);
      });

    for (const el of Array.from(this.modal!.querySelectorAll(".copy")))
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
      this.modal
        ?.querySelector(`#${key}`)
        ?.addEventListener("click", () =>
          shell.openPath(join(configDir, value)),
        );
  }
}

export default MenuModal;
