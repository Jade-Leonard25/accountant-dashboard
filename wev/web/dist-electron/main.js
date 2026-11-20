import { BrowserWindow as e, app as t, ipcMain as n } from "electron";
import r from "node:path";
import { fileURLToPath as i } from "node:url";
// electron/main.js
var a = r.dirname(i(import.meta.url)), o = "http://localhost:5173", s;
function c() {
	s = new e({
		width: 1200,
		height: 700,
		frame: !1,
		webPreferences: {
			preload: r.join(a, "preload.js"),
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !1
		}
	}), t.isPackaged ? s.loadFile(r.join(a, "../dist/index.html")) : s.loadURL(o), s.on("maximize", () => s.webContents.send("window:maximized", !0)), s.on("unmaximize", () => s.webContents.send("window:maximized", !1));
}
n.on("window:minimize", () => s?.minimize()), n.on("window:maximize", () => {
	s && (s.isMaximized() ? s.unmaximize() : s.maximize());
}), n.on("window:close", () => s?.close()), t.whenReady().then(c), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
});
export {};
