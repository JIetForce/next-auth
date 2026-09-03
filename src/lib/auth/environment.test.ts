import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("environment helpers", () => {
  const originalProcessEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalProcessEnv };
  });

  afterEach(() => {
    process.env = originalProcessEnv;
    vi.restoreAllMocks();
  });

  describe("isAuthSessionConfigured", () => {
    it("returns true when BETTER_AUTH_SECRET and DATABASE_URL are set", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_SECRET: "mock-secret",
          DATABASE_URL: "postgresql://localhost:5432/db",
        },
      }));

      const { isAuthSessionConfigured } = await import("./environment");
      expect(isAuthSessionConfigured()).toBe(true);
    });

    it("returns false when BETTER_AUTH_SECRET is missing", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_SECRET: undefined,
          DATABASE_URL: "postgresql://localhost:5432/db",
        },
      }));

      const { isAuthSessionConfigured } = await import("./environment");
      expect(isAuthSessionConfigured()).toBe(false);
    });

    it("returns false when DATABASE_URL is missing", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_SECRET: "mock-secret",
          DATABASE_URL: undefined,
        },
      }));

      const { isAuthSessionConfigured } = await import("./environment");
      expect(isAuthSessionConfigured()).toBe(false);
    });
  });

  describe("isGoogleAuthConfigured", () => {
    it("returns true when session is configured and both Google credentials are set", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_SECRET: "mock-secret",
          DATABASE_URL: "postgresql://localhost:5432/db",
          GOOGLE_CLIENT_ID: "client-id",
          GOOGLE_CLIENT_SECRET: "client-secret",
        },
      }));

      const { isGoogleAuthConfigured } = await import("./environment");
      expect(isGoogleAuthConfigured()).toBe(true);
    });

    it("returns false when GOOGLE_CLIENT_ID is missing", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_SECRET: "mock-secret",
          DATABASE_URL: "postgresql://localhost:5432/db",
          GOOGLE_CLIENT_ID: undefined,
          GOOGLE_CLIENT_SECRET: "client-secret",
        },
      }));

      const { isGoogleAuthConfigured } = await import("./environment");
      expect(isGoogleAuthConfigured()).toBe(false);
    });

    it("returns false when GOOGLE_CLIENT_SECRET is missing", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_SECRET: "mock-secret",
          DATABASE_URL: "postgresql://localhost:5432/db",
          GOOGLE_CLIENT_ID: "client-id",
          GOOGLE_CLIENT_SECRET: undefined,
        },
      }));

      const { isGoogleAuthConfigured } = await import("./environment");
      expect(isGoogleAuthConfigured()).toBe(false);
    });

    it("returns false when session is not configured even if Google credentials are set", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_SECRET: undefined,
          DATABASE_URL: undefined,
          GOOGLE_CLIENT_ID: "client-id",
          GOOGLE_CLIENT_SECRET: "client-secret",
        },
      }));

      const { isGoogleAuthConfigured } = await import("./environment");
      expect(isGoogleAuthConfigured()).toBe(false);
    });
  });

  describe("isAiChatConfigured", () => {
    it("returns true when GROQ_AI_API_KEY is set", async () => {
      vi.doMock("@/env", () => ({
        env: {
          GROQ_AI_API_KEY: "mock-groq-key",
          GOOGLE_GENERATIVE_AI_API_KEY: undefined,
        },
      }));

      const { isAiChatConfigured } = await import("./environment");
      expect(isAiChatConfigured()).toBe(true);
    });

    it("returns true when GOOGLE_GENERATIVE_AI_API_KEY is set", async () => {
      vi.doMock("@/env", () => ({
        env: {
          GROQ_AI_API_KEY: undefined,
          GOOGLE_GENERATIVE_AI_API_KEY: "mock-google-key",
        },
      }));

      const { isAiChatConfigured } = await import("./environment");
      expect(isAiChatConfigured()).toBe(true);
    });

    it("returns false when neither is set", async () => {
      vi.doMock("@/env", () => ({
        env: {
          GROQ_AI_API_KEY: undefined,
          GOOGLE_GENERATIVE_AI_API_KEY: undefined,
        },
      }));

      const { isAiChatConfigured } = await import("./environment");
      expect(isAiChatConfigured()).toBe(false);
    });
  });

  describe("getPublicBaseUrl", () => {
    it("returns BETTER_AUTH_URL when set", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_URL: "https://auth.example.com",
        },
      }));

      process.env.VERCEL_PROJECT_PRODUCTION_URL = "prod.example.com";
      process.env.VERCEL_URL = "preview.example.com";

      const { getPublicBaseUrl } = await import("./environment");
      expect(getPublicBaseUrl()).toBe("https://auth.example.com");
    });

    it("returns VERCEL_PROJECT_PRODUCTION_URL when BETTER_AUTH_URL is not set", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_URL: undefined,
        },
      }));

      process.env.VERCEL_PROJECT_PRODUCTION_URL = "prod.example.com";
      process.env.VERCEL_URL = "preview.example.com";

      const { getPublicBaseUrl } = await import("./environment");
      expect(getPublicBaseUrl()).toBe("https://prod.example.com");
    });

    it("returns VERCEL_URL when BETTER_AUTH_URL and VERCEL_PROJECT_PRODUCTION_URL are not set", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_URL: undefined,
        },
      }));

      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      process.env.VERCEL_URL = "preview.example.com";

      const { getPublicBaseUrl } = await import("./environment");
      expect(getPublicBaseUrl()).toBe("https://preview.example.com");
    });

    it("falls back to localhost:3000 when no url variables are set", async () => {
      vi.doMock("@/env", () => ({
        env: {
          BETTER_AUTH_URL: undefined,
        },
      }));

      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      delete process.env.VERCEL_URL;

      const { getPublicBaseUrl } = await import("./environment");
      expect(getPublicBaseUrl()).toBe("http://localhost:3000");
    });
  });
});
