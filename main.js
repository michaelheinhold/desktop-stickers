const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut } = require("electron")
const fs = require("fs")
const path = require("path")

// win object for scope
let win
let clickThrough = false

const SAVE_PATH = path.join(app.getPath("userData"), "stickers.json")
const STICKER_DIR = path.join(app.getPath("userData"), "stickers")

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

  // shortcut for click through
  globalShortcut.register("CommandOrControl+Shift+L", () => {
    clickThrough = !clickThrough
    win.setIgnoreMouseEvents(clickThrough, { forward: true })
  })
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

ipcMain.handle("import-sticker", async (_, payload) => {
  const { name, buffer } = payload

  const ext = path.extname(name)
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${ext}`

  const dest = path.join(STICKER_DIR, filename)

  fs.writeFileSync(dest, Buffer.from(buffer))

  return dest
})

app.whenReady().then(()=>{
  createWindow()
})