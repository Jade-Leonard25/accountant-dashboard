import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

const server = new Hono<{ Bindings: Bindings }>();

server.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "com.yourapp.payroll://"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

server.get("/", (c) => {
  return c.json({ message: "Hello World" });
});

export default server;

