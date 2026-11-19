// server/db/index.ts
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../../schema/schema";

const sqlite = new Database(process.env.DATABASE_URL || "./server/db/local.sqlite");
export const db = drizzle(sqlite, { schema });
