import { Config, defaultConfig } from "./config.js";
import { app, BrowserWindow, ipcMain } from "electron";

const config = new Config();

const keybinding = (mainWindow: BrowserWindow): void => {
  const { webContents } = mainWindow;

  let enabled = config.get("keybinding.enable") ?? true;

  // An object of keybinds
  let k = (
    enabled
      ? (config.get("keybinding.content") as Record<string, string>)
      : defaultConfig.keybinding.content
  ) as {
    CloseModal: string;
    MenuModal: string;
    Reload: string;
    Fullscreen: string;
    DevTools: string;
  };

  const newSet = () =>
    new Set<string>([k.MenuModal, k.Reload, k.Fullscreen, k.DevTools]);

  let keySet = newSet();
  let justChanged = new Set<string>();

  ipcMain.on("change-keybind", (_, key: keyof typeof k, value: string) => {
    k[key] = value;
    keySet = newSet();
    justChanged.add(value);

    if (key === "MenuModal")
      mainWindow.webContents.send("new-menu-modal-key", value);
  });

  ipcMain.on("toggle-keybind-enable", (_, value: boolean) => {
    enabled = value;

    k = (
      enabled
        ? config.get("keybinding.content")
        : defaultConfig.keybinding.content
    ) as typeof k;

    keySet = newSet();

    mainWindow.webContents.send("new-menu-modal-key", k.MenuModal);
  });

  webContents.on("before-input-event", (e, input) => {
    if (keySet.has(input.code)) e.preventDefault();

    if (justChanged.has(input.code)) {
      if (input.type === "keyUp") justChanged.delete(input.code);
      return;
    }

    if (input.code === "F4" && input.alt) {
      e.preventDefault();
      app.quit();
    }

    if (input.control && input.shift && input.key.toLowerCase() === "c") {
      e.preventDefault();
      webContents.toggleDevTools();
    }

    if (
      input.code !== k.CloseModal &&
      input.code === "Escape" &&
      input.type === "keyUp"
    )
      return webContents.send("toggle-window", "null");

    switch (input.code) {
      case k.CloseModal:
        if (input.type === "keyUp") webContents.send("toggle-window", "null");
        break;
      case k.MenuModal:
        webContents.send("toggle-window", "menuModal");
        break;
      case k.Reload:
        webContents.reload();
        break;
      case k.Fullscreen:
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        break;
      case k.DevTools:
        webContents.toggleDevTools();
        break;
    }
  });
};

export default keybinding;
