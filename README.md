# Display Desktop Stickers on your monitors
- Persistent over other applications

## Last working version:
https://github.com/michaelheinhold/desktop-stickers/tree/7bf55f2a3c97538bf64a6dae5c00ad6eca362ec8
Current version does not have persisitence and is very hard to use because it covers all monitors. Dragging and dropping requires holding mouse and engaing keys at the same time, after grabbing file.

## How to use:
- npm start
- from second monitor drag image to primary monitor to place sticker (can be a GIF Image etc)
- drag sticker to wanted place
- Ctrl+shift+L to enable click thru
- Enjoy
- Ctrl+c in terminal to close application (or hover icon on taskbar and X from there)

This is very rudimentary and not polished at all, you're expected to know some coding to operate. More updates in the future for polish

### Switching from primary to secondary monitor
Largely depends on how your monitors are plugged into your GPU.
First you are going to want to console.log the 'displays' object and find which index your preffered monitor is.
Once you know that, copy this file and adjust the index used on the line ```secondaryDisplays = displays[x] (line 16)```
```
const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, screen } = require("electron")
const fs = require("fs")
const path = require("path")

// win object for scope
let win
let clickThrough = false

const SAVE_PATH = path.join(app.getPath("userData"), "stickers.json")
const STICKER_DIR = path.join(app.getPath("userData"), "stickers")

// app window
function createWindow() {
  const displays = screen.getAllDisplays()
  // for me only
  secondaryDisplay = displays[0]
  // windows = displays.map(d => {
    const { x, y, width, height } = secondaryDisplay.workArea
    win = new BrowserWindow({
      x,
      y,
      width,
      height,
      transparent:true,
      frame: false,
      alwaysOnTop: true,
      resizable:true,
      hasShadow:false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation:false
      }
    })

    // win.displayId = d.id

    win.loadFile("index.html")
    // return win
  // });


  // shortcut for click through
  globalShortcut.register("CommandOrControl+Shift+L", () => {
    clickThrough = !clickThrough
    win.setIgnoreMouseEvents(clickThrough, { forward: true })
    // windows.forEach(w =>
    //   w.setIgnoreMouseEvents(clickThrough, { forward: true })
    // )
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
```
