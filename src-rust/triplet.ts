import { arch, platform } from "os"

type Platform = "win32" | "darwin" | "linux"
type Arch = "x64" | "ia32" | "arm64"

const triplets: Record<Platform, Partial<Record<Arch, string>>> = {
    win32: { x64: "win32-x64-msvc", ia32: "win32-ia32-msvc" },
    darwin: { x64: "darwin-x64", arm64: "darwin-arm64" },
    linux: { x64: "linux-x64-gnu", arm64: "linux-arm64-gnu" }
}

const triplet = (): string => {
    const p = platform() as Platform
    const a = arch() as Arch

    const result = triplets[p]?.[a]
    if (!result) throw new Error(`Unsupported architecture ${a} on platform ${p}`)

    return result
}

export default triplet