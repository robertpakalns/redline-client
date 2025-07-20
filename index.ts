import { confirmAction, openDialogModal, saveDialogModal, errorModal } from "./src/utils/dialogs.js"
import { fromRoot, getIcon, getHost } from "./src/utils/functions.js"
import { Config, configPath } from "./src/utils/config.js"
import { app, BrowserWindow, ipcMain } from "electron"
import { writeFileSync, readFileSync } from "fs"
import electronUpdater from "electron-updater"

// JavaScript modules
import { userscripts } from "./src/utils/userscripts.js"
import keybinding from "./src/utils/keybinding.js"
import swapper from "./src/utils/swapper.js"

// Rust modules
import * as analytics from "./src-rust/analytics/index.js"
import * as drpc from "./src-rust/drpc/index.js"

const { autoUpdater } = electronUpdater
const config = new Config
let mainWindow: BrowserWindow | null = null
let lastURL: string | null = null

const handleURL = (url: string): void => {
    lastURL = url
    drpc.setStatus(lastURL)
    analytics.setEntry(lastURL)
}

const createWindow = (initialURL: string): void => {
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

    mainWindow.once("ready-to-show", async (): Promise<void> => {
        if (process.platform === "win32") {
            // @ts-ignore
            // Windows only
            const { default: enject } = await import("@juice-client/node-enject")

            const handleBuffer = mainWindow!.getNativeWindowHandle()
            let hwnd: number

            if (process.arch === "x64" || process.arch === "arm64") hwnd = Number(handleBuffer.readBigUInt64LE(0))
            else hwnd = handleBuffer.readUInt32LE(0)

            enject.startHook(hwnd)
        }

        mainWindow!.show()
    })

    mainWindow.maximize()
    mainWindow.setMenu(null)
    mainWindow.loadURL(initialURL)
    mainWindow.setFullScreen(config.get("client.fullscreen") as boolean)
    mainWindow.on("page-title-updated", e => e.preventDefault())

    ipcMain.on("join-game", (_, url: string) => mainWindow!.loadURL(url))

    const { webContents } = mainWindow
    ipcMain.on("update-url", e => e.reply("update-url", webContents.getURL()))
    webContents.on("will-prevent-unload", e => e.preventDefault())
    webContents.on("did-navigate-in-page", (_, url) => {
        webContents.send("update-url", url)
        handleURL(url)
    })
    webContents.on("did-navigate", (_, url) => handleURL(url))
    webContents.on("did-finish-load", () => handleURL(webContents.getURL()))
    webContents.on("did-fail-load", (_, code) => {
        if (code === -105) errorModal(code)  // ERR_NAME_NOT_RESOLVED 
    })

    keybinding(mainWindow)
    swapper(webContents)
    userscripts(webContents)
}

// FPS uncap for Windows only
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

    let deeplinkURL: string | null = null
    const deeplink = process.argv.find(arg => arg.startsWith("redline:"))
    if (deeplink) {
        const { searchParams, hash } = new URL(deeplink)
        const queryPath = searchParams.get("url")
        const cleanPath = queryPath ? queryPath.replace(/^\/+/, "").replace(/\/+$/, "") : ""
        deeplinkURL = queryPath ? `https://${getHost()}/${cleanPath}${hash}` : null
    }

    drpc.init(config.get("discord.joinButton") as boolean, deeplinkURL || `https://${getHost()}`)

    createWindow(deeplinkURL || `https://${getHost()}`)

    const webContents = mainWindow!.webContents

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
    mainWindow!.on("close", () => {
        if (mainWindow && mainWindow.webContents) lastURL = mainWindow.webContents.getURL()
    })
})

app.on("before-quit", analytics.setLastEntry)