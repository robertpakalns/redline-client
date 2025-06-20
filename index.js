import { fromRoot, getIcon } from "./src/utils/functions.js"
import { app, BrowserWindow, ipcMain, dialog } from "electron"
import userscripts from "./src/utils/userscripts.js"
import keybinding from "./src/utils/keybinding.js"
import enject from "@juice-client/node-enject"
import swapper from "./src/utils/swapper.js"

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

const confirmAction = (message, callback) => {
    const result = dialog.showMessageBoxSync({
        type: "question",
        buttons: ["Yes", "No"],
        defaultId: 1,
        icon: getIcon(),
        title: "Redline Client | Confirm",
        message
    })
    if (result === 0) callback()
}

app.commandLine.appendSwitch("disable-frame-rate-limit")

app.on("ready", () => {
    createWindow()

    ipcMain.on("relaunch", () => confirmAction("Are you sure you want to relaunch the application?", () => {
        app.relaunch()
        app.exit()
    }))
})