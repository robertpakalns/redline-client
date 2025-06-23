import { fromRoot, createEl } from "../../utils/functions.js"
import { readFileSync } from "fs"

const createChangelogSection = async () => {

    const _section = document.getElementById("clientUpdates")
    const _text = _section.querySelector("#clientUpdatesText")

    const data = JSON.parse(readFileSync(fromRoot("assets/changelog.json"), "utf8"))

    // Render page
    for (const update of data) {
        const title = createEl("h3", {}, "updatesTitle", [`${update.version} - ${update.date}`])
        const description = createEl("ul")

        for (const list of update.description) description.appendChild(createEl("li", {}, "", [list]))

        const cont = createEl("div", {}, "updatesCont", [title, description])
        _text.append(cont)

        const _nav = createEl("button", {}, "", [update.version])
        _nav.addEventListener("click", () => cont.scrollIntoView({ behavior: "smooth" }))

        _section.querySelector("#clientUpdatesNavigator").append(_nav)
    }
}

export default createChangelogSection