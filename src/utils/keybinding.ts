import { app, BrowserWindow } from "electron"
import { Config, defaultConfig } from "./config"
import electronLocalshortcut from "electron-localshortcut"

const { register } = electronLocalshortcut
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

    webContents.on("before-input-event", (e, { code }) => {
        if (keySet.has(code)) e.preventDefault()

        switch (code) {
            case CloseModal: webContents.send("toggle-window", "null"); break
            case MenuModal: webContents.send("toggle-window", "menuModal"); break
            case Reload: webContents.reload(); break
            case Fullscreen: win.setFullScreen(!win.isFullScreen()); break
            case DevTools: webContents.toggleDevTools(); break
            default: break
        }
    })

    register("Alt+F4", app.quit)
    register("Ctrl+Shift+C", () => webContents.toggleDevTools())
}

export default keybinding