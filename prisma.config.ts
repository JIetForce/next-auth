// prisma.config.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { defineConfig, env } from "prisma/config";

// The CLI must use the unpooled connection: migrations run DDL in a session
// PgBouncer cannot hold. Neon's Vercel integration injects that string as
// DATABASE_URL_UNPOOLED; locally the same value lives in DIRECT_URL.
const directUrlVariable = process.env.DIRECT_URL
  ? "DIRECT_URL"
  : "DATABASE_URL_UNPOOLED";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env(directUrlVariable),
  },
});
