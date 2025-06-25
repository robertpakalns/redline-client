import { createEl, fromRoot, getHost } from "../utils/functions.js"
import packageJson from "../../package.json" with { type: "json" }
import { shell } from "electron"
import { type, release, arch } from "os"

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

export const setVersions = toggle => {
    const versionOverlay = document.getElementById("overlay")
    if (!versionOverlay) return

    for (const [key, value] of Object.entries(versions)) {
        const el = document.getElementById(key)
        if (el) {
            el.style.display = toggle ? "block" : "none"
            continue
        }

        const _span = createEl("span", { id: key }, "", [`${key}: ${value}`])
        const _div = createEl("div", {}, "", [_span])
        versionOverlay.appendChild(_div)
    }
}

// Tricko links in profile
export const setTrickoLink = () => {
    const profileCont = document.querySelector(".profile-cont")
    if (!profileCont) return

    if (profileCont.querySelector(".playerTrickoLink")) return

    const idCont = profileCont.querySelector(".copy-cont .value")
    if (!idCont) return

    const bottomCont = profileCont.querySelector(".bottom")
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
export const changeLogo = () => {
    const oldLogo = document.querySelector("img.logo#logo")
    if (!oldLogo) return
    oldLogo.src = fromRoot("assets/logo.png")
}