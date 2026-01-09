const { ipcRenderer } = require("electron")

let dragging = null
let contextTarget = null

// create sticker
function createSticker(src, x = 100, y = 100, scale = 1) {
  const sticker = document.createElement("div")
  sticker.className = "sticker"
  sticker.style.left = `${x}px`
  sticker.style.top = `${y}px`
  sticker.dataset.scale = scale

  const img = document.createElement("img")
  img.src = src
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

// context menu
function showContextMenu(x, y) {
  removeContextMenu()

  const menu = document.createElement("div")
  menu.className = "context-menu"
  menu.style.left = `${x}px`
  menu.style.top = `${y}px`

  menu.innerHTML = `
    <div id="duplicate">Duplicate</div>
    <div id="delete">Delete</div>
  `

  document.body.appendChild(menu)

  menu.querySelector("#delete").onclick = () => {
    contextTarget.remove()
    saveStickers()
    removeContextMenu()
  }

  menu.querySelector("#duplicate").onclick = () => {
    const img = contextTarget.querySelector("img")
    createSticker(
      img.src,
      contextTarget.offsetLeft + 20,
      contextTarget.offsetTop + 20,
      Number(contextTarget.dataset.scale)
    )
    saveStickers()
    removeContextMenu()
  }

  document.addEventListener("click", removeContextMenu, { once: true })
}

function removeContextMenu() {
  document.querySelector(".context-menu")?.remove()
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
document.body.addEventListener("drop", async e => {
  e.preventDefault()

  for (const file of e.dataTransfer.files) {
    if (!file.type.startsWith("image/")) continue

    const buffer = await file.arrayBuffer()

    const savedPath = await ipcRenderer.invoke("import-sticker", {
      name: file.name,
      buffer
    })

    createSticker(savedPath, e.clientX, e.clientY)
  }

  saveStickers()
})

// click through event listner
document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
    ipcRenderer.send("toggle-click-through")
  }
})

// change sticker size with mousewheel
document.addEventListener("wheel", e => {
  const sticker = e.target.closest(".sticker")
  if (!sticker) return

  e.preventDefault()

  let scale = Number(sticker.dataset.scale || 1)
  scale += e.deltaY * -0.001
  scale = Math.min(Math.max(scale, 0.2), 3)

  sticker.dataset.scale = scale
  sticker.querySelector("img").style.transform = `scale(${scale})`

  saveStickers()
}, { passive: false })

// add context menu
document.addEventListener("contextmenu", e => {
  const sticker = e.target.closest(".sticker")
  if (!sticker) return

  e.preventDefault()
  contextTarget = sticker

  showContextMenu(e.clientX, e.clientY)
})


// render previous stickers
window.addEventListener("DOMContentLoaded", async () => {
  const stickers = await ipcRenderer.invoke("load-stickers")
  for (const s of stickers) {
    createSticker(s.src, s.x, s.y, s.scale)
  }
})