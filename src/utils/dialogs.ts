import { dialog } from "electron"
import { getIcon } from "./functions"

type Callback<T = string> = (filePath: T) => void

export const confirmAction = (message: string, callback: () => void) => {
    const result = dialog.showMessageBoxSync({
        type: "question",
        buttons: ["Yes", "No"],
        defaultId: 1,
        icon: getIcon(),
        title: "Redline Client | Confirm",
        message
    })
    if (result === 0) callback()
}

const f = { filters: [{ name: "JSON Files", extensions: ["json"] }] }
export const openDialogModal = (callback: Callback): void => {
    dialog.showOpenDialog(f).then(({ canceled, filePaths }) => {
        if (!canceled && filePaths.length > 0) callback(filePaths[0])
    })
}

export const saveDialogModal = (callback: Callback): void => {
    dialog.showSaveDialog(f).then(({ canceled, filePath }) => {
        if (!canceled && filePath) callback(filePath)
    })
}