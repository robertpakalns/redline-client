import { backToKirka, setVersions, setTrickoLink, changeLogo } from "./preloadUtils.js"
import { fromRoot, createEl } from "../utils/functions.js"
import MenuModal from "../modals/menu/script.js"
import { Config } from "../utils/config.js"
import { ipcRenderer } from "electron"
import { readFileSync } from "fs"

const config = new Config

const _console = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    trace: console.trace.bind(console)
}

const appendStyles = () => {
    const modalStyles = document.createElement("style")
    modalStyles.innerHTML = readFileSync(fromRoot("src/modals/style.css"), "utf8")

    const clientStyles = document.createElement("style")
    clientStyles.innerHTML = readFileSync(fromRoot("src/preload/clientStyles.css"), "utf8") + `
        .clientModalHint { display: ${config.get("client.modalHint") ? "block" : "none"} }`

    const fastCSSStyles = document.createElement("style")
    fastCSSStyles.id = "fastCSSStyles"

    const fastCSSLink = document.createElement("link")
    fastCSSLink.id = "fastCSSLink"
    fastCSSLink.rel = "stylesheet"

    const { enable, url, value } = config.get("fastCSS")

    if (enable) {
        fastCSSStyles.innerHTML = value
        fastCSSLink.href = url
        document.head.appendChild(fastCSSLink)
    }

    document.head.append(modalStyles, clientStyles, fastCSSStyles)
}

window.addEventListener("DOMContentLoaded", () => {
    // Return console methods
    console.log = _console.log
    console.warn = _console.warn
    console.error = _console.error
    console.info = _console.info
    console.trace = _console.trace

    ipcRenderer.on("url-change", () => {
        console.log = _console.log
        console.warn = _console.warn
        console.error = _console.error
        console.info = _console.info
        console.trace = _console.trace
    })

    trustedTypes.createPolicy("default", { createHTML: html => html })

    appendStyles()

    const menuModal = new MenuModal
    menuModal.init()
    menuModal.work()

    backToKirka()

    // Modal Hint
    const _hint = createEl("div", {}, "clientModalHint", [`Press ${config.get("keybinding.content.MenuModal")} to open menu`])
    document.querySelector("#app #left-icons").appendChild(_hint)

    ipcRenderer.on("toggle-menu-modal", (_, toggle) => _hint.style.display = toggle ? "block" : "none")

    // Observers
    const observer = new MutationObserver(() => {
        setTrickoLink()
        changeLogo()
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

    if (openedModal) {
        if (modal === "null") openedModal.classList.toggle("open")
        document.getElementById(modal).classList.toggle("open")
    }

    else {
        if (modal === "null") return
        else document.getElementById(modal).classList.toggle("open")
    }
})