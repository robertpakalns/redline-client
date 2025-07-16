import { nativeImage, NativeImage } from "electron"
import { resolve, dirname, join } from "path"
import { Config, ConfigType } from "./config"
import { fileURLToPath } from "url"

const config = new Config

// Project root path
const __root = resolve(dirname(fileURLToPath(import.meta.url)), "../../")
export const fromRoot = (path: string): string => join(__root, path)

// Kirka.io Domains
export const domains = new Set<string>([
    "kirka.io",
    "cloudyfrogs.com",
    "snipers.io",
    "ask101math.com",
    "fpsiogame.com",
    "cloudconverts.com"
])

const host: ConfigType = config.get("client.domain")
export const getHost = (): string => domains.has(host as string) ? host as string : "kirka.io"

// Redline Client icon
const extObj: Record<string, string> = {
    win32: "ico",
    darwin: "icns",
    linux: "png"
}

let cachedIcon: NativeImage | undefined
export const getIcon = (): NativeImage | undefined => {
    if (cachedIcon) return cachedIcon

    const ext: string = extObj[process.platform]
    if (!ext) return undefined

    cachedIcon = nativeImage.createFromPath(fromRoot(`assets/icons/icon.${ext}`))
    return cachedIcon
}

// DOM
export const createEl = (
    tag: string,
    attrs: Record<string, string> = {},
    className: string = "",
    append: (HTMLElement | string)[] = []
): HTMLElement => {
    const element: HTMLElement = document.createElement(tag)
    if (className) element.classList.add(className)
    for (const attr of Object.keys(attrs)) (element as any)[attr] = attrs[attr]
    element.append(...append)
    return element
}

export const popup = (color: string, text: string): void => {
    document.getElementById("clientPopup")?.remove()

    const _bell: HTMLElement = createEl("img", { src: "redline://?path=assets/icons/bell.svg" })
    const _popup: HTMLElement = createEl("div", { id: "clientPopup" }, "", [_bell, text])
    _popup.style.background = color

    const audio = new Audio("redline://?path=assets/sounds/pop.mp3")
    audio.volume = 0.3
    audio.play()

    const closePopup = (): void => {
        _popup.style.opacity = "0"
        setTimeout(() => _popup.remove(), 200)
    }

    _popup.addEventListener("click", closePopup)
    setTimeout(closePopup, 5000)

    document.body.appendChild(_popup)
}

export const restartMessage = (): void => popup("#e74c3c", "Restart the client to apply this setting.")

// Assets
export const getAsset = (path: string): string => `https://raw.githubusercontent.com/robertpakalns/tricko-assets/main/${path}`

export const sessionFetch = async (url: string): Promise<any> => {
    const cached = sessionStorage.getItem(url)
    if (cached) return JSON.parse(cached)

    const response = await fetch(url)
    const data = await response.json()
    sessionStorage.setItem(url, JSON.stringify(data))
    return data
}

// Output
export const isNum = (aVal: string, bVal: string): number => {
    const a = parseInt(aVal)
    const b = parseInt(bVal)

    if (isNaN(a) || isNaN(b) || b === 0) return a

    return Math.round(a / b * 100) / 100
}

export const output = (v: string | number, e: string): string => {
    const n = parseFloat(v.toString())
    return `${n} ${n !== 1 ? e + "s" : e}`
}

export const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)

    const units = [
        { name: "year", value: 31536000 },
        { name: "month", value: 2592000 },
        { name: "week", value: 604800 },
        { name: "day", value: 86400 },
        { name: "hour", value: 3600 },
        { name: "minute", value: 60 },
        { name: "second", value: 1 },
    ]

    for (const { name, value } of units) {
        if (seconds >= value) {
            const count = Math.floor(seconds / value)
            return output(count, name)
        }
    }

    return "No Data"
}