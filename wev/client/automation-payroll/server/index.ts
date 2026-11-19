import { Hono } from "hono";
import { cors } from "hono/cors";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { employees } from "../schema/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: ["http://localhost:1420", "tauri://localhost"],
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
});

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:1420", "tauri://localhost"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/api/payroll/summary", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [staff] = await Promise.all([
    db.select().from(employees).where(eq(employees.userId, session.user.id)),
  ]);

  return c.json({
    userId: session.user.id,
    employeeCount: staff.length,
    employees: staff,
  });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
