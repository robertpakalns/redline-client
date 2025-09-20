import { createRequire } from "module";
import triplet from "../triplet.js";
import { fromRoot } from "../../src/utils/functions.js";

const modulePath = fromRoot(`./src-rust/drpc/drpc.${triplet()}.node`);
const r = createRequire(import.meta.url);

const { init, setStatus } = r(modulePath);
export { init, setStatus };
