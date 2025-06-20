import { Config, defaultConfig } from "./config.js"
const config = new Config

const keybinding = win => {
    const { webContents } = win
    const keybindings = config.get("keybinding.enable") ? config.get("keybinding.content") : defaultConfig.keybinding.content
    const { CloseModal, MenuModal, Reload, Fullscreen, DevTools } = keybindings

    const keySet = new Set([MenuModal, Reload, Fullscreen, DevTools])

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
}

export default keybinding