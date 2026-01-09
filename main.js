const { app, BrowserWindow, ipcMain } = require("electron")
const fs = require("fs")
const path = require("path")

// win object for scope
let win
let clickThrough = false

const SAVE_PATH = path.join(app.getPath("userData"), "stickers.json")

// app window
function createWindow() {
  win = new BrowserWindow({
    width:2560,
    height:600,
    transparent:true,
    frame: true,
    alwaysOnTop: true,
    resizable:true,
    hasShadow:false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation:false
    }
  })

  win.loadFile("index.html")
}

// toggle click through
ipcMain.on("toggle-click-through", () => {
  clickThrough = !clickThrough
  win.setIgnoreMouseEvents(clickThrough, { forward: true })
})

// save + Load stickers from previous times
ipcMain.on("save-stickers", (_, data) => {
  fs.writeFileSync(SAVE_PATH, JSON.stringify(data, null, 2))
})
ipcMain.handle("load-stickers", ()=> {
  if (!fs.existsSync(SAVE_PATH)) return []
  return JSON.parse(fs.readFileSync(SAVE_PATH))
})

app.whenReady().then(createWindow)