import { createEl, fromRoot, getHost } from "../utils/functions.js"
import packageJson from "../../package.json" with { type: "json" }
import { Config } from "../utils/config.js"
import { type, release, arch } from "os"
import { shell } from "electron"

const config = new Config

// Go back to Kirka from Auth page
export const backToKirka = () => {
    const authDomains = new Set([
        "www.facebook.com",
        "accounts.google.com",
        "appleid.apple.com",
        "www.twitch.tv",
        "discord.com",
        "id.vk.com"
    ])

    if (authDomains.has(window.location.host)) {
        const _back = createEl("div", {}, "backToKirka", ["Back to Kirka"])
        _back.addEventListener("click", () => window.location.href = `https://${getHost()}`)
        document.body.appendChild(_back)
    }
}

// In-game console versions
const versions = {
    CHROMIUM: `v${process.versions.chrome}`,
    ELECTRON: `v${process.versions.electron}`,
    NODE: `v${process.versions.node}`,
    CLIENT: `v${packageJson.version}`,
    OS: `${type()} ${release()} (${arch()})`
}

export const setVersions = (cont, toggle) => {
    if (!cont) return

    for (const [key, value] of Object.entries(versions)) {
        const el = cont.querySelector(`#${key}`)
        if (el) {
            el.style.display = toggle ? "block" : "none"
            continue
        }

        const _span = createEl("span", { id: key }, "", [`${key}: ${value}`])
        const _div = createEl("div", {}, "", [_span])
        cont.appendChild(_div)
    }
}

// Tricko links in profile
export const setTrickoLink = cont => {
    if (!cont) return

    if (cont.querySelector(".playerTrickoLink")) return

    const idCont = cont.querySelector(".copy-cont .value")
    if (!idCont) return

    const bottomCont = cont.querySelector(".bottom")
    if (!bottomCont) return

    const copiedNode = bottomCont.childNodes[0].cloneNode(true)
    if (!copiedNode) return

    copiedNode.classList.add("playerTrickoLink")
    copiedNode.textContent = "TRICKO"
    copiedNode.addEventListener("click", () => {
        const playerID = encodeURIComponent(idCont.innerHTML.replace("#", ""))
        const trickoLink = `https://tricko.pro/kirka/player/${playerID}`
        shell.openExternal(trickoLink)
    })

    bottomCont.prepend(copiedNode)
}

// Change logo on the main menu
// Credits: PVT
export const changeLogo = cont => {
    if (!cont) return
    cont.src = fromRoot("assets/logo.png")
}

const isNum = (aVal, bVal) => {
    const a = parseInt(aVal)
    const b = parseInt(bVal)

    if (isNaN(a) || isNaN(b) || b === 0) return a

    return (a / b).toFixed(2).replace(/\.?0+$/, "")
}

export const createKDRatio = cont => {
    if (!cont) return

    const [kills, deaths] = cont.children

    const val = isNum(kills.textContent, deaths.textContent)

    if (!cont.querySelector(".kd-ratio")) {
        const _kdText = createEl("div", {}, "kd-text", ["K/D"])
        const _kdValue = createEl("div", {}, "kd-value", [val])

        const _kd = kills.cloneNode(true)
        _kd.textContent = ""
        _kd.append(_kdValue, _kdText)
        _kd.classList.add("kd-ratio")
        if (config.get("interface.kdRatio")) _kd.classList.add("open")
        cont.appendChild(_kd)
        return
    }

    cont.querySelector(".kd-value").textContent = val
}