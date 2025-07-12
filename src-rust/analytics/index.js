const { join } = require("path")
const os = require("os")

const getAbi = () => {
    const platform = os.platform()
    const arch = os.arch()

    let triplet = ""

    switch (platform) {
        case "win32":
            triplet = arch === "x64" ? "win32-x64-msvc" :
                arch === "ia32" ? "win32-ia32-msvc" : ""
            break
        case "darwin":
            triplet = arch === "x64" ? "darwin-x64" :
                arch === "arm64" ? "darwin-arm64" : ""
            break
        case "linux":
            triplet = arch === "x64" ? "linux-x64-gnu" :
                arch === "arm64" ? "linux-arm64-gnu" : ""
            break
        default:
            throw new Error(`Unsupported platform: ${platform}`)
    }

    return triplet
}

const { setEntry, setLastEntry, getAllData } = require(join(__dirname, `./analytics.${getAbi()}.node`))

module.exports = { setEntry, setLastEntry, getAllData }