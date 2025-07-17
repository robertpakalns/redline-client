import { createRequire } from "module"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import triplet from "../triplet.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const modulePath = join(__dirname, `drpc.${triplet()}.node`)
const require = createRequire(import.meta.url)

const { init, setStatus } = require(modulePath)
export { init, setStatus }