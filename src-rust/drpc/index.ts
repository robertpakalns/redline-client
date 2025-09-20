import { createRequire } from "module";
import triplet from "../triplet.js";
import { fromRoot } from "../../src/utils/functions.js";

const modulePath = fromRoot(`./src-rust/drpc/drpc.${triplet()}.node`);
const require = createRequire(import.meta.url);

const { init, setStatus } = require(modulePath);
export { init, setStatus };
