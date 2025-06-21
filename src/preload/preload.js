import MenuModal from "../modals/menu/script.js"
import { fromRoot, createEl } from "../utils/functions.js"
import { ipcRenderer, shell } from "electron"
import { readFileSync } from "fs"
import { Config } from "../utils/config.js"
import packageJson from "../../package.json" with { type: "json" }

const config = new Config

const _console = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    trace: console.trace.bind(console)
}

window.addEventListener("DOMContentLoaded", () => {
    // Return console methods
    console.log = _console.log
    console.warn = _console.warn
    console.error = _console.error
    console.info = _console.info
    console.trace = _console.trace

    trustedTypes.createPolicy("default", { createHTML: html => html })

    const modalStyles = document.createElement("style")
    modalStyles.innerHTML = readFileSync(fromRoot("src/modals/style.css"), "utf8")
    document.head.appendChild(modalStyles)

    const clientStyles = document.createElement("style")
    clientStyles.innerHTML = readFileSync(fromRoot("src/preload/clientStyles.css"), "utf8") + `
        .clientModalHint { display: ${config.get("client.modalHint") ? "block" : "none"} }
    `
    document.head.appendChild(clientStyles)

    const menuModal = new MenuModal
    menuModal.init()
    menuModal.work()

    // Go back to Kirka from Auth page
    const authDomains = new Set([
        "www.facebook.com",
        "accounts.google.com",
        "appleid.apple.com",
        "id.twitch.tv",
        "discord.com",
        "id.vk.com"
    ])

    if (authDomains.has(window.location.host)) {
        const _back = createEl("div", {}, "backToKirka", ["Back to Kirka"])
        _back.addEventListener("click", () => window.location.href = "https://kirka.io")
        document.body.appendChild(_back)
    }

    // Modal Hint
    const _hint = createEl("div", {}, "clientModalHint", [`Press ${config.get("keybinding.content.MenuModal")} to open menu`])
    document.querySelector("#app #left-icons").appendChild(_hint)

    ipcRenderer.on("toggle-menu-modal", (_, toggle) => _hint.style.display = toggle ? "block" : "none")

    // Console
    const versions = {
        CHROMIUM: process.versions.chrome,
        ELECTRON: process.versions.electron,
        NODE: process.versions.node,
        CLIENT: packageJson.version
    }

    const setVersions = toggle => {
        const versionOverlay = document.getElementById("overlay")
        if (versionOverlay) {
            for (const [key, value] of Object.entries(versions)) {
                const el = document.getElementById(key)
                if (el) el.style.display = toggle ? "block" : "none"
                else {
                    const _span = createEl("span", { id: key }, "", [`${key} v${value}`])

                    const _div = createEl("div", {}, "", [_span])
                    versionOverlay.appendChild(_div)
                }
            }
        }
    }

    // Tricko links in profile
    const setTrickoLink = () => {
        const playerProfileCont = document.querySelector(".profile-cont")
        if (!playerProfileCont) return

        if (document.querySelector(".playerTrickoLink")) return

        const playerIDCont = playerProfileCont.querySelector(".copy-cont .value")
        if (!playerIDCont) return

        const playerID = playerIDCont.innerHTML
        const trickoLink = `https://tricko.pro/kirka/player/${decodeURIComponent(playerID.replace("#", ""))}`

        const bottomCont = playerProfileCont.querySelector(".bottom")
        if (!bottomCont) return

        const copiedNode = bottomCont.childNodes[1].cloneNode(true)
        copiedNode.classList.add("playerTrickoLink")
        copiedNode.textContent = "TRICKO"
        copiedNode.addEventListener("click", () => shell.openExternal(trickoLink))

        bottomCont.prepend(copiedNode)
    }

    const observer = new MutationObserver(() => {
        console.log("setting tricko links...")
        setTrickoLink()
    })
    observer.observe(document.getElementById("app"), { childList: true, subtree: true })

    const consoleObserver = new MutationObserver(() => {
        const versionElement = document.querySelector("#overlay #version")
        if (versionElement) {
            const currentEmpty = versionElement.textContent === ""
            setVersions(!currentEmpty)
        }

    })
    consoleObserver.observe(document.getElementById("overlay"), { childList: true, subtree: true, characterData: true })
})


ipcRenderer.on("toggle-window", (_, modal) => { // Toggles modals on keybinds
    const openedModal = document.querySelector(".modalWrapper.open")

    if (openedModal) {
        if (modal === "null") openedModal.classList.toggle("open")
        document.getElementById(modal).classList.toggle("open")
    }

    else {
        if (modal === "null") return
        else document.getElementById(modal).classList.toggle("open")
    }
})