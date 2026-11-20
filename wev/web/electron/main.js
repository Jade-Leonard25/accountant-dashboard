import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = 5173
const DEV_URL = `http://localhost:${PORT}`

let win

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // required for an ESM preload script
    },
  })

  if (!app.isPackaged) {
    win.webContents.on('before-input-event', (event, input) => {
      const isInspectShortcut =
        input.type === 'keyDown' &&
        (input.key === 'F12' ||
          (input.shift &&
            input.alt === (process.platform === 'darwin') &&
            input.control === (process.platform !== 'darwin') &&
            input.key.toLowerCase() === 'i'))

      if (isInspectShortcut) {
        event.preventDefault()
        win.webContents.openDevTools()
      }
    })

    win.webContents.on('context-menu', (_event, params) => {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Inspect Element',
          click: () => {
            win.webContents.inspectElement(params.x, params.y)
          },
        },
      ])
      contextMenu.popup()
    })

    win.loadURL(DEV_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.on('maximize', () => win.webContents.send('window:maximized', true))
  win.on('unmaximize', () => win.webContents.send('window:maximized', false))
}

ipcMain.on('window:minimize', () => win?.minimize())
ipcMain.on('window:maximize', () => {
  if (!win) return
  win.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.on('window:close', () => win?.close())

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})