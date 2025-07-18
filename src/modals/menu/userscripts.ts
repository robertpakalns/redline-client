import { userScriptsPath } from "../../utils/userscripts"
import { createEl } from "../../utils/functions"
import { readFileSync, writeFileSync } from "fs"

const createUserscriptsSection = () => {
    const userScriptsConfig = JSON.parse(readFileSync(userScriptsPath, "utf8"))
    const { enable: userScriptsEnabled, scripts, styles } = userScriptsConfig

    const cont = document.getElementById("userscriptsBlock") as HTMLElement

    const userScriptsInit = (obj: Record<string, boolean>, id: string): void => {
        const _block = cont.querySelector(`#${id}`) as HTMLElement

        if (Object.keys(obj).length === 0) {
            _block!.innerText = "..."
            return
        }

        if (_block?.children.length !== 0) return

        for (const key in obj) {
            const _checkbox = createEl("input", { type: "checkbox", checked: obj[key] })
            _checkbox.addEventListener("change", e => {
                obj[key] = (e.target as HTMLInputElement).checked
                writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
            })

            const _text = createEl("span", {}, "", [key])
            const _cont = createEl("div", {}, "content", [_checkbox, _text])
            _block.appendChild(_cont)
        }
    }


    userScriptsInit(scripts, "userScripts")
    userScriptsInit(styles, "userStyles")

    const _userScriptsEnabled = cont.querySelector("#userScriptsEnabled") as HTMLInputElement

    _userScriptsEnabled!.checked = userScriptsEnabled
    _userScriptsEnabled!.addEventListener("change", e => {
        toggleUserScripts()
        userScriptsConfig.enable = (e.target as HTMLInputElement)?.checked
        writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
    })

    const toggleUserScripts = () => {
        const checked = _userScriptsEnabled?.checked
        cont.querySelector("#userScriptsStyles")?.classList.toggle("disabled", !checked)
        for (const item of Array.from(cont.querySelector("#userScripts")!.querySelectorAll("input"))) item.disabled = !checked
        for (const item of Array.from(cont.querySelector("#userStyles")!.querySelectorAll("input"))) item.disabled = !checked
    }

    toggleUserScripts()
}

export default createUserscriptsSection