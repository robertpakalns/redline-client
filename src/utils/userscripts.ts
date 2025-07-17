import { readFileSync, mkdirSync, existsSync, readdirSync, writeFileSync } from "fs"
import { WebContents } from "electron"
import { configDir } from "./config"
import { join } from "path"

interface IUserscripts {
    enable: boolean
    scripts: Record<string, boolean>
    styles: Record<string, boolean>
}

const defaultConfig: IUserscripts = {
    enable: true,
    scripts: {},
    styles: {}
}

let userScripts: string[] = []
let userStyles: string[] = []

const handleObject = (obj: Record<string, boolean>, array: string[]): void => {

    // Fill the object if missing keys
    for (const key of array) if (!(key in obj)) obj[key] = true

    // Clear unexpected keys
    const keySet = new Set(array)
    for (const key in obj) if (!keySet.has(key)) delete obj[key]
}

export const userScriptsPath = join(configDir, "userscripts.json")
if (!existsSync(userScriptsPath)) writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2))

const userscriptsFolder = join(configDir, "scripts")
if (!existsSync(userscriptsFolder)) mkdirSync(userscriptsFolder, { recursive: true })

const userstylesFolder = join(configDir, "styles")
if (!existsSync(userstylesFolder)) mkdirSync(userstylesFolder, { recursive: true })

const getUserScriptsFiles = (): void => {
    let data: IUserscripts
    try { data = JSON.parse(readFileSync(userScriptsPath, "utf8")) } catch {
        data = JSON.parse(JSON.stringify(defaultConfig))
        writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2))
    }

    const { enable, scripts, styles } = data
    const originalEnable = enable
    const originalScripts = JSON.stringify(scripts)
    const originalStyles = JSON.stringify(styles)

    userScripts = readdirSync(userscriptsFolder).filter(script => script.endsWith(".js"))
    userStyles = readdirSync(userstylesFolder).filter(style => style.endsWith(".css"))

    handleObject(scripts, userScripts)
    handleObject(styles, userStyles)

    if (
        originalEnable !== enable ||
        originalScripts !== JSON.stringify(scripts) ||
        originalStyles !== JSON.stringify(styles)
    ) {
        writeFileSync(userScriptsPath, JSON.stringify({ enable, scripts, styles }, null, 2))
    }
}

// User scripts
// .js files only
const setUserscripts = (webContents: WebContents): void => {
    let data
    try { data = JSON.parse(readFileSync(userScriptsPath, "utf8")) }
    catch {
        data = JSON.parse(JSON.stringify(defaultConfig))
        writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2))
    }

    const { enable, scripts } = data

    for (const el of userScripts) {
        if (scripts[el] === false) continue

        const scriptPath = join(userscriptsFolder, el)
        if (enable && existsSync(scriptPath)) {
            const script = readFileSync(scriptPath, "utf8")
            const content = new Function(script)
            webContents.executeJavaScript(`(${content.toString()})()`)
        }
    }
}

// User styles
// .css files only
const setUserstyles = (webContents: WebContents): void => {
    let data
    try { data = JSON.parse(readFileSync(userScriptsPath, "utf8")) }
    catch {
        data = JSON.parse(JSON.stringify(defaultConfig))
        writeFileSync(userScriptsPath, JSON.stringify(defaultConfig, null, 2))
    }

    const { enable, styles } = data

    for (const el of userStyles) {
        if (styles[el] === false) continue
        const stylePath = join(userstylesFolder, el)
        if (enable && existsSync(stylePath)) {
            const styleContent = readFileSync(stylePath, "utf8")
            webContents.insertCSS(styleContent)
        }
    }
}

export const userscripts = (webContents: WebContents): void => {
    getUserScriptsFiles()
    setUserscripts(webContents)

    webContents.on("did-start-navigation", (_, __, isInPlace, isMainFrame) => {
        if (isMainFrame && !isInPlace) {
            getUserScriptsFiles()
            setUserscripts(webContents)
        }
    })

    webContents.on("did-finish-load", () => setUserstyles(webContents))
}