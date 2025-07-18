import { ipcRenderer } from "electron"

let loaded = false
const createSettingsSection = (cont: HTMLElement): void => {
    if (loaded) return
    loaded = true

    // Join game URL
    const _currentURL = cont.querySelector("#currentURL") as HTMLInputElement
    ipcRenderer.on("update-url", (_, url) => _currentURL!.innerText = url || "Unknown URL")
    ipcRenderer.send("update-url")

    const joinLinkURL = cont.querySelector("#joinLinkURL") as HTMLInputElement
    const joinByURL = () => ipcRenderer.send("join-game", joinLinkURL?.value)
    cont.querySelector("#joinLink")?.addEventListener("click", joinByURL)
    joinLinkURL?.addEventListener("keydown", e => {
        if ((e.key) !== "Enter") return
        e.preventDefault()
        joinByURL()
    })

    // Toggle
    const toggleObject = {
        modalHint: "toggle-menu-modal",
        kdRatio: "toggle-kd-ratio"
    }
    for (const [id, event] of Object.entries(toggleObject))
        cont.querySelector(`#${id}`)?.addEventListener("change", e => ipcRenderer.send(event, (e.target as HTMLInputElement).checked))

    // Settings
    const settingsObject = {
        relaunch: "relaunch",
        importClientSettings: "import-client-settings",
        exportClientSettings: "export-client-settings"
    }
    for (const [id, event] of Object.entries(settingsObject))
        cont.querySelector(`#${id}`)?.addEventListener("click", () => ipcRenderer.send(event))
}

export default createSettingsSection