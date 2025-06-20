import { app, BrowserWindow } from "electron"
import enject from "@juice-client/node-enject"
import swapper from "./src/utils/swapper.js"
import keybinding from "./src/utils/keybinding.js"
import userscripts from "./src/utils/userscripts.js"

import { fromRoot, getIcon } from "./src/utils/functions.js"

const createWindow = () => {
    const win = new BrowserWindow({
        title: "Redline Client",
        icon: getIcon(),
        show: false,
        webPreferences: {
            preload: fromRoot("src/preload/preload.js"),
            nodeIntegration: true,
            webSecurity: false
        }
    })

    win.once("ready-to-show", () => {
        const hwnd = win.getNativeWindowHandle().readUInt32LE(0)
        enject.startHook(hwnd)

        win.show()
    })

    win.maximize()
    win.setMenu(null)
    win.loadURL("https://kirka.io")
    win.on("page-title-updated", e => e.preventDefault())

    const { webContents } = win
    webContents.on("will-prevent-unload", e => e.preventDefault())

    keybinding(win)
    swapper(webContents)
    userscripts(webContents)
}

app.commandLine.appendSwitch("disable-frame-rate-limit")

app.whenReady().then(createWindow)