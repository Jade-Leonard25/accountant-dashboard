import { defineConfig } from "drizzle-kit";
export default defineConfig({
    dialect:"sqlite",
    dbCredentials:{
        url:"sqlite.db"
    },
    out:"./data",
    schema:"./data/schema.js"
})