import MenuModal from "../modals/menu/script.js"
import { fromRoot } from "../utils/functions.js"
import { ipcRenderer } from "electron"
import { readFileSync } from "fs"

window.addEventListener("DOMContentLoaded", () => {
    const modalStyles = document.createElement("style")
    modalStyles.innerHTML = readFileSync(fromRoot("src/modals/style.css"), "utf8")
    document.head.appendChild(modalStyles)

    const menuModal = new MenuModal
    menuModal.init()
    menuModal.work()
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