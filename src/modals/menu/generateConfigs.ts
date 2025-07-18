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
}

export default generateConfigs