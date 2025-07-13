import { userScriptsPath } from "../../utils/userscripts.js"
import { createEl } from "../../utils/functions.js"
import { readFileSync, writeFileSync } from "fs"

const createUserscriptsBlock = () => {
    const userScriptsConfig = JSON.parse(readFileSync(userScriptsPath, "utf8"))
    const { enable: userScriptsEnabled, scripts, styles } = userScriptsConfig

    const cont = document.getElementById("userscriptsBlock")

    const userScriptsInit = (obj, id) => {
        const _block = cont.querySelector(`#${id}`)

        if (Object.keys(obj).length === 0) {
            _block.innerText = "..."
            return
        }

        if (_block.children.length !== 0) return

        for (const key in obj) {
            const _checkbox = createEl("input", { type: "checkbox", checked: obj[key] })
            _checkbox.addEventListener("change", e => {
                obj[key] = e.target.checked
                writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
            })

            const _text = createEl("span", {}, "", [key])
            const _cont = createEl("div", {}, "content", [_checkbox, _text])
            _block.appendChild(_cont)
        }
    }


    userScriptsInit(scripts, "userScripts")
    userScriptsInit(styles, "userStyles")

    const _userScriptsEnabled = cont.querySelector("#userScriptsEnabled")
    _userScriptsEnabled.checked = userScriptsEnabled
    _userScriptsEnabled.addEventListener("change", e => {
        toggleUserScripts()
        userScriptsConfig.enable = e.target.checked
        writeFileSync(userScriptsPath, JSON.stringify(userScriptsConfig, null, 2))
    })

    const toggleUserScripts = () => {
        const checked = _userScriptsEnabled.checked
        cont.querySelector("#userScriptsStyles").classList.toggle("disabled", !checked)
        for (const item of cont.querySelector("#userScripts").querySelectorAll("input")) item.disabled = !checked
        for (const item of cont.querySelector("#userStyles").querySelectorAll("input")) item.disabled = !checked
    }

    toggleUserScripts()
}

export default createUserscriptsBlock