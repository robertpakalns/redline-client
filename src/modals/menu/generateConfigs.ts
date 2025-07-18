import settingsJson from "../../../assets/settings.json" with { type: "json" }
import { createEl, popup } from "../../utils/functions"
import { Config } from "../../utils/config"
import { ipcRenderer } from "electron"

const config = new Config

type RequiresType = "restart" | "refresh" | null

interface Setting {
    id?: string
    name: string
    description: string
    type: "checkbox" | "select"
    config: string
    section: "settings"
    requires?: RequiresType
    select?: string[]
}

const data = settingsJson as Setting[];

const restartMessage = (): void => popup("#e74c3c", "Restart the client to apply this setting.")
const refreshMessage = (): void => popup("#e89b0bff", "Refresh the page to apply this setting.")

const sendNotification = (requires: RequiresType): void => {
    if (requires === "restart") restartMessage()
    else if (requires === "refresh") refreshMessage()
}

const generateConfigs = () => {
    for (const el of data) {
        const parentCont = document.querySelector(`div[name=${el.section}Section] > div.settingsCont`)

        const name = createEl("div", {}, "name", [el.name])
        const description = createEl("div", {}, "subText", [el.description])
        const requires = createEl("div", {}, el.requires === "restart" ? "restart" : "", [el.requires ? `Requires ${el.requires}` : ""])

        const upCont = createEl("div", {}, "upCont", [name, requires])
        const downCont = createEl("div", {}, "downCont", [description])

        const leftCont = createEl("div", {}, "leftCont", [upCont, downCont])

        let configCont
        if (el.type === "checkbox") {
            configCont = createEl("input", { type: "checkbox", ...(el.id ? { id: el.id } : {}) }, "", []) as HTMLInputElement
            configCont.checked = config.get(el.config) as boolean
            configCont.addEventListener("change", e => {
                config.set(el.config, (e.target as HTMLInputElement).checked)
                sendNotification(el.requires as RequiresType)
            })
        }
        else if (el.type === "select") {
            configCont = createEl("select", {}, "", []) as HTMLSelectElement
            configCont.addEventListener("change", e => {
                config.set(el.config, (e.target as HTMLOptionElement).value)
                sendNotification(el.requires as RequiresType)
            })

            if (el.select) {
                for (const i of el.select) {
                    const option = createEl("option", { value: i }, "", [i])
                    configCont.appendChild(option)
                }

                configCont!.value = config.get(el.config) as string
            }
        }
        else {
            configCont = createEl("div", {}, "", [])
        }

        const cont = createEl("div", {}, "configCont", [leftCont, configCont])
        parentCont?.appendChild(cont)
    }

    document.querySelector("#modalHint")?.addEventListener("change", e => ipcRenderer.send("toggle-menu-modal", (e.target as HTMLInputElement).checked))
    document.querySelector("#kdRatio")?.addEventListener("change", e => ipcRenderer.send("toggle-kd-ratio", (e.target as HTMLInputElement).checked))

    // Fast CSS
    const fastCSSURL = document.querySelector("#fastCSSURL") as HTMLInputElement
    fastCSSURL?.addEventListener("change", e => config.set("fastCSS.url", (e.target as HTMLInputElement).value))
    fastCSSURL!.value = config.get("fastCSS.url") as string

    const fastCSSValue = document.querySelector("#fastCSSValue") as HTMLTextAreaElement
    fastCSSValue?.addEventListener("input", e => config.set("fastCSS.value", (e.target as HTMLInputElement).value))
    fastCSSValue!.value = config.get("fastCSS.value") as string

    const enableFastCSS = document.querySelector("#enableFastCSS") as HTMLInputElement

    for (const id of ["enableFastCSS", "fastCSSURL", "fastCSSValue"]) {
        const eventType = id === "enableFastCSS" ? "change" : "input"
        document.querySelector(`#${id}`)?.addEventListener(eventType, () => {
            ipcRenderer.send("change-fast-css", enableFastCSS.checked, fastCSSURL.value, fastCSSValue.value)
        })
    }

    const toggleFastCSS = () => {
        const checked = enableFastCSS?.checked
        fastCSSURL.disabled = !checked
        fastCSSValue.disabled = !checked
        fastCSSURL.classList.toggle("disabled", !checked)
        fastCSSValue.classList.toggle("disabled", !checked)
    }

    toggleFastCSS()
    enableFastCSS.addEventListener("change", toggleFastCSS)

    // Keybinding
    const keybindingCont = document.querySelector("#keybindingBody") as HTMLElement
    const keybindingRow = (name: string, key: string): void => {
        const _inputChild = createEl("input", { type: "text", value: key }) as HTMLInputElement
        _inputChild.addEventListener("keydown", e => {
            e.preventDefault()
            _inputChild.value = e.code
            config.set(`keybinding.content.${name}`, e.code)
            restartMessage()
        })

        const _name = createEl("td", { textContent: name })
        const _input = createEl("td", {}, "", [_inputChild])
        const tr = createEl("tr", {}, "", [_name, _input])

        keybindingCont.appendChild(tr)
    }

    const { content: c2 } = config.get("keybinding") as { content: Record<string, string> }
    if (keybindingCont.children.length === 0) for (const key in c2) keybindingRow(key, c2[key])

    const _enableKeybinding = document.querySelector("#enableKeybinding") as HTMLInputElement
    const _keybindingTable = document.querySelector("#keybindingTable") as HTMLElement

    const toggleKeybinding = () => {
        const checked = _enableKeybinding.checked
        _keybindingTable.classList.toggle("disabled", !checked)
        for (const item of Array.from(_keybindingTable.querySelectorAll("input"))) item.disabled = !checked
    }

    toggleKeybinding()
    _enableKeybinding.addEventListener("change", toggleKeybinding)
}

export default generateConfigs