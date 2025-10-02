import { loadModule } from "../triplet.js";

const { init, setStatus } = loadModule<{
  init: Function;
  setStatus: Function;
}>("drpc");

export { init, setStatus };
