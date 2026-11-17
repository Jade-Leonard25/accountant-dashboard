import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.VITE_DEV_SERVER_URL;

let mainWindow = null;
let splashWindow = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    frame: false,
    transparent: true,
    show: false, // don't show the empty window; reveal after the logo has painted
    center: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    webPreferences: {
      contextIsolation: true,
    },
  });

  // Strip any app background before first paint so only the logo is visible
  splashWindow.webContents.on("dom-ready", () => {
    splashWindow?.webContents.insertCSS(
      "html, body, #root { background: transparent !important; overflow: hidden !important; }",
    );
  });

  // Show only once the page (and logo) finished loading, with a tiny delay so the image is drawn
  splashWindow.webContents.once("did-finish-load", () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) splashWindow.show();
    }, 150);
  });

  if (isDev) {
    splashWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/splash`);
  } else {
    splashWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "splash",
    });
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    frame: false,
    backgroundColor: "#060911",
    show: false, // Keep hidden while loading in the background
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Once the main app is fully loaded, safely close the splash window and reveal the main window
  mainWindow.once("ready-to-show", () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
      }
    }, 1200);
  });

  // Window control IPC handlers
  ipcMain.on("window-minimize", () => mainWindow?.minimize());
  ipcMain.on("window-maximize", () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on("window-close", () => mainWindow?.close());
}

app.whenReady().then(() => {
  createSplashWindow();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashWindow();
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
