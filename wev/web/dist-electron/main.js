import { BrowserWindow, Menu, app, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
// electron/main.js
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var DEV_URL = `http://localhost:5173`;
var win;
function createWindow() {
	win = new BrowserWindow({
		width: 1e3,
		height: 700,
		frame: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false
		}
	});
	if (!app.isPackaged) {
		win.webContents.on("before-input-event", (event, input) => {
			if (input.type === "keyDown" && (input.key === "F12" || input.shift && input.alt === (process.platform === "darwin") && input.control === (process.platform !== "darwin") && input.key.toLowerCase() === "i")) {
				event.preventDefault();
				win.webContents.openDevTools();
			}
		});
		win.webContents.on("context-menu", (_event, params) => {
			Menu.buildFromTemplate([{
				label: "Inspect Element",
				click: () => {
					win.webContents.inspectElement(params.x, params.y);
				}
			}]).popup();
		});
		win.loadURL(DEV_URL);
	} else win.loadFile(path.join(__dirname, "../dist/index.html"));
	win.on("maximize", () => win.webContents.send("window:maximized", true));
	win.on("unmaximize", () => win.webContents.send("window:maximized", false));
}
ipcMain.on("window:minimize", () => win?.minimize());
ipcMain.on("window:maximize", () => {
	if (!win) return;
	win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on("window:close", () => win?.close());
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
export {};
