import { readFileSync, mkdirSync, existsSync, readdirSync } from "fs"
import { configDir } from "./config.js"
import { join } from "path"

const userscriptsFolder = join(configDir, "scripts")
if (!existsSync(userscriptsFolder)) mkdirSync(userscriptsFolder, { recursive: true })
const userscriptsFiles = new Set(readdirSync(userscriptsFolder))

const userstylesFolder = join(configDir, "styles")
if (!existsSync(userstylesFolder)) mkdirSync(userstylesFolder, { recursive: true })
const userstylesFiles = new Set(readdirSync(userstylesFolder))

export const setUserscripts = webContents => {
    // User scripts
    // .js files only
    for (const el of userscriptsFiles) {
        const script = join(userscriptsFolder, el)
        if (existsSync(script)) webContents.executeJavaScript(readFileSync(script, "utf8"))
    }
}

export const userscripts = webContents => {
    webContents.on("did-start-loading", () => setUserscripts(webContents))

    webContents.on("did-finish-load", () => {
        // User styles
        // .css files only
        for (const el of userstylesFiles) {
            const style = join(userstylesFolder, el)
            if (existsSync(style)) webContents.insertCSS(readFileSync(style, "utf8"))
        }
    })
}