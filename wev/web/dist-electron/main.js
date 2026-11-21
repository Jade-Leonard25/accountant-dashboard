import { BrowserWindow as e, app as t, ipcMain as n, session as r } from "electron";
import { mkdir as i, readFile as a, writeFile as o } from "node:fs/promises";
import s from "node:path";
import { fileURLToPath as c } from "node:url";
// electron/main.js
var l = s.dirname(c(import.meta.url)), u = "http://localhost:5173", d = "https://system-payroll-api.automation-payroll.workers.dev", f = "admin-registration-state", p = "app-settings.json", m, h = !1, g = !1;
async function _() {
	let e = s.join(t.getPath("userData"), p);
	try {
		let t = JSON.parse(await a(e, "utf8"));
		return { stayLoggedIn: typeof t.stayLoggedIn != "boolean" || t.stayLoggedIn };
	} catch (e) {
		if (e.code === "ENOENT") return { stayLoggedIn: !0 };
		throw e;
	}
}
async function v(e) {
	let n = t.getPath("userData");
	await i(n, { recursive: !0 }), await o(s.join(n, p), JSON.stringify(e), { mode: 384 });
}
function y() {
	m = new e({
		width: 1200,
		height: 700,
		frame: !1,
		webPreferences: {
			partition: "persist:default",
			preload: s.join(l, "preload.cjs"),
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !1
		}
	}), m.webContents.on("preload-error", (e, t, n) => {
		console.error(`Failed to load Electron preload "${t}":`, n);
	}), t.isPackaged ? m.loadFile(s.join(l, "../dist/index.html")) : m.loadURL(u), m.on("maximize", () => m.webContents.send("window:maximized", !0)), m.on("unmaximize", () => m.webContents.send("window:maximized", !1)), m.on("close", (e) => {
		h || (e.preventDefault(), b().catch((e) => {
			console.error("Could not close the app window:", e);
		}));
	});
}
async function b() {
	if (!(!m || m.isDestroyed() || g)) {
		g = !0;
		try {
			let { stayLoggedIn: e } = await _();
			if (e) {
				h = !0, g = !1, m.close();
				return;
			}
			m.webContents.send("auth:prepare-close");
		} catch (e) {
			throw g = !1, m.webContents.send("auth:close-failed", e instanceof Error ? e.message : "Could not read app settings."), e;
		}
	}
}
n.on("window:minimize", () => m?.minimize()), n.on("window:maximize", () => {
	m && (m.isMaximized() ? m.unmaximize() : m.maximize());
}), n.handle("window:close", b), n.on("auth:close-ready", () => {
	h = !0, g = !1, m?.close();
}), n.on("auth:close-failed", (e, t) => {
	g = !1, m?.webContents.send("auth:close-failed", typeof t == "string" ? t : "Could not log out before closing.");
}), n.handle("settings:get", _), n.handle("settings:set-stay-logged-in", async (e, t) => {
	if (typeof t != "boolean") throw TypeError("Stay logged in setting must be a boolean.");
	await v({
		...await _(),
		stayLoggedIn: t
	});
}), n.handle("auth:get-admin-registered", async () => {
	let e = s.join(t.getPath("userData"), f);
	try {
		return await a(e, "utf8") === "registered";
	} catch (e) {
		if (e.code === "ENOENT") return !1;
		throw e;
	}
}), n.handle("auth:mark-admin-registered", async () => {
	let e = t.getPath("userData");
	await i(e, { recursive: !0 }), await o(s.join(e, f), "registered", { mode: 384 });
}), t.whenReady().then(() => {
	r.fromPartition("persist:default").webRequest.onBeforeSendHeaders({ urls: [`${d}/*`] }, (e, t) => {
		let n = { ...e.requestHeaders };
		n.Origin = d, n.Referer = `${d}/`, t({ requestHeaders: n });
	}), y();
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
});
export {};
