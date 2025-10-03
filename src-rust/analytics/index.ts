import { loadModule } from "../triplet.js";

const { setEntry, setLastEntry, getAllData, setTimeOffset } = loadModule<{
  setEntry: Function;
  setLastEntry: Function;
  getAllData: Function;
  setTimeOffset: Function;
}>("analytics");

export { setEntry, setLastEntry, getAllData, setTimeOffset };
