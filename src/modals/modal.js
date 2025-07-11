import { createEl } from "../utils/functions.js"
import { readFileSync } from "fs"

class Modal {

    constructor() {
        this.modal = null
        this.modalHTMLPath = null
    }

    init() {
        const modalHTML = readFileSync(this.modalHTMLPath, "utf8")
        this.modal = createEl("div", { innerHTML: modalHTML }, "modalWrapper")
        document.body.appendChild(this.modal)

        const close = createEl("div", {}, "close", ["×"])
        const overlay = createEl("div", {}, "overlay")

        this.modal.prepend(overlay)
        this.modal.querySelector(".modal").prepend(close)

        const toggle = () => this.modal.classList.toggle("open")
        close.addEventListener("click", toggle)
        overlay.addEventListener("click", toggle)
    }
}

export default Modal