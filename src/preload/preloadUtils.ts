import packageJson from "../../package.json" with { type: "json" }
import { createEl, getHost, isNum } from "../utils/functions.js"
import { Config } from "../utils/config.js"
import { type, release, arch } from "os"
import { shell } from "electron"

const config = new Config

// Go back to Kirka from Auth page
export const backToKirka = (): void => {
    const authDomains = new Set<string>([
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
    REDLINE_CLIENT: `v${packageJson.version}`,
    OS: `${type()} ${release()} (${arch()})`
}

export const setVersions = (cont: HTMLElement, toggle: boolean) => {
    if (!cont) return

    for (const [key, value] of Object.entries(versions)) {
        const el = cont.querySelector(`#${key}`) as HTMLElement
        if (el) {
            el.style.display = toggle ? "block" : "none"
            continue
        }

        const _span = createEl("span", { id: key }, "", [`${key.replace("_", " ")}: ${value}`])
        const _div = createEl("div", {}, "", [_span])
        cont.appendChild(_div)
    }
}

// Tricko links in profile
export const setTrickoLink = (cont: HTMLElement): void => {
    if (!cont) return

    if (cont.querySelector(".playerTrickoLink")) return

    const idCont = cont.querySelector(".copy-cont .value")
    if (!idCont) return

    const bottomCont = cont.querySelector(".bottom")
    if (!bottomCont) return

    const children = Array.from(bottomCont.childNodes).filter(node => node instanceof HTMLElement)
    const copiedNode = children[0]?.cloneNode(true) as HTMLElement
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
export const changeLogo = (cont: HTMLImageElement): void => {
    if (!cont) return
    cont.src = "redline://?path=assets/logo.png"
}

export const changeSocLinks = (cont: HTMLElement): void => {
    const btn = document.querySelectorAll(".card-cont.soc-group")[1]
    if (!btn || document.querySelector("#redline-discord")) return

    const discordBtn = btn.cloneNode(true) as HTMLButtonElement
    discordBtn.id = "redline-discord"
    discordBtn.className = "card-cont soc-group"

    const textDivs = Array.from(discordBtn.querySelector(".text-soc")!.children) as HTMLLinkElement[]
    textDivs[0].innerText = "REDLINE"
    textDivs[1].innerText = "DOWNLOAD"

    const useEl = discordBtn.querySelector("svg use")!;
    useEl.setAttribute("href", "redline://?path=assets/icons/download.svg");


    discordBtn.onclick = () => shell.openExternal("https://tricko.pro/redline")

    btn.replaceWith(discordBtn)

    // setInterval(() => {
    //     discordBtn.className = "card-cont soc-group"
    // }, 300)
}

export const createKDRatio = (cont: HTMLElement): void => {
    if (!cont) return

    const [kills, deaths] = Array.from(cont.children)

    const val = isNum(kills.textContent ?? "", deaths.textContent ?? "")

    if (!cont.querySelector(".kd-ratio")) {
        const _kdText = createEl("div", {}, "kd-text", ["K/D"])
        const _kdValue = createEl("div", {}, "kd-value", [val.toString()])

        const _kd = kills.cloneNode(true) as HTMLElement
        _kd.textContent = ""
        _kd.append(_kdValue, _kdText)
        _kd.classList.add("kd-ratio")
        if (config.get("interface.kdRatio")) _kd.classList.add("open")
        cont.appendChild(_kd)
        return
    }

    const kdValue = cont.querySelector(".kd-value")
    if (!kdValue) return
    kdValue.textContent = val.toString()
}