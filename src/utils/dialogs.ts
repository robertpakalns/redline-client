import { getIcon } from "./functions.js";
import { dialog } from "electron";

type Callback = (filePath: string) => void;

export const confirmAction = (message: string, callback: () => void) => {
  const result = dialog.showMessageBoxSync({
    type: "question",
    buttons: ["Yes", "No"],
    defaultId: 1,
    icon: getIcon(),
    title: "Redline Client | Confirm",
    message,
  });
  if (result === 0) callback();
};

const f = { filters: [{ name: "JSON Files", extensions: ["json"] }] };
export const openDialogModal = (callback: Callback): void => {
  dialog.showOpenDialog(f).then(({ canceled, filePaths }) => {
    if (!canceled && filePaths.length > 0) callback(filePaths[0]);
  });
};

export const saveDialogModal = (callback: Callback): void => {
  dialog.showSaveDialog(f).then(({ canceled, filePath }) => {
    if (!canceled && filePath) callback(filePath);
  });
};

export const errorModal = (code: number): void => {
  if (code === -105)
    dialog.showErrorBox(
      "Connection Error: ERR_NAME_NOT_RESOLVED",
      "The Kirka.io proxy domain is unavailable.\n" +
        "Please change it manually in config.json.",
    );
};
