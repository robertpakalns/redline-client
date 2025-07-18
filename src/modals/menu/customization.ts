import { createEl, restartMessage } from "../../utils/functions"
import { Config } from "../../utils/config"
import { ipcRenderer } from "electron"

import createUserscriptsBlock from "./userscripts"

const config = new Config

let loaded = false
const createCustomizationSection = (cont: HTMLElement): void => {
    if (loaded) return
    loaded = true

    // Userscripts
    createUserscriptsBlock()
}

export default createCustomizationSection