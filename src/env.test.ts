import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("env", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...envBackup };
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  it("exports validated environment variables when required variables are present", async () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/appdev";
    process.env.BETTER_AUTH_SECRET = "test-secret-value-12345";
    process.env.SMTP_PORT = "587";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.EMAIL_FROM = "noreply@example.com";

    const { env } = await import("@/env");

    expect(env.DATABASE_URL).toBe("postgresql://localhost:5432/appdev");
    expect(env.BETTER_AUTH_SECRET).toBe("test-secret-value-12345");
    expect(env.SMTP_PORT).toBe(587);
    expect(env.BETTER_AUTH_URL).toBe("http://localhost:3000");
    expect(env.EMAIL_FROM).toBe("noreply@example.com");
  });

  it("allows optional variables to be undefined", async () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/appdev";
    process.env.BETTER_AUTH_SECRET = "test-secret-value-12345";
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GROQ_AI_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.EMAIL_FROM;
    delete process.env.SMTP_FROM;

    const { env } = await import("@/env");

    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(env.GOOGLE_CLIENT_SECRET).toBeUndefined();
    expect(env.GOOGLE_GENERATIVE_AI_API_KEY).toBeUndefined();
    expect(env.GROQ_AI_API_KEY).toBeUndefined();
    expect(env.SMTP_HOST).toBeUndefined();
    expect(env.SMTP_PORT).toBeUndefined();
    expect(env.EMAIL_FROM).toBeUndefined();
    expect(env.SMTP_FROM).toBeUndefined();
  });

  describe("negative validation tests", () => {
    it("throws when DATABASE_URL is missing", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      delete process.env.DATABASE_URL;
      process.env.BETTER_AUTH_SECRET = "test-secret-value-12345";

      await expect(import("@/env")).rejects.toThrow(
        "Invalid environment variables",
      );
    });

    it("throws when DATABASE_URL is empty", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      process.env.DATABASE_URL = "";
      process.env.BETTER_AUTH_SECRET = "test-secret-value-12345";

      await expect(import("@/env")).rejects.toThrow(
        "Invalid environment variables",
      );
    });

    it("throws when BETTER_AUTH_SECRET is missing", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      process.env.DATABASE_URL = "postgresql://localhost:5432/appdev";
      delete process.env.BETTER_AUTH_SECRET;

      await expect(import("@/env")).rejects.toThrow(
        "Invalid environment variables",
      );
    });

    it("throws when BETTER_AUTH_SECRET is empty", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      process.env.DATABASE_URL = "postgresql://localhost:5432/appdev";
      process.env.BETTER_AUTH_SECRET = "";

      await expect(import("@/env")).rejects.toThrow(
        "Invalid environment variables",
      );
    });
  });
});
