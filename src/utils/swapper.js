import { existsSync, mkdirSync, readdirSync } from "fs"
import { Config, configDir } from "./config.js"
import { protocol, net } from "electron"
import { domains } from "./functions.js"
import { pathToFileURL } from "url"
import { join } from "path"

const config = new Config

const swapper = webContents => {
    const reject = new Set([
        "api.adinplay.com",
        "www.google-analytics.com",
        "www.googletagmanager.com"
    ])

    const { adblocker, swapper } = config.get("client")

    const swapperFolder = join(configDir, "swapper")
    if (!existsSync(swapperFolder)) mkdirSync(swapperFolder, { recursive: true })
    const swapperFiles = new Set(readdirSync(swapperFolder))

    // Handle protocol
    protocol.handle("redline", ({ url }) => {
        const assetName = new URL(url).searchParams.get("asset")
        const localPath = join(configDir, "swapper", assetName)

        if (existsSync(localPath)) return net.fetch(pathToFileURL(localPath).toString())
    })

    const swapFile = name => {

        // Resource detection based on the file name and extension
        if (!swapperFiles.has(name)) return null
        const localFilePath = join(swapperFolder, name)
        return existsSync(localFilePath) ? `file://${localFilePath}` : null
    }

    webContents.session.webRequest.onBeforeRequest(({ url }, callback) => {

        const { protocol, host, pathname } = new URL(url)

        if (protocol === "file:") return callback({})

        // Block ads and other scripts which are not Kirka related
        if (adblocker && reject.has(host)) return callback({ cancel: true })

        if (domains.has(host)) {

            // Swapper
            if (swapper) {
                const fileName = pathname.split("/").pop()
                if (swapFile(fileName)) return callback({ redirectURL: `redline://local?asset=${encodeURIComponent(fileName)}` })
            }
        }

        return callback({})
    })
}

export default swapper