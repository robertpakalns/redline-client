import { createEl, domains, getHost, restartMessage } from "../../utils/functions.js"
import { Config } from "../../utils/config.js"
import { ipcRenderer } from "electron"

const config = new Config

const createSettingsSection = cont => {

    // FPS uncap works only on Windows
    if (process.platform === "win32") cont.querySelector("#fpsUncapWarning").style.display = "none"

    // Join game URL
    const _currentURL = cont.querySelector("#currentURL")
    ipcRenderer.on("update-url", (_, url) => _currentURL.innerText = url || "Unknown URL")
    ipcRenderer.send("update-url")

    const joinLinkURL = cont.querySelector("#joinLinkURL")
    const joinByURL = () => ipcRenderer.send("join-game", joinLinkURL.value)
    cont.querySelector("#joinLink").addEventListener("click", joinByURL)
    joinLinkURL.addEventListener("keydown", e => {
        if (e.key !== "Enter") return
        e.preventDefault()
        joinByURL()
    })

    // Domains
    const domainSelect = cont.querySelector("#gameDomain")
    domainSelect.addEventListener("change", e => {
        config.set("client.domain", e.target.value)
        restartMessage()
    })
    for (const el of domains) {
        const option = createEl("option", { value: el }, "", [el])
        domainSelect.appendChild(option)
    }
    domainSelect.value = getHost()

    // Interface
    cont.querySelector("#modalHint").addEventListener("change", e => ipcRenderer.send("toggle-menu-modal", e.target.checked))
    cont.querySelector("#kdRatio").addEventListener("change", e => ipcRenderer.send("toggle-kd-ratio", e.target.checked))

    // Import/export settings
    const settingsObject = {
        importClientSettings: "import-client-settings",
        exportClientSettings: "export-client-settings"
    }
    for (const [id, event] of Object.entries(settingsObject))
        cont.querySelector(`#${id}`).addEventListener("click", () => ipcRenderer.send(event))

    // Relaunch
    cont.querySelector("#relaunch").addEventListener("click", () => ipcRenderer.send("relaunch"))
}

export default createSettingsSection