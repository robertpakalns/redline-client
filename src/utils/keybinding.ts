import { Config, defaultConfig } from "./config.js"
import { app, BrowserWindow } from "electron"

const config = new Config
const keybindings = config.get("keybinding.enable") ? config.get("keybinding.content") : defaultConfig.keybinding.content
const { CloseModal, MenuModal, Reload, Fullscreen, DevTools } = keybindings as {
    CloseModal: string
    MenuModal: string
    Reload: string
    Fullscreen: string
    DevTools: string
}
const keySet = new Set([MenuModal, Reload, Fullscreen, DevTools])

const keybinding = (win: BrowserWindow): void => {
    const { webContents } = win

    webContents.on("before-input-event", (e, input) => {
        if (keySet.has(input.code)) e.preventDefault()

        if (input.code === "F4" && input.alt) {
            e.preventDefault()
            app.quit()
        }

        if (input.control && input.shift && input.key.toLowerCase() === "c") {
            e.preventDefault()
            webContents.toggleDevTools()
        }

        switch (input.code) {
            case CloseModal: webContents.send("toggle-window", "null"); break
            case MenuModal: webContents.send("toggle-window", "menuModal"); break
            case Reload: webContents.reload(); break
            case Fullscreen: win.setFullScreen(!win.isFullScreen()); break
            case DevTools: webContents.toggleDevTools(); break
            default: break
        }
    })
}

export default keybinding