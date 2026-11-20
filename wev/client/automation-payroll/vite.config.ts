import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import process from "node:process";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [vue(), tailwindcss()],
  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1420,
        }
      : undefined,
    watch: {
      // tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      "/api/auth": {
        target: "https://system-payroll-api.automation-payroll.workers.dev",
        changeOrigin: true,
        secure: true,
      },
    },
  },
}));