import MenuModal from "../modals/menu/script.js"
import { fromRoot, createEl } from "../utils/functions.js"
import { ipcRenderer } from "electron"
import { readFileSync } from "fs"
import { Config } from "../utils/config.js"

const config = new Config

window.addEventListener("DOMContentLoaded", () => {
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