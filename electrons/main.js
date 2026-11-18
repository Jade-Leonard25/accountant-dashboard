import { app, BrowserWindow, ipcMain, safeStorage,protocol } from "electron";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { serve } from "@hono/node-server";
import { startAuthServer } from "./server/auth-server.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.VITE_DEV_SERVER_URL;

const CONFIG_PATH = path.join(app.getPath("userData"), "secure-config.json");

let mainWindow = null;
let splashWindow = null;

/**
 * Retrieves or generates a secure secret using OS-level safeStorage encryption.
 */
function getOrCreateSecureSecret(keyName = "betterAuthSecret") {
  try {
    let config = {};
    if (fs.existsSync(CONFIG_PATH)) {
      const fileData = fs.readFileSync(CONFIG_PATH, "utf-8");
      config = JSON.parse(fileData);
    }

    // If the encrypted secret already exists, decrypt and return it
    if (config[keyName]) {
      const encryptedBuffer = Buffer.from(config[keyName], "base64");

      if (safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(encryptedBuffer);
      } else {
        console.warn(
          "safeStorage encryption is not available. Using stored fallback.",
        );
        return config[keyName];
      }
    }

    // Otherwise, generate a new high-entropy secret
    const rawSecret = crypto.randomBytes(32).toString("hex");

    if (safeStorage.isEncryptionAvailable()) {
      const encryptedBuffer = safeStorage.encryptString(rawSecret);
      config[keyName] = encryptedBuffer.toString("base64");
    } else {
      console.warn(
        "safeStorage encryption is not available. Storing plaintext fallback.",
      );
      config[keyName] = rawSecret;
    }

    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");

    return rawSecret;
  } catch (err) {
    console.error("Failed to manage secure storage secret:", err);
    return crypto.randomBytes(32).toString("hex");
  }
}
protocol.registerSchemesAsPrivileged([
  {
    scheme:"electron_payroll",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  }
])
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
  // 1. Safely generate or retrieve the Better Auth secret via OS keychain
  const authSecret = getOrCreateSecureSecret("betterAuthSecret");
  process.env.BETTER_AUTH_SECRET = authSecret;

  // 2. Start local Hono Auth Server instance
  const serverInstance = startAuthServer();

  // 3. Launch the server locally inside Electron using @hono/node-server
  serve(
    {
      fetch: serverInstance.fetch,
      port: serverInstance.port,
    },
    (info) => {
      console.log(
        `Local Auth Server started successfully on http://localhost:${info.port}`,
      );
    },
  );

  // 4. Initialize windows
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
