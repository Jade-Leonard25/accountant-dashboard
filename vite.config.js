import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import electronPath from "electron";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

function electronDev() {
  return {
    name: "electron-dev",
    apply: "serve",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        const runtimeDir = process.env.XDG_RUNTIME_DIR;
        const waylandName = process.env.WAYLAND_DISPLAY;
        const hasWayland = Boolean(
          runtimeDir &&
          waylandName &&
          fs.existsSync(path.join(runtimeDir, waylandName)),
        );
        const platform = hasWayland ? "wayland" : "x11";

        const env = {
          ...process.env,
          VITE_DEV_SERVER_URL: "http://localhost:5173",
          ELECTRON_OZONE_PLATFORM_HINT: platform,
        };
        if (!hasWayland) {
          delete env.WAYLAND_DISPLAY;
          env.DISPLAY = process.env.DISPLAY || ":0";
        }

        console.log(`[electron] using ${platform}`);

        // Make sure 'electron/main.js' matches your actual folder name (singular vs plural)
        const child = spawn(
          electronPath,
          [`--ozone-platform=${platform}`, "electrons/main.js"],
          { stdio: "inherit", env },
        );
        child.on("exit", () => {
          server.close().then(() => process.exit(0));
        });
        server.httpServer.once("close", () => child.kill());
      });
    },
  };
}

export default defineConfig({
  // Use relative base paths so Electron can load files via file:// protocol in production
  base: "./",
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    electronDev(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
