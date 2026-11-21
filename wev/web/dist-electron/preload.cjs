let electron = require("electron");
// electron/preload.js
electron.contextBridge.exposeInMainWorld("windowControls", {
	minimize: () => electron.ipcRenderer.send("window:minimize"),
	maximize: () => electron.ipcRenderer.send("window:maximize"),
	close: () => electron.ipcRenderer.invoke("window:close"),
	onMaximizeChange: (cb) => {
		const handler = (_e, isMax) => cb(isMax);
		electron.ipcRenderer.on("window:maximized", handler);
		return () => electron.ipcRenderer.removeListener("window:maximized", handler);
	},
	getAdminRegistered: () => electron.ipcRenderer.invoke("auth:get-admin-registered"),
	markAdminRegistered: () => electron.ipcRenderer.invoke("auth:mark-admin-registered"),
	getSettings: () => electron.ipcRenderer.invoke("settings:get"),
	setStayLoggedIn: (enabled) => electron.ipcRenderer.invoke("settings:set-stay-logged-in", enabled),
	onPrepareClose: (cb) => {
		const handler = () => cb();
		electron.ipcRenderer.on("auth:prepare-close", handler);
		return () => electron.ipcRenderer.removeListener("auth:prepare-close", handler);
	},
	onCloseFailed: (cb) => {
		const handler = (_event, message) => cb(message);
		electron.ipcRenderer.on("auth:close-failed", handler);
		return () => electron.ipcRenderer.removeListener("auth:close-failed", handler);
	},
	closeReady: () => electron.ipcRenderer.send("auth:close-ready"),
	closeFailed: (message) => electron.ipcRenderer.send("auth:close-failed", message)
});
