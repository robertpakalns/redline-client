import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

export interface IConfig {
    client: {
        firstJoin: boolean
        adblocker: boolean
        fpsUncap: boolean
        fullscreen: boolean
        swapper: boolean
        domain: string
    }
    interface: {
        modalHint: boolean
        kdRatio: boolean
    }
    discord: {
        joinButton: boolean
    }
    fastCSS: {
        enable: boolean
        url: string
        value: string
    }
    keybinding: {
        enable: boolean
        content: {
            CloseModal: string
            MenuModal: string
            Reload: string
            Fullscreen: string
            DevTools: string
        }
    }
}

export type ConfigType = string | object | boolean | undefined

export const defaultConfig: IConfig = {
    client: {
        firstJoin: true,
        adblocker: true,
        fpsUncap: true,
        fullscreen: false,
        swapper: false,
        domain: "kirka.io"
    },
    interface: {
        modalHint: true,
        kdRatio: true
    },
    discord: {
        joinButton: true
    },
    fastCSS: {
        enable: false,
        url: "",
        value: ""
    },
    keybinding: {
        enable: false,
        content: {
            CloseModal: "Escape",
            MenuModal: "F1",
            Reload: "F5",
            Fullscreen: "F11",
            DevTools: "F12"
        }
    }
}

export const configDir: string = join(homedir(), "Documents/RedlineClient")
export const configPath: string = join(configDir, "config.json")
if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true })
if (!existsSync(configPath)) writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))

export class Config {
    private static instance: IConfig | null = null
    static file = configPath
    private config: IConfig

    constructor() {
        if (Config.instance) this.config = Config.instance
        else {
            try {
                this.config = JSON.parse(readFileSync(Config.file, "utf8"))
                this.fillConfig()
                this.cleanConfig()
                Config.instance = this.config
            }
            catch {
                this.config = defaultConfig
                Config.instance = defaultConfig
                this.writeConfig()
            }
        }
    }

    writeConfig(obj: IConfig = this.config) {
        writeFileSync(Config.file, JSON.stringify(obj, null, 2))
    }

    get(key: string): ConfigType {
        const keys = key.split(".")
        let result: any = this.config

        for (const k of keys) {
            if (result == null || typeof result !== "object") return undefined
            result = result[k]
        }

        return result as ConfigType
    }

    set(key: string, value: string | boolean): void {
        const keys = key.split(".")
        const lastKey = keys.pop()

        let result: any = this.config
        for (const k of keys) {
            if (typeof result[k] !== "object" || result[k] === null) result[k] = {}
            result = result[k]
        }
        result[lastKey!] = value

        this.writeConfig()
    }

    default(): void {
        this.config = defaultConfig
        this.writeConfig()
    }

    // Fills the config with default values if missing
    private fillConfig(source: Record<string, any> = defaultConfig, target: Record<string, any> = this.config): void {
        const originalConfig = JSON.stringify(target)

        for (const key in source) {
            const s = source[key]
            const t = target[key]

            if (typeof s === "object" && s !== null) {
                if (typeof t !== "object" || t === null) target[key] = {}
                this.fillConfig(s, target[key])
            }
            else if (t === undefined) target[key] = s
        }

        if (originalConfig !== JSON.stringify(target)) this.writeConfig(target as IConfig)
    }

    // Cleans the config from unregistered values
    private cleanConfig(source: Record<string, any> = defaultConfig, target: Record<string, any> = this.config): void {
        const originalConfig = JSON.stringify(target)

        for (const key in target) {
            if (!(key in source)) delete target[key]
            else if (typeof source[key] === "object" && source[key] !== null) this.cleanConfig(source[key], target[key])
        }

        if (originalConfig !== JSON.stringify(target)) this.writeConfig(target as IConfig)
    }
}