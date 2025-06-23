import { resolve, dirname } from "path"
import { nativeImage } from "electron"
import { Config } from "./config.js"
import { fileURLToPath } from "url"
import { join } from "path"

const config = new Config

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

export const getIcon = () => {
    const ext = extObj[process.platform] || null
    return ext ? nativeImage.createFromPath(fromRoot(`assets/icons/icon.${ext}`)) : undefined
}

// DOM
export const createEl = (tag, attrs = {}, className = "", append = []) => {
    const element = document.createElement(tag)
    if (className) element.classList.add(className)
    for (const attr of Object.keys(attrs)) element[attr] = attrs[attr]
    element.append(...append)
    return element
}