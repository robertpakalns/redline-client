import { createEl } from "../utils/functions.js"

const linkedBadge = () => createEl("img", { src: "https://juice.irrvlo.xyz/juicemod.png" }, "redlineBadge")

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
    if (cont.querySelector(".redlineBadge")) return

    const shortIdCont = cont.querySelector(".v-popover .value")!
    if (!shortIdCont) return

    const shortId = shortIdCont.innerHTML.replace("#", "")
    const user = badgesCache.find((el: any) => el.short_id === shortId)
    if (!user) return

    const nameCont = cont.querySelector(".you .nickname")!
    if (!nameCont) return

    // redline://?path=assets/icons/linkedBadge.png

    console.log("profileMenuBadge")
    nameCont.appendChild(linkedBadge())
}

export const mainMenuBadge = (cont: HTMLElement) => {
    cont.querySelectorAll("div")?.forEach((el: HTMLElement) => {
        if (cont.querySelector(".redlineBadge")) return

        const user = badgesCache.find((el: any) => el.short_id === shortIdCache)
        if (!user) return

        console.log("mainMenuBadge")
        el.querySelector(".nickname")!.appendChild(linkedBadge())
    })
}

export const gameLeaderboardBadges = (cont: HTMLElement) => {
    const leftCont = cont.querySelector(".player-left-cont")
    const rightCont = cont.querySelector(".player-right-cont")
    if (!leftCont || !rightCont) return

    const allContainers = [leftCont, rightCont]

    allContainers.forEach(cont => cont.querySelectorAll(".player-cont").forEach((el: any) => {
        const shortIdCont = el.querySelector(".short-id")
        const playerLeft = el.querySelector(".player-left")
        if (!playerLeft) return

        const oldBadge = playerLeft.querySelector(".redlineBadge")

        if (!shortIdCont) {
            if (oldBadge) oldBadge.remove()
            return
        }

        const shortId = shortIdCont.textContent?.replace("#", "").trim()
        if (!shortId) {
            if (oldBadge) oldBadge.remove()
            return
        }

        const user = badgesCache.find((u: any) => u.short_id === shortId)

        if (!user) {
            if (oldBadge) oldBadge.remove()
            return
        }

        if (!oldBadge) playerLeft.appendChild(linkedBadge())
    }))
}