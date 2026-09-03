import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyChatAccess } from "@/lib/ai/chat-guard";
import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { isAuthSessionConfigured } from "@/lib/auth/environment";
import { logger } from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  consumeRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/environment", () => ({
  isAuthSessionConfigured: vi.fn(),
}));

const mockedSession = vi.mocked(auth.api.getSession);
const mockedAuthConfigured = vi.mocked(isAuthSessionConfigured);
const mockedConsume = vi.mocked(consumeRateLimit);

function guestHeaders(ip = "203.0.113.7"): Headers {
  return new Headers({ "x-real-ip": ip });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuthConfigured.mockReturnValue(true);
  mockedSession.mockResolvedValue(null);
  mockedConsume.mockResolvedValue(true);
});

describe("verifyChatAccess — guests", () => {
  it("allows a guest and consumes two buckets keyed by IP without the action: prefix", async () => {
    const result = await verifyChatAccess(guestHeaders());

    expect(result).toEqual({
      allowed: true,
      caller: { kind: "guest", ip: "203.0.113.7", identifier: "203.0.113.7" },
    });
    expect(mockedConsume).toHaveBeenNthCalledWith(
      1,
      "ai:chat:guest:5min:203.0.113.7",
      3,
      5 * 60 * 1000,
    );
    expect(mockedConsume).toHaveBeenNthCalledWith(
      2,
      "ai:chat:guest:day:203.0.113.7",
      20,
      24 * 60 * 60 * 1000,
    );
  });

  it("blocks after the 5-minute guest budget with retryAfterSeconds 300", async () => {
    mockedConsume.mockResolvedValueOnce(false);

    const result = await verifyChatAccess(guestHeaders());

    expect(result).toMatchObject({ allowed: false, retryAfterSeconds: 300 });
    expect(mockedConsume).toHaveBeenCalledTimes(1);
  });

  it("blocks after the daily guest budget with retryAfterSeconds 86400", async () => {
    mockedConsume.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const result = await verifyChatAccess(guestHeaders());

    expect(result).toMatchObject({ allowed: false, retryAfterSeconds: 86400 });
  });

  it("falls back to the guest path when the session cannot be resolved", async () => {
    mockedSession.mockRejectedValue(new Error("session lookup failed"));

    const result = await verifyChatAccess(guestHeaders());

    expect(result.allowed).toBe(true);
    expect(result.allowed && result.caller.kind).toBe("guest");
    expect(logger.warn).toHaveBeenCalled();
  });

  it("treats an unresolvable IP as the 'unknown' bucket", async () => {
    const result = await verifyChatAccess(new Headers());

    expect(result.allowed && result.caller).toMatchObject({
      kind: "guest",
      ip: "unknown",
    });
  });
});

describe("verifyChatAccess — authenticated users", () => {
  const viewer = {
    id: "user-1",
    name: "Alice",
    email: "alice@example.com",
    image: null,
    emailVerified: true,
  };

  beforeEach(() => {
    mockedSession.mockResolvedValue({
      user: viewer,
    } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>);
  });

  it("allows a user and consumes two buckets keyed by user id", async () => {
    const result = await verifyChatAccess(guestHeaders());

    expect(result.allowed).toBe(true);
    expect(mockedConsume).toHaveBeenNthCalledWith(
      1,
      "ai:chat:user:min:user-1",
      15,
      60 * 1000,
    );
    expect(mockedConsume).toHaveBeenNthCalledWith(
      2,
      "ai:chat:user:day:user-1",
      100,
      24 * 60 * 60 * 1000,
    );
  });

  it("blocks after the per-minute budget with retryAfterSeconds 60", async () => {
    mockedConsume.mockResolvedValueOnce(false);

    const result = await verifyChatAccess(guestHeaders());

    expect(result).toMatchObject({ allowed: false, retryAfterSeconds: 60 });
  });

  it("blocks after the daily budget with retryAfterSeconds 3600", async () => {
    mockedConsume.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const result = await verifyChatAccess(guestHeaders());

    expect(result).toMatchObject({ allowed: false, retryAfterSeconds: 3600 });
  });
});

describe("verifyChatAccess — unconfigured auth", () => {
  it("skips the session lookup and uses the guest path", async () => {
    mockedAuthConfigured.mockReturnValue(false);

    const result = await verifyChatAccess(guestHeaders());

    expect(result.allowed).toBe(true);
    expect(mockedSession).not.toHaveBeenCalled();
  });
});
