import { Client } from "discord-rpc"

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
}

export default DRPC