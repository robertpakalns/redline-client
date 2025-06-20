import { app, BrowserWindow, ipcMain, dialog, protocol, net } from "electron"
import { fromRoot, getIcon } from "./src/utils/functions.js"
import { Config, configDir } from "./src/utils/config.js"
import userscripts from "./src/utils/userscripts.js"
import keybinding from "./src/utils/keybinding.js"
import electronUpdater from "electron-updater"
import enject from "@juice-client/node-enject"
import swapper from "./src/utils/swapper.js"
import { pathToFileURL } from "url"
import { existsSync } from "fs"
import { join } from "path"

const { autoUpdater } = electronUpdater
const config = new Config

let mainWindow

const createWindow = () => {
    mainWindow = new BrowserWindow({
        title: "Redline Client",
        icon: getIcon(),
        show: false,
        webPreferences: {
            preload: fromRoot("src/preload/preload.js"),
            nodeIntegration: true,
            webSecurity: false
        }
    })

    mainWindow.once("ready-to-show", () => {
        const hwnd = mainWindow.getNativeWindowHandle().readUInt32LE(0)
        enject.startHook(hwnd)

        mainWindow.show()
    })

    mainWindow.maximize()
    mainWindow.setMenu(null)
    mainWindow.loadURL("https://kirka.io")
    mainWindow.setFullScreen(config.get("client.fullscreen"))
    mainWindow.on("page-title-updated", e => e.preventDefault())

    const { webContents } = mainWindow
    webContents.on("will-prevent-unload", e => e.preventDefault())

    keybinding(mainWindow)
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

if (config.get("client.fpsUncap")) app.commandLine.appendSwitch("disable-frame-rate-limit")

if (!app.requestSingleInstanceLock()) app.quit()

app.on("second-instance", () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
})

app.on("ready", () => {
    app.setAsDefaultProtocolClient("redline")

    // Swapper
    protocol.handle("redline", ({ url }) => {
        const assetName = new URL(url).searchParams.get("asset")
        const localPath = join(configDir, "swapper", assetName)

        if (existsSync(localPath)) return net.fetch(pathToFileURL(localPath).toString())
    })

    createWindow()

    // Deeplink
    const deeplink = process.argv.find(arg => arg.startsWith("redline:"))
    if (deeplink) {
        const { searchParams, hash } = new URL(deeplink)
        const queryPath = searchParams.get("url")
        const cleanPath = queryPath ? queryPath.replace(/^\/+/, "").replace(/\/+$/, "") : ""
        const finalURL = `https://kirka.io/${cleanPath}${hash}`
        if (queryPath) mainWindow.loadURL(finalURL)
    }

    const { webContents } = mainWindow

    // Updater
    autoUpdater.checkForUpdates()
    autoUpdater.on("update-available", () => webContents.send("client-update", null))
    autoUpdater.on("download-progress", value => webContents.send("client-update", value))
    autoUpdater.on("update-downloaded", () => webContents.send("client-update", true))
    ipcMain.on("client-update", (_, data) => {
        if (data === "update") autoUpdater.quitAndInstall()
    })

    ipcMain.on("relaunch", () => confirmAction("Are you sure you want to relaunch the application?", () => {
        app.relaunch()
        app.exit()
    }))
})