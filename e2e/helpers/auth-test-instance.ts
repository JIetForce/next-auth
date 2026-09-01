// e2e/helpers/auth-test-instance.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { testUtils } from "better-auth/plugins";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../../src/generated/prisma/client";
import { TEST_DATABASE_URL } from "../global-setup";

const connectionString = TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error("TEST_DATABASE_URL is required for authenticated E2E tests");
}

const pool = new Pool({ connectionString });

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

export const testAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  plugins: [testUtils()],
});

export async function teardownAuthTestInstance(): Promise<void> {
  try {
    await prisma.$disconnect();
  } finally {
    if (!pool.ending) {
      await pool.end();
    }
  }
}
