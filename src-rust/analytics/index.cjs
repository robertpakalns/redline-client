const { default: triplet } = require("../triplet.js")
const { join } = require("path")

const { setEntry, setLastEntry, getAllData } = require(join(__dirname, `analytics.${triplet()}.node`))
module.exports = { setEntry, setLastEntry, getAllData }