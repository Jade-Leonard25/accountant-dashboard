let electron = require("electron");
// electron/preload.js
electron.contextBridge.exposeInMainWorld("windowControls", {
	minimize: () => electron.ipcRenderer.send("window:minimize"),
	maximize: () => electron.ipcRenderer.send("window:maximize"),
	close: () => electron.ipcRenderer.send("window:close"),
	onMaximizeChange: (cb) => {
		const handler = (_e, isMax) => cb(isMax);
		electron.ipcRenderer.on("window:maximized", handler);
		return () => electron.ipcRenderer.removeListener("window:maximized", handler);
	}
});
