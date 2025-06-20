import { readFileSync, mkdirSync, existsSync, readdirSync, writeFileSync } from "fs"
import { configDir } from "./config.js"
import { join } from "path"

const userscriptsFolder = join(configDir, "scripts")
if (!existsSync(userscriptsFolder)) mkdirSync(userscriptsFolder, { recursive: true })
const userscriptsFiles = new Set(readdirSync(userscriptsFolder))

const userstylesFolder = join(configDir, "styles")
if (!existsSync(userstylesFolder)) mkdirSync(userstylesFolder, { recursive: true })
const userstylesFiles = new Set(readdirSync(userstylesFolder))

const userscripts = webContents => {
    webContents.on("did-finish-load", () => {

        // User scripts
        // .js files only
        for (const el of userscriptsFiles) {
            const script = join(userscriptsFolder, el)
            if (existsSync(script)) webContents.executeJavaScript(readFileSync(script, "utf8"))
        }

        // User styles
        // .css files only
        for (const el of userstylesFiles) {
            const style = join(userstylesFolder, el)
            if (existsSync(style)) webContents.insertCSS(readFileSync(style, "utf8"))
        }
    })
}

export default userscripts