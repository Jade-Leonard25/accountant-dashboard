import { app, BrowserWindow, ipcMain, protocol, safeStorage, net } from "electron";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { serve } from "@hono/node-server";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.VITE_DEV_SERVER_URL;

const CONFIG_PATH = path.join(app.getPath("userData"), "secure-config.json");

let mainWindow = null;
let splashWindow = null;

function getOrCreateSecureSecret(keyName = "betterAuthSecret") {
  try {
    let config = {};
    if (fs.existsSync(CONFIG_PATH)) {
      const fileData = fs.readFileSync(CONFIG_PATH, "utf-8");
      config = JSON.parse(fileData);
    }

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
    scheme: "electronpayroll",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  },
]);

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    frame: false,
    transparent: true,
    show: false,
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

  splashWindow.webContents.on("dom-ready", () => {
    splashWindow?.webContents.insertCSS(
      "html, body, #root { background: transparent !important; overflow: hidden !important; }",
    );
  });

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
    show: false,
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
  const authSecret = getOrCreateSecureSecret("betterAuthSecret");
  process.env.BETTER_AUTH_SECRET = authSecret;

  const PORT = process.env.PORT || 4012;

  protocol.handle("electronpayroll", async (request) => {
    try {
      const cleanUrl = request.url.replace(/^electronpayroll:\/\//, "");
      const targetUrl = cleanUrl.startsWith("http")
        ? cleanUrl
        : `http://localhost:${PORT}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;

      const fetchOptions = {
        method: request.method,
        headers: request.headers,
      };

      if (request.body && request.method !== "GET" && request.method !== "HEAD") {
        fetchOptions.body = request.body;
      }

      const response = await net.fetch(targetUrl, fetchOptions);

      return response;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message || "Proxy connection failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  });

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
