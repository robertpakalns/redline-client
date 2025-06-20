import { existsSync, mkdirSync, readdirSync, readFileSync } from "fs"
import { Config, configDir } from "./config.js"
import { join } from "path"
const config = new Config

const swapper = webContents => {
    const reject = new Set([
        "api.adinplay.com",
        "www.google-analytics.com",
        "www.googletagmanager.com"
    ])

    const domains = new Set([
        "kirka.io",
        "cloudyfrogs.com",
        "snipers.io",
        "ask101math.com",
        "fpsiogame.com",
        "cloudconverts.com"
    ])

    const { adblocker, swapper } = config.get("client")

    const swapperFolder = join(configDir, "swapper")
    if (!existsSync(swapperFolder)) mkdirSync(swapperFolder, { recursive: true })
    const swapperFiles = new Set(readdirSync(swapperFolder))

    const swapFile = name => {

        // Resource detection based on the file name and extension
        if (!swapperFiles.has(name)) return null
        const localFilePath = join(swapperFolder, name)
        return existsSync(localFilePath) ? `file://${localFilePath}` : null
    }

    webContents.session.webRequest.onBeforeRequest(({ url }, callback) => {

        const { protocol, host, pathname } = new URL(url)

        if (protocol === "file:") return callback({})

        // Block ads and other scripts which are not voxiom related
        if (adblocker && reject.has(host)) return callback({ cancel: true })

        if (domains.has(host)) {

            // Swapper
            if (swapper) {
                const swap = swapFile(pathname.split("/").pop())
                if (swap) return callback({ redirectURL: swap })
            }
        }

        return callback({})
    })
}

export default swapper