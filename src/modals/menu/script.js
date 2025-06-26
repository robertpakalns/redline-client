import packageJson from "../../../package.json" with { type: "json" }
import { fromRoot, createEl, domains, getHost } from "../../utils/functions.js"
import { Config, configDir } from "../../utils/config.js"
import createChangelogSection from "./changelog.js"
import { shell, ipcRenderer } from "electron"
import Modal from "../modal.js"
import { join } from "path"

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
        sidebar.querySelector("#redlineIcon").src = fromRoot("assets/icons/icon.png")

        this.modal.querySelector("#menuMainContent > div[name='settingsSection']").classList.add("active") // Open by default

        for (const item of this.modal.querySelectorAll(".sideBarItem")) item.addEventListener("click", e => {
            const activeDiv = this.modal.querySelector(".mainContentBlock.active")
            if (activeDiv) activeDiv.classList.remove("active")

            const targetDiv = this.modal.querySelector(`#menuMainContent > div[name="${e.target.id}"]`)
            if (targetDiv) targetDiv.classList.add("active")

            // Load changelog data only when needed
            if (targetDiv.getAttribute("name") === "changelogSection") createChangelogSection()
        })

        for (const el of this.modal.querySelectorAll(".url")) el.addEventListener("click", e => {
            e.preventDefault()
            shell.openPath(el.href)
        })

        // Update client
        ipcRenderer.on("client-update", (_, data) => {
            if (data === null) {
                // popup("rgb(45, 206, 72)", "Update available!")
            }
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

        // FPS uncap works only on Windows
        if (process.platform === "win32") document.getElementById("fpsUncapWarning").style.display = "none"

        document.getElementById("modalHint").addEventListener("change", e => ipcRenderer.send("toggle-menu-modal", e.target.checked))
        document.getElementById("kdRatio").addEventListener("change", e => ipcRenderer.send("toggle-kd-ratio", e.target.checked))

        document.getElementById("relaunch").addEventListener("click", () => ipcRenderer.send("relaunch"))

        const openFromShell = {
            configFolder: "config.json",
            userscriptsFolder: "scripts",
            userstylesFolder: "styles",
            swapperFolder: "swapper"
        }

        for (const [key, value] of Object.entries(openFromShell))
            this.modal.querySelector(`#${key}`).addEventListener("click", () => shell.openPath(join(configDir, value)))

        // Keybinding
        const keybindingCont = this.modal.querySelector("#keybindingBody")
        const keybindingRow = (name, key) => {
            const _inputChild = createEl("input", { type: "text", value: key })
            _inputChild.addEventListener("keydown", e => {
                e.preventDefault()
                _inputChild.value = e.code
                config.set(`keybinding.content.${name}`, e.code)
            })

            const _name = createEl("td", { textContent: name })
            const _input = createEl("td", {}, "", [_inputChild])
            const tr = createEl("tr", {}, "", [_name, _input])

            keybindingCont.appendChild(tr)
        }

        const { content: c2 } = config.get("keybinding")
        for (const key in c2) keybindingRow(key, c2[key])

        const _enableKeybinding = document.getElementById("enableKeybinding")
        const _keybindingTable = document.getElementById("keybindingTable")

        const toggleKeybinding = () => {
            const checked = _enableKeybinding.checked
            _keybindingTable.classList.toggle("disabled", !checked)
            for (const item of _keybindingTable.querySelectorAll("input")) item.disabled = !checked
        }

        toggleKeybinding()
        _enableKeybinding.addEventListener("change", toggleKeybinding)

        // Fast CSS
        const fastCSSURL = this.modal.querySelector("#fastCSSURL")
        fastCSSURL.addEventListener("change", e => config.set("fastCSS.url", e.target.value))
        fastCSSURL.value = config.get("fastCSS.url")

        const fastCSSValue = this.modal.querySelector("#fastCSSValue")
        fastCSSValue.addEventListener("input", e => config.set("fastCSS.value", e.target.value))
        fastCSSValue.value = config.get("fastCSS.value")

        const enableFastCSS = this.modal.querySelector("#enableFastCSS")

        for (const id of ["enableFastCSS", "fastCSSURL", "fastCSSValue"]) {
            const eventType = id === "enableFastCSS" ? "change" : "input"
            this.modal.querySelector(`#${id}`).addEventListener(eventType, () => {
                ipcRenderer.send("change-fast-css", enableFastCSS.checked, fastCSSURL.value, fastCSSValue.value)
            })
        }

        // Domains
        const domainSelect = this.modal.querySelector("#gameDomain")
        domainSelect.addEventListener("change", e => config.set("client.domain", e.target.value))
        for (const el of domains) {
            const option = createEl("option", { value: el }, "", [el])
            domainSelect.appendChild(option)
        }
        domainSelect.value = getHost()

        // Import/export settings
        const settingsObject = {
            importClientSettings: "import-client-settings",
            exportClientSettings: "export-client-settings"
        }
        for (const [id, event] of Object.entries(settingsObject))
            this.modal.querySelector(`#${id}`).addEventListener("click", () => ipcRenderer.send(event))
    }
}

export default MenuModal