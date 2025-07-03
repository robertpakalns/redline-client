import { backToKirka, setVersions, setTrickoLink, changeLogo, createKDRatio } from "./preloadUtils.js"
import { fromRoot, createEl, domains } from "../utils/functions.js"
import { ipcRenderer, contextBridge } from "electron"
import MenuModal from "../modals/menu/script.js"
import { Config, defaultConfig } from "../utils/config.js"
import { readFileSync } from "fs"

const config = new Config

const { enable = enableKeybinding, content } = config.get("keybinding")
const keybinding = enable ? content : defaultConfig.keybinding.content

// With contextIsolation: true, window.appconsole is an alternative for window.console
contextBridge.exposeInMainWorld("appconsole", window.console)

const appendStyles = () => {
    const modalStyles = createEl("style")
    modalStyles.innerHTML = readFileSync(fromRoot("src/modals/style.css"), "utf8")

    const clientStyles = createEl("style")
    clientStyles.innerHTML = readFileSync(fromRoot("src/preload/clientStyles.css"), "utf8") + `
        .clientModalHint { display: ${config.get("interface.modalHint") ? "block" : "none"} }`

    const fastCSSStyles = createEl("style", { id: "fastCSSStyles" })
    const fastCSSLink = createEl("link", { id: "fastCSSLink", rel: "stylesheet" })

    const { enable, url, value } = config.get("fastCSS")

    if (enable) {
        fastCSSStyles.innerHTML = value
        fastCSSLink.href = url
        document.head.appendChild(fastCSSLink)
    }

    document.head.append(modalStyles, clientStyles, fastCSSStyles)
}

window.addEventListener("DOMContentLoaded", () => {
    trustedTypes.createPolicy("default", { createHTML: html => html })
    backToKirka()
    appendStyles()

    if (!domains.has(window.location.host)) return

    const menuModal = new MenuModal
    menuModal.init()
    menuModal.work()

    const app = document.getElementById("app")

    // Modal hint
    const _hint = createEl("div", {}, "clientModalHint", [`Press ${keybinding.MenuModal} to open menu`])
    app.querySelector("#left-icons").appendChild(_hint)

    ipcRenderer.on("toggle-menu-modal", (_, toggle) => _hint.style.display = toggle ? "block" : "none")

    // K/D ratio
    ipcRenderer.on("toggle-kd-ratio", () => {
        const cont = document.querySelector(".kd-ratio")
        if (cont) cont.classList.toggle("open")
    })

    // Observers
    const appObserver = new MutationObserver(() => {
        const logoCont = app.querySelector("img.logo#logo")
        if (logoCont) changeLogo(logoCont)

        const profileCont = app.querySelector(".profile-cont")
        if (profileCont) setTrickoLink(profileCont)

        const kdrCont = app.querySelector(".kill-death")
        if (kdrCont && !kdrCont.dataset.kdrObserved) {
            kdrCont.dataset.kdrObserved = "true"
            createKDRatio(kdrCont)

            kdrObserver.observe(kdrCont, { childList: true, subtree: true, characterData: true })
        }

    })
    appObserver.observe(app, { childList: true, subtree: true })

    const kdrObserver = new MutationObserver(() => {
        kdrObserver.disconnect()

        const kdrCont = app.querySelector(".kill-death")
        if (!kdrCont) return

        createKDRatio(kdrCont)

        kdrObserver.observe(kdrCont, { childList: true, subtree: true, characterData: true })
    })

    const overlay = document.getElementById("overlay")
    let lastVersionState = null
    const consoleObserver = new MutationObserver(mut => {
        // Ping always has textContent
        let isNonEmpty = mut[3].target.textContent !== ""
        if (isNonEmpty === lastVersionState) return

        lastVersionState = isNonEmpty
        setVersions(overlay, isNonEmpty)
    })
    consoleObserver.observe(overlay, { childList: true, subtree: true })

    // Fast CSS
    const fastCSSStyles = document.getElementById("fastCSSStyles")
    let fastCSSLink = document.getElementById("fastCSSLink")

    ipcRenderer.on("change-fast-css", (_, enable, url, value) => {
        if (!enable) {
            fastCSSStyles.innerHTML = ""
            if (fastCSSLink) {
                fastCSSLink.remove()
                fastCSSLink = null
            }
            return
        }

        fastCSSStyles.innerHTML = value

        if (url) {
            if (!fastCSSLink) {
                fastCSSLink = createEl("link", { id: "fastCSSLink", rel: "stylesheet" })
                document.head.appendChild(fastCSSLink)
            }
            fastCSSLink.href = url
        }
        else if (fastCSSLink) {
            fastCSSLink.remove()
            fastCSSLink = null
        }
    })
})

ipcRenderer.on("toggle-window", (_, modal) => { // Toggles modals on keybinds
    const openedModal = document.querySelector(".modalWrapper.open")

    // Not in-game
    if (document.querySelector("img.logo#logo")) {
        openedModal?.classList.toggle("open")
        if (openedModal?.id !== modal) document.getElementById(modal)?.classList.toggle("open")
        return
    }

    if (modal === "null") document.querySelector(".enmYtp") ? document.querySelector("canvas").requestPointerLock() : document.exitPointerLock()
    if (openedModal) {
        openedModal.classList.toggle("open")
        if (modal === "null" || openedModal.id === modal) document.querySelector("canvas").requestPointerLock()
        else document.getElementById(modal).classList.toggle("open")
    }
    else if (modal !== "null") {
        document.getElementById(modal).classList.toggle("open")
        document.exitPointerLock()
    }
})