const { default: triplet } = require("../triplet.js")
const { join } = require("path")

const { init, setStatus } = require(join(__dirname, `drpc.${triplet()}.node`))
module.exports = { init, setStatus }