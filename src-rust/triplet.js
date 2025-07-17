import { arch, platform } from "os"

const triplets = {
    win32: { x64: "win32-x64-msvc", ia32: "win32-ia32-msvc" },
    darwin: { x64: "darwin-x64", arm64: "darwin-arm64" },
    linux: { x64: "linux-x64-gnu", arm64: "linux-arm64-gnu" }
}

const triplet = () => {
    const p = platform()
    const a = arch()

    const result = triplets[p]?.[a]
    if (!result) throw new Error(`Unsupported architecture ${a} on platform ${p}`)

    return result
}

export default triplet