import { createEl } from "../utils/functions.js"

const linkedBadge = createEl("img", { src: "https://juice.irrvlo.xyz/juicemod.png", id: "redlineProfileBadge" }, "redlineBadge")

let badgesCache: Object[] = []
export const getBadges = async () => {
    badgesCache = await fetch("https://redline.tricko.pro/get_data")
        .then(r => r.json())
}

let userCache: Object = {}
let shortIdCache: String = ""
export const getUser = async () => {
    userCache = await fetch(`https://api.kirka.io/api/user`, {
        headers: {
            // The client only uses the token to fetch the account
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    })
        .then(r => r.json())

    shortIdCache = (userCache as any).shortId
}

export const profileMenuBadge = (cont: HTMLElement) => {
    if (cont.querySelector("#redlineProfileBadge")!) return

    const shortIdCont = cont.querySelector(".v-popover .value")!
    if (!shortIdCont) return

    const shortId = shortIdCont.innerHTML.replace("#", "")
    const user = badgesCache.find((el: any) => el.short_id === shortId)
    if (!user) return

    const nameCont = cont.querySelector(".you .nickname")!
    if (!nameCont) return

    // redline://?path=assets/icons/linkedBadge.png
    nameCont.appendChild(linkedBadge)
}

export const mainMenuBadge = (cont: HTMLElement) => {
    const user = badgesCache.find((el: any) => el.short_id === shortIdCache)
    if (!user) return

    cont.querySelector(".nickname")?.appendChild(linkedBadge)
}