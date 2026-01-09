const { ipcRenderer } = require("electron")

let dragging = null

// create sticker
function createSticker(src, x = 100, y = 100, scale = 1) {
  const sticker = document.createElement("div")
  sticker.className = "sticker"
  sticker.style.left = `${x}px`
  sticker.style.top = `${y}px`
  sticker.dataset.scale = scale

  const img = document.createElement("img")
  //C:\\Users\\micha\\Pictures\\stickers\\
  img.src = `${src}`
  img.style.transform = `scale(${scale})`
  img.draggable = false

  sticker.appendChild(img)
  document.body.appendChild(sticker)
}

// save sticker for persistence
function saveStickers() {
  const data = [...document.querySelectorAll(".sticker")].map(sticker => {
    const img = sticker.querySelector("img")
    return {
      src: img.src,
      x: sticker.offsetLeft,
      y: sticker.offsetTop,
      scale: Number(sticker.dataset.scale || 1)
    }
  })

  ipcRenderer.send("save-stickers", data)
}


// event listeners

// start dragging
document.addEventListener("mousedown", e => {
  const sticker = e.target.closest(".sticker")
  if (!sticker) return

  dragging = {
    el: sticker,
    startX: e.clientX,
    startY: e.clientY,
    originX: sticker.offsetLeft,
    originY: sticker.offsetTop
  }
})

// movement while dragging
document.addEventListener("mousemove", e => {
  if (!dragging) return

  dragging.el.style.left =
    dragging.originX + (e.clientX - dragging.startX) + "px"

  dragging.el.style.top =
    dragging.originY + (e.clientY - dragging.startY) + "px"
})

// stop dragging
document.addEventListener("mouseup", () => {
  dragging = null
  saveStickers()
})

// grabbing file to drop
document.body.addEventListener("dragover", e => {
  e.preventDefault()
})

// drop file (add to canvas)
document.body.addEventListener("drop", e => {
  e.preventDefault()

  for (const file of e.dataTransfer.files) {
    if (!file.type.startsWith("image/")) continue
    const url = URL.createObjectURL(file)
    createSticker(url, e.clientX, e.clientY)
  }

  saveStickers()
})

// click through event listner
document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
    ipcRenderer.send("toggle-click-through")
  }
})

// render previous stickers
window.addEventListener("DOMContentLoaded", async () => {
  const stickers = await ipcRenderer.invoke("load-stickers")
  for (const s of stickers) {
    createSticker(s.src, s.x, s.y, s.scale)
  }
})