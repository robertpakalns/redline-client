import { app } from "electron"
import { Config, defaultConfig } from "./config.js"
import electronLocalshortcut from "electron-localshortcut"

const { register } = electronLocalshortcut
const config = new Config
const keybindings = config.get("keybinding.enable") ? config.get("keybinding.content") : defaultConfig.keybinding.content
const { CloseModal, MenuModal, Reload, Fullscreen, DevTools } = keybindings

const keybinding = win => {
    const { webContents } = win

    register("Alt+F4", app.quit)
    register(CloseModal, () => webContents.send("toggle-window", "null"))
    register(MenuModal, () => webContents.send("toggle-window", "menuModal"))
    register(Reload, () => webContents.reload())
    register(Fullscreen, () => win.setFullScreen(!win.isFullScreen()))
    register(DevTools, () => webContents.toggleDevTools())
    register("Ctrl+Shift+C", () => webContents.toggleDevTools())
}

export default keybinding