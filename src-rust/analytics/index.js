const { join } = require("path")
const os = require("os")

const getTriplet = () => {
    const platform = os.platform()
    const arch = os.arch()

    let triplet = ""

    switch (platform) {
        case "win32":
            triplet = arch === "x64" ? "x86_64-pc-windows-msvc" :
                arch === "ia32" ? "i686-pc-windows-msvc" : ""
            break
        case "darwin":
            triplet = arch === "x64" ? "x86_64-apple-darwin" :
                arch === "arm64" ? "aarch64-apple-darwin" : ""
            break
        case "linux":
            triplet = arch === "x64" ? "x86_64-pc-linux-gnu" :
                arch === "arm64" ? "aarch64-pc-linux-gnu" : ""
            break
        default:
            throw new Error(`Unsupported platform: ${platform}`)
    }

    return triplet
}

const { setEntry, setLastEntry, getAllData } = require(join(__dirname, `../../rust-plugins/${getTriplet()}/analytics.node`))

module.exports = { setEntry, setLastEntry, getAllData }