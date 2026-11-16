import { Hono } from "hono";

const server = new Hono();
const port = 4002;

server.get("/health", (c) => {
    return c.json({ message: "Hello World" });
});

server.get("/", (c) => {
    console.log(`Server Connected to http://localhost:${port}`);
    return c.text("Payroll API Running");
});

export default server;