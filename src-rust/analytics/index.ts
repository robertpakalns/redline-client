import { createRequire } from "module";
import triplet from "../triplet.js";
import { fromRoot } from "../../src/utils/functions.js";

const modulePath = fromRoot(`./src-rust/analytics/analytics.${triplet()}.node`);
const r = createRequire(import.meta.url);

const { setEntry, setLastEntry, getAllData } = r(modulePath);
export { setEntry, setLastEntry, getAllData };
