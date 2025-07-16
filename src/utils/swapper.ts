import { existsSync, mkdirSync, readdirSync } from "fs"
import { protocol, net, WebContents } from "electron"
import { domains, fromRoot } from "./functions"
import { Config, configDir } from "./config"
import { pathToFileURL } from "url"
import { join } from "path"

const config = new Config

const swapper = (webContents: WebContents): void => {
    const reject = new Set<string>([
        "api.adinplay.com",
        "www.google-analytics.com",
        "www.googletagmanager.com"
    ])

    const { adblocker, swapper } = config.get("client") as {
        adblocker: boolean
        swapper: boolean
    }

    const swapperFolder = join(configDir, "swapper")
    if (!existsSync(swapperFolder)) mkdirSync(swapperFolder, { recursive: true })
    const swapperFiles = new Set<string>(readdirSync(swapperFolder))

    // Handle protocol
    protocol.handle("redline", ({ url }) => {
        const u = new URL(url)

        const assetName = u.searchParams.get("asset")
        const relPath = u.searchParams.get("path")

        let localPath: string | undefined
        if (relPath) localPath = fromRoot(relPath)
        else if (assetName) localPath = join(configDir, "swapper", assetName)
        else return Promise.resolve(new Response(null, { status: 404 }))

        if (existsSync(localPath)) return net.fetch(pathToFileURL(localPath).toString())

        return Promise.resolve(new Response(null, { status: 404 }))
    })

    const swapFile = (name: string | undefined): string | null => {

        // Resource detection based on the file name and extension
        if (!swapperFiles.has(name as string)) return null
        const localFilePath = join(swapperFolder, name as string)
        return existsSync(localFilePath) ? `file://${localFilePath}` : null
    }

    webContents.session.webRequest.onBeforeRequest(({ url }, callback): void => {

        const { protocol, host, pathname } = new URL(url)

        if (protocol === "file:") return callback({})

        // Block ads and other scripts which are not Kirka related
        if (adblocker && reject.has(host)) return callback({ cancel: true })

        if (domains.has(host)) {

            // Swapper
            if (swapper) {
                const fileName = pathname.split("/").pop()
                if (swapFile(fileName)) return callback({ redirectURL: `redline://local?asset=${encodeURIComponent(fileName as string)}` })
            }
        }

        return callback({})
    })
}

export default swapper