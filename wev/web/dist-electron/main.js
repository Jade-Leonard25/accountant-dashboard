import { BrowserWindow as e, app as t, ipcMain as n } from "electron";
import { mkdir as r, readFile as i, writeFile as a } from "node:fs/promises";
import o from "node:path";
import { fileURLToPath as s } from "node:url";
// electron/main.js
var c = o.dirname(s(import.meta.url)), l = "http://localhost:5173", u = "admin-registration-state", d = "app-settings.json", f, p = !1, m = !1;
async function h() {
	let e = o.join(t.getPath("userData"), d);
	try {
		let t = JSON.parse(await i(e, "utf8"));
		return { stayLoggedIn: typeof t.stayLoggedIn != "boolean" || t.stayLoggedIn };
	} catch (e) {
		if (e.code === "ENOENT") return { stayLoggedIn: !0 };
		throw e;
	}
}
async function g(e) {
	let n = t.getPath("userData");
	await r(n, { recursive: !0 }), await a(o.join(n, d), JSON.stringify(e), { mode: 384 });
}
function _() {
	f = new e({
		width: 1200,
		height: 700,
		frame: !1,
		webPreferences: {
			partition: "persist:default",
			preload: o.join(c, "preload.cjs"),
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !1
		}
	}), f.webContents.on("preload-error", (e, t, n) => {
		console.error(`Failed to load Electron preload "${t}":`, n);
	}), t.isPackaged ? f.loadFile(o.join(c, "../dist/index.html")) : f.loadURL(l), f.on("maximize", () => f.webContents.send("window:maximized", !0)), f.on("unmaximize", () => f.webContents.send("window:maximized", !1)), f.on("close", (e) => {
		p || (e.preventDefault(), v().catch((e) => {
			console.error("Could not close the app window:", e);
		}));
	});
}
async function v() {
	if (!(!f || f.isDestroyed() || m)) {
		m = !0;
		try {
			let { stayLoggedIn: e } = await h();
			if (e) {
				p = !0, m = !1, f.close();
				return;
			}
			f.webContents.send("auth:prepare-close");
		} catch (e) {
			throw m = !1, f.webContents.send("auth:close-failed", e instanceof Error ? e.message : "Could not read app settings."), e;
		}
	}
}
n.on("window:minimize", () => f?.minimize()), n.on("window:maximize", () => {
	f && (f.isMaximized() ? f.unmaximize() : f.maximize());
}), n.handle("window:close", v), n.on("auth:close-ready", () => {
	p = !0, m = !1, f?.close();
}), n.on("auth:close-failed", (e, t) => {
	m = !1, f?.webContents.send("auth:close-failed", typeof t == "string" ? t : "Could not log out before closing.");
}), n.handle("settings:get", h), n.handle("settings:set-stay-logged-in", async (e, t) => {
	if (typeof t != "boolean") throw TypeError("Stay logged in setting must be a boolean.");
	await g({
		...await h(),
		stayLoggedIn: t
	});
}), n.handle("auth:get-admin-registered", async () => {
	let e = o.join(t.getPath("userData"), u);
	try {
		return await i(e, "utf8") === "registered";
	} catch (e) {
		if (e.code === "ENOENT") return !1;
		throw e;
	}
}), n.handle("auth:mark-admin-registered", async () => {
	let e = t.getPath("userData");
	await r(e, { recursive: !0 }), await a(o.join(e, u), "registered", { mode: 384 });
}), t.whenReady().then(_), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
});
export {};
