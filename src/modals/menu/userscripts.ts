import settingsJson from "../../../assets/userscriptsSettings.json" with { type: "json" }
import { appendConfig, Setting, sendNotification } from "./generateConfigs"
import { userScriptsPath, ScriptMeta } from "../../utils/userscripts"
import { createEl } from "../../utils/functions"
import { readFileSync, writeFileSync } from "fs"
import { configDir } from "src/utils/config"
import { shell } from "electron"
import { join } from "path"

const data = settingsJson as Setting[]

const appendUserscriptConfig = (meta: ScriptMeta, configCont: HTMLElement): void => {
    const parentCont = document.querySelector(`div[name=userscriptsSection] > div.userscriptsCont`)

    const name = createEl("div", {}, "name", [meta.name])
    const description = createEl("div", {}, "subText", [`${meta.description} | by ${meta.authors}`])
    const category = createEl("div", {}, "category", [meta.category])
    const open = createEl("a", {}, "", ["Open"])
    open.addEventListener("click", () => shell.openPath(join(configDir, "scripts", meta.file)))

    const requires = createEl("div", {}, "refresh", ["Requires page refresh"])

    const upCont = createEl("div", {}, "upCont", [name, requires, category])
    const downCont = createEl("div", {}, "downCont", [description, open])

    const leftCont = createEl("div", {}, "leftCont", [upCont, downCont])
    const cont = createEl("div", {}, "configCont", [leftCont, configCont])

    parentCont?.appendChild(cont)
}

let loaded = false
const createUserscriptsSection = () => {
    if (loaded) return
    loaded = true

    const userScriptsConfig = JSON.parse(readFileSync(userScriptsPath, "utf8"))
    const { enable: userScriptsEnabled, scripts, styles } = userScriptsConfig

    const userscriptsInit = (arr: ScriptMeta[]): void => {
        const _block = document.querySelector(`div[name=userscriptsSection] > div.userscriptsCont`) as HTMLElement

        if (arr.length === 0) {
            _block!.innerText = "No .js files found"
            return
        }

        for (const el of arr) {
            const _checkbox = createEl("input", { type: "checkbox", checked: el.enabled })
            _checkbox.addEventListener("change", e => {
                el.enabled = (e.target as HTMLInputElement).checked
                writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
                sendNotification("refresh")
            })

            appendUserscriptConfig(el, _checkbox)
        }
    }

    const userstylesInit = (obj: Record<string, boolean>): void => {
        const _block = document.querySelector(`#userStyles`) as HTMLElement

        if (Object.keys(obj).length === 0) {
            _block!.innerText = "No .css files found"
            return
        }

        if (_block?.children.length !== 0) return

        for (const key in obj) {
            const _checkbox = createEl("input", { type: "checkbox", checked: obj[key] })
            _checkbox.addEventListener("change", e => {
                obj[key] = (e.target as HTMLInputElement).checked
                writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
                sendNotification("refresh")
            })

            const _text = createEl("span", {}, "", [key])
            const _cont = createEl("div", {}, "content", [_checkbox, _text])
            _block.appendChild(_cont)
        }
    }

    userscriptsInit(scripts)
    userstylesInit(styles)

    const userscriptsEnabled = createEl("input", { type: "checkbox" }, "", []) as HTMLInputElement

    userscriptsEnabled!.checked = userScriptsEnabled
    userscriptsEnabled!.addEventListener("change", e => {
        // toggleUserScripts()
        userScriptsConfig.enable = (e.target as HTMLInputElement).checked
        writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
        sendNotification("refresh")
    })

    appendConfig(data[0], userscriptsEnabled)

    // const toggleUserScripts = () => {
    //     const checked = userscriptsEnabled?.checked
    //     cont.querySelector("#userScriptsStyles")?.classList.toggle("disabled", !checked)
    //     for (const item of Array.from(cont.querySelector("#userScripts")!.querySelectorAll("input"))) item.disabled = !checked
    //     for (const item of Array.from(cont.querySelector("#userStyles")!.querySelectorAll("input"))) item.disabled = !checked
    // }

    // toggleUserScripts()
}

export default createUserscriptsSection