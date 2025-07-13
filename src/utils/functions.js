import { resolve, dirname, join } from "path"
import { nativeImage } from "electron"
import { Config } from "./config.js"
import { fileURLToPath } from "url"

const config = new Config

// Project root path
const __root = resolve(dirname(fileURLToPath(import.meta.url)), "../../")
export const fromRoot = path => join(__root, path)

// Kirka.io Domains
export const domains = new Set([
    "kirka.io",
    "cloudyfrogs.com",
    "snipers.io",
    "ask101math.com",
    "fpsiogame.com",
    "cloudconverts.com"
])

const host = config.get("client.domain")
export const getHost = () => {
    return domains.has(host) ? host : "kirka.io"
}

// Redline Client icon
const extObj = {
    win32: "ico",
    darwin: "icns",
    linux: "png"
}

let cachedIcon
export const getIcon = () => {
    if (cachedIcon) return cachedIcon

    const ext = extObj[process.platform]
    if (!ext) return undefined

    cachedIcon = nativeImage.createFromPath(fromRoot(`assets/icons/icon.${ext}`))
    return cachedIcon
}

// DOM
export const createEl = (tag, attrs = {}, className = "", append = []) => {
    const element = document.createElement(tag)
    if (className) element.classList.add(className)
    for (const attr of Object.keys(attrs)) element[attr] = attrs[attr]
    element.append(...append)
    return element
}

export const popup = (color, text) => {
    document.getElementById("clientPopup")?.remove()

    const _bell = createEl("img", { src: "redline://?path=assets/icons/bell.svg" })
    const _popup = createEl("div", { id: "clientPopup" }, "", [_bell, text])
    _popup.style.background = color

    const audio = new Audio("redline://?path=assets/sounds/pop.mp3")
    audio.volume = 0.3
    audio.play()

    const closePopup = () => {
        _popup.style.opacity = "0"
        setTimeout(() => _popup.remove(), 200)
    }

    _popup.addEventListener("click", closePopup)
    setTimeout(closePopup, 5000)

    document.body.appendChild(_popup)
}

export const restartMessage = () => popup("#e74c3c", "Restart the client to apply this setting.")

// Assets
export const getAsset = path => `https://raw.githubusercontent.com/robertpakalns/tricko-assets/main/${path}`

export const sessionFetch = async url => {
    const cached = sessionStorage.getItem(url)
    if (cached) return JSON.parse(cached)

    const response = await fetch(url)
    const data = await response.json()
    sessionStorage.setItem(url, JSON.stringify(data))
    return data
}

// Output
export const isNum = (aVal, bVal) => {
    const a = parseInt(aVal)
    const b = parseInt(bVal)

    if (isNaN(a) || isNaN(b) || b === 0) return a

    return Math.round(a / b * 100) / 100
}

export const output = (v, e) => {
    const n = parseFloat(v)
    return `${n} ${n !== 1 ? e + "s" : e}`
}

export const formatDuration = ms => {
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