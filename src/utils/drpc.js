import { Client } from "discord-rpc"
import { URL } from "url"

const staticLinks = {
    "/": "Viewing main lobby",
    "/hub/leaderboard": "Viewing player leaderboard",
    "/hub/clans/champions-league": "Viewing clan leaderboard",
    "/hub/ranked/leaderboard-point3v3": "Viewing ranked leaderboard: Point 3v3",
    "/hub/ranked/leaderboard-sad": "Viewing ranked leaderboard: Search And Destroy",
    "/hub/ranked/leaderboard-1v1": "Viewing ranked leaderboard: 1v1",
    "/hub/clans/my-clan": "Viewing their clan",
    "/hub/market": "Viewing market",
    "/hub/live": "Viewing videos",
    "/hub/news": "Viewing news",
    "/hub/terms": "Viewing terms of service",
    "/store": "Viewing store",
    "/servers/main": "Viewing servers",
    "/servers/parkour": "Viewing parkour servers",
    "/servers/custom": "Viewing custom servers",
    "/quests/hourly": "Viewing hourly quests",
    "/friends": "Viewing their friends",
    "/inventory": "Viewing their inventory"
}

class DRPC {
    constructor() {
        this.protocol = "redline://"
        this.clientId = "1385893715519864933"
        this.client = new Client({ transport: "ipc" })
        this.state = "Playing Kirka.io"
        this.time = Date.now()
        this.connected = false

        this.client.on("ready", () => {
            this.connected = true
            this.setActivity()
        })
        setInterval(() => this.connected && this.setActivity(), 15000) // Updates every 15 seconds

        this.client
            .login({ clientId: this.clientId })
            .catch(() => this.connected = false)
    }

    setActivity() {
        if (!this.connected) return

        this.client.setActivity({
            state: this.state,
            startTimestamp: this.time,
            largeImageKey: "redline",
            buttons: [
                { label: "Download Client", url: "https://github.com/robertpakalns/redline-client/releases/latest" },
                { label: "Community Server", url: "https://discord.gg/cTE6CVuGen" }
            ]

        })
    }

    setState(url) {
        console.log(url)
        const { pathname } = new URL(url)
        if (!this.connected) return

        let result = "Playing Kirka.io"

        if (pathname.startsWith("/games")) {
            result = `Playing a match in ${pathname.split("/").pop().split("~")[0]} server`
        }
        else if (staticLinks[pathname]) result = staticLinks[pathname]

        this.state = result
    }
}

export default DRPC