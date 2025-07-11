import { confirmAction, openDialogModal, saveDialogModal } from "./src/utils/dialogs.js"
import { fromRoot, getIcon, getHost } from "./src/utils/functions.js"
import { app, BrowserWindow, ipcMain, protocol, net } from "electron"
import { Config, configDir, configPath } from "./src/utils/config.js"
import { existsSync, writeFileSync, readFileSync } from "fs"
import electronUpdater from "electron-updater"
import { pathToFileURL } from "url"
import { join } from "path"

import { userscripts } from "./src/utils/userscripts.js"
import analytics from "./src-rust/analytics/index.js"
import keybinding from "./src/utils/keybinding.js"
import swapper from "./src/utils/swapper.js"
import DRPC from "./src/utils/drpc.js"

const { autoUpdater } = electronUpdater
const config = new Config
const drpc = new DRPC

let mainWindow = null
let lastURL = null

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

    mainWindow.once("ready-to-show", async () => {
        if (process.platform === "win32") {
            const { default: enject } = await import("@juice-client/node-enject")

            const handleBuffer = mainWindow.getNativeWindowHandle()
            let hwnd

            if (process.arch === "x64" || process.arch === "arm64") hwnd = Number(handleBuffer.readBigUInt64LE(0))
            else hwnd = handleBuffer.readUInt32LE(0)

            enject.startHook(hwnd)
        }

        mainWindow.show()
    })

    mainWindow.maximize()
    mainWindow.setMenu(null)
    mainWindow.loadURL(`https://${getHost()}`)
    mainWindow.setFullScreen(config.get("client.fullscreen"))
    mainWindow.on("page-title-updated", e => e.preventDefault())

    ipcMain.on("join-game", (_, url) => mainWindow.loadURL(url))

    const { webContents } = mainWindow
    ipcMain.on("update-url", e => e.reply("update-url", webContents.getURL()))
    webContents.on("will-prevent-unload", e => e.preventDefault())
    webContents.on("did-navigate-in-page", (_, url) => {
        webContents.send("url-change")
        webContents.send("update-url", url)

        lastURL = url
        drpc.setState(lastURL)
        analytics.setEntry(lastURL)
    })

    webContents.on("did-navigate", (_, url) => {
        lastURL = url
        drpc.setState(lastURL)
        analytics.setEntry(lastURL)
    })
    webContents.on("did-finish-load", () => {
        lastURL = webContents.getURL()
        drpc.setState(lastURL)
        analytics.setEntry(lastURL)
    })

    keybinding(mainWindow)
    swapper(webContents)
    userscripts(webContents)
}

if (config.get("client.fpsUncap") && process.platform === "win32") {
    app.commandLine.appendSwitch("disable-frame-rate-limit")
    app.commandLine.appendSwitch("disable-gpu-vsync")
}

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
        const finalURL = `https://${getHost()}/${cleanPath}${hash}`
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

    // Forward messages
    for (const e of ["toggle-menu-modal", "change-fast-css", "toggle-kd-ratio"])
        ipcMain.on(e, (_, ...a) => webContents.send(e, ...a))

    // Import/export settings
    ipcMain.on("import-client-settings", () => openDialogModal(file => writeFileSync(Config.file, readFileSync(file, "utf8"))))
    ipcMain.on("export-client-settings", () => saveDialogModal(file => writeFileSync(file, readFileSync(configPath))))

    // Save last URL
    mainWindow.on("close", () => {
        if (mainWindow && mainWindow.webContents) lastURL = mainWindow.webContents.getURL()
    })
})

app.on("before-quit", analytics.setLastEntry)