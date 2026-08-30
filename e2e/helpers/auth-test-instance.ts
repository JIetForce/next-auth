// e2e/helpers/auth-test-instance.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { testUtils } from "better-auth/plugins";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../src/generated/prisma/client";
import { TEST_DATABASE_URL } from "../global-setup";

const connectionString = TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error("TEST_DATABASE_URL is required for authenticated E2E tests");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export const testAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  plugins: [testUtils()],
});
