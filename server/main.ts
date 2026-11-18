import { Hono } from "hono";
import { cors } from "hono/cors";
import companyController from "./controllers/company.controller";
import employeeController from "./controllers/employee.controller";
import attendanceController from "./controllers/attendance.controller";

type Bindings = {
  DB: D1Database;
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

server.get("/", (c) => c.json({ status: "ok", service: "System Payroll API" }));

server.route("/api/companies", companyController);
server.route("/api/employees", employeeController);
server.route("/api/attendance", attendanceController);

export default server;

