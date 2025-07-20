import { createEl, sessionFetch, getAsset } from "../../utils/functions.js"

interface UpdateEntry {
    version: string
    date: string
    description: string[]
}

let data: UpdateEntry[] | null = null

const createChangelogSection = async () => {
    if (data) return

    const _section = document.getElementById("clientUpdates") as HTMLElement
    const _text = _section.querySelector("#clientUpdatesText") as HTMLElement

    // Load data
    const _spin = createEl("div", {}, "spin")
    const _loading = createEl("div", {}, "loader", [_spin])

    _text.appendChild(_loading)
    data = await sessionFetch(getAsset("redline/redlineUpdates.json"))
    _text.removeChild(_loading)

    // Render page
    if (!data) return

    for (const update of data) {
        const title = createEl("h3", {}, "updatesTitle", [`${update.version} - ${update.date}`])
        const description = createEl("ul")

        for (const list of update.description) description.appendChild(createEl("li", {}, "", [list]))

        const cont = createEl("div", {}, "updatesCont", [title, description])
        _text.append(cont)

        const _nav = createEl("button", {}, "", [update.version])
        _nav.addEventListener("click", () => cont.scrollIntoView({ behavior: "smooth" }))

        _section.querySelector("#clientUpdatesNavigator")?.append(_nav)
    }
}

export default createChangelogSection