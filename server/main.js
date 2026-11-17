import { app } from "electron";
import path from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { electron } from "@better-auth/electron";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./db/schema"; // Your Drizzle schema path

export function startAuthServer() {
  const dbPath = path.join(app.getPath("userData"), "auth.db");
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });

  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    plugins: [electron()],
    trustedOrigins: [
      "com.example.app://", // Custom deep link protocol scheme
      "http://localhost:5173", // Vite dev server
    ],
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },
  });

  // 3. Set up Hono backend app
  const appServer = new Hono();

  appServer.use(
    "/api/*",
    cors({
      origin: ["http://localhost:5173", "com.example.app://"],
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    }),
  );

  // Mount Better Auth handler
  appServer.all("/api/auth/*", (c) => auth.handler(c.req.raw));

  // 4. Start the Hono server locally on a dedicated port (e.g., 4002)
  const port = 4002;
  console.log(`Auth server running at http://localhost:${port}`);

  return {
    port,
    fetch: appServer.fetch,
  };
}
