import { fromRoot, createEl, popup, restartMessage } from "../../utils/functions.js"
import packageJson from "../../../package.json" with { type: "json" }
import { Config, configDir } from "../../utils/config.js"
import { shell, ipcRenderer } from "electron"
import Modal from "../modal.js"
import { join } from "path"

import createCustomizationSection from "./customization.js"
import createChangelogSection from "./changelog.js"
import createAnalyticsSection from "./analytics.js"
import createSettingsSection from "./settings.js"

const config = new Config

class MenuModal extends Modal {
    constructor() {
        super()
        this.modalHTMLPath = fromRoot("src/modals/menu/index.html")
    }

    init() {
        super.init()
        this.modal.id = "menuModal"
    }

    work() {
        const _version = this.modal.querySelector("#clientVersion")
        _version.textContent = `v${packageJson.version}`

        const sidebar = document.getElementById("menuSideBar")
        sidebar.querySelector("#redlineIcon").src = "redline://?path=assets/icons/icon.png"

        // Open settings by default
        const defaultSection = this.modal.querySelector("#menuMainContent > div[name='settingsSection']")
        createSettingsSection(defaultSection)
        defaultSection.classList.add("active")

        for (const item of this.modal.querySelectorAll(".sideBarItem")) item.addEventListener("click", e => {
            const activeDiv = this.modal.querySelector(".mainContentBlock.active")
            if (activeDiv) activeDiv.classList.remove("active")

            const targetDiv = this.modal.querySelector(`#menuMainContent > div[name="${e.target.id}"]`)
            if (targetDiv) targetDiv.classList.add("active")

            // Load sections only when needed
            switch (targetDiv.getAttribute("name")) {
                case "changelogSection": createChangelogSection(); break
                case "analyticsSection": createAnalyticsSection(); break
                case "settingsSection": createSettingsSection(targetDiv); break
                case "customizationSection": createCustomizationSection(targetDiv); break
            }
        })

        for (const el of this.modal.querySelectorAll(".url")) el.addEventListener("click", e => {
            e.preventDefault()
            shell.openPath(el.href)
        })

        for (const el of this.modal.querySelectorAll(".copy")) el.addEventListener("click", e => {
            navigator.clipboard.writeText(e.target.innerText)
            popup("rgb(206, 185, 45)", "Copied!")
        })

        // Restart notifications
        const restartNotifications = ["fpsUncap", "adblocker", "fullscreen", "swapper", "drpcJoinButton", "enableKeybinding"]
        for (const id of restartNotifications)
            this.modal.querySelector(`#${id}`).addEventListener("click", restartMessage)

        // Update client
        ipcRenderer.on("client-update", (_, data) => {
            if (data === null) popup("rgb(45, 206, 72)", "Update available!")
            else if (data === true) {
                const _updateButton = createEl("button", { textContent: "Update!" })
                _updateButton.addEventListener("click", () => {
                    ipcRenderer.send("client-update", "update")
                    _version.innerText = "Updating..."
                })
                _version.innerText = ""
                _version.appendChild(_updateButton)
            }
            else _version.innerText = `Downloading... ${Math.round(data.percent)}%`
        })

        // Open directories/files
        const openFromShell = {
            configFolder: "config.json",
            userscriptsFolder: "scripts",
            userstylesFolder: "styles",
            swapperFolder: "swapper"
        }

        for (const [key, value] of Object.entries(openFromShell))
            this.modal.querySelector(`#${key}`).addEventListener("click", () => shell.openPath(join(configDir, value)))

        // Settings
        const settingsObj = {
            fpsUncap: "client.fpsUncap",
            adblocker: "client.adblocker",
            fullscreen: "client.fullscreen",
            swapper: "client.swapper",

            modalHint: "interface.modalHint",
            kdRatio: "interface.kdRatio",

            drpcJoinButton: "discord.joinButton",

            enableKeybinding: "keybinding.enable",

            enableFastCSS: "fastCSS.enable"
        }
        for (const [id, conf] of Object.entries(settingsObj)) {
            document.getElementById(id).checked = config.get(conf)
            document.getElementById(id).addEventListener("change", e => config.set(conf, e.target.checked))
        }
    }
}

export default MenuModal