import { dialog } from "electron"
import { getIcon } from "./functions.js"

export const confirmAction = (message, callback) => {
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
export const openDialogModal = callback => dialog.showOpenDialog(f).then(({ canceled, filePaths }) => {
    if (!canceled && filePaths.length > 0) callback(filePaths[0])
})

export const saveDialogModal = callback => dialog.showSaveDialog(f).then(({ canceled, filePath }) => {
    if (!canceled && filePath) callback(filePath)
})