import Modal from "../modal.js"
import { fromRoot } from "../../utils/functions.js"

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
        const sidebar = document.getElementById("menuSideBar")

        const icon = sidebar.querySelector("#redlineIcon")
        icon.src = fromRoot("assets/icons/icon.png")

        this.modal.querySelector("#menuMainContent > div[name='settingsSection']").classList.add("active") // Open by default


        for (const item of this.modal.querySelectorAll(".sideBarItem")) item.addEventListener("click", e => {
            const activeDiv = this.modal.querySelector(".mainContentBlock.active")
            if (activeDiv) activeDiv.classList.remove("active")

            const targetDiv = this.modal.querySelector(`#menuMainContent > div[name="${e.target.id}"]`)
            if (targetDiv) targetDiv.classList.add("active")
        })
    }
}

export default MenuModal