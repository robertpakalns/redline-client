import packageJson from "../../../package.json" with { type: "json" }
import { fromRoot, createEl } from "../../utils/functions.js"
import { Config } from "../../utils/config.js"
import { shell, ipcRenderer } from "electron"
import Modal from "../modal.js"

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
            swapper: "client.swapper"
        }
        for (const [id, conf] of Object.entries(settingsObj)) {
            document.getElementById(id).checked = config.get(conf)
            document.getElementById(id).addEventListener("change", e => config.set(conf, e.target.checked))
        }

        document.getElementById("relaunch").addEventListener("click", () => ipcRenderer.send("relaunch"))
    }
}

export default MenuModal