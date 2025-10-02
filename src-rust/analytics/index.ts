import { loadModule } from "../triplet.js";

const { setEntry, setLastEntry, getAllData } = loadModule<{
  setEntry: Function;
  setLastEntry: Function;
  getAllData: Function;
}>("analytics");

export { setEntry, setLastEntry, getAllData };
