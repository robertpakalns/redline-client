import type { IConfig, ConfigType } from "../utils/config";
import { ipcRenderer } from "electron";

let cache: IConfig;
ipcRenderer.invoke("config-get-all").then((config: IConfig) => {
  cache = config;
});

const get = (key: string): ConfigType => {
  return key.split(".").reduce((obj: any, k) => obj?.[k], cache);
};

const set = async (key: string, value: string | boolean): Promise<void> => {
  await ipcRenderer.invoke("config-set", key, value);
  updateCache(key, value);
};

const updateCache = (key: string, value: any): void => {
  const keys = key.split(".");
  const last = keys.pop()!;

  let target: any = cache;

  for (const k of keys) {
    target = target[k];
  }

  target[last] = value;
};

export const config = {
  get,
  set,
};
