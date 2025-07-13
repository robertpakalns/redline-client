import { createEl, restartMessage } from "../../utils/functions.js"
import { Config } from "../../utils/config.js"
import { ipcRenderer } from "electron"

import createUserscriptsBlock from "./userscripts.js"

const config = new Config

const createCustomizationSection = cont => {

    // Userscripts
    createUserscriptsBlock()

    // Fast CSS
    const fastCSSURL = cont.querySelector("#fastCSSURL")
    fastCSSURL.addEventListener("change", e => config.set("fastCSS.url", e.target.value))
    fastCSSURL.value = config.get("fastCSS.url")

    const fastCSSValue = cont.querySelector("#fastCSSValue")
    fastCSSValue.addEventListener("input", e => config.set("fastCSS.value", e.target.value))
    fastCSSValue.value = config.get("fastCSS.value")

    const enableFastCSS = cont.querySelector("#enableFastCSS")

    for (const id of ["enableFastCSS", "fastCSSURL", "fastCSSValue"]) {
        const eventType = id === "enableFastCSS" ? "change" : "input"
        cont.querySelector(`#${id}`).addEventListener(eventType, () => {
            ipcRenderer.send("change-fast-css", enableFastCSS.checked, fastCSSURL.value, fastCSSValue.value)
        })
    }

    const toggleFastCSS = () => {
        const checked = enableFastCSS.checked
        fastCSSURL.disabled = !checked
        fastCSSValue.disabled = !checked
        fastCSSURL.classList.toggle("disabled", !checked)
        fastCSSValue.classList.toggle("disabled", !checked)
    }

    toggleFastCSS()
    enableFastCSS.addEventListener("change", toggleFastCSS)

    // Keybinding
    const keybindingCont = cont.querySelector("#keybindingBody")
    const keybindingRow = (name, key) => {
        const _inputChild = createEl("input", { type: "text", value: key })
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

    const { content: c2 } = config.get("keybinding")
    if (keybindingCont.children.length === 0) for (const key in c2) keybindingRow(key, c2[key])

    const _enableKeybinding = cont.querySelector("#enableKeybinding")
    const _keybindingTable = cont.querySelector("#keybindingTable")

    const toggleKeybinding = () => {
        const checked = _enableKeybinding.checked
        _keybindingTable.classList.toggle("disabled", !checked)
        for (const item of _keybindingTable.querySelectorAll("input")) item.disabled = !checked
    }

    toggleKeybinding()
    _enableKeybinding.addEventListener("change", toggleKeybinding)
}

export default createCustomizationSection