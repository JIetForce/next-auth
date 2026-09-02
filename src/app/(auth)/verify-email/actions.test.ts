import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockHeaders } = vi.hoisted(() => ({
  mockHeaders: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  consumeRateLimit: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: {
    api: {
      sendVerificationEmail: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { resendVerificationAction } from "./actions";

describe("resendVerificationAction", () => {
  const expectedUniformReply = {
    message: "If that address needs confirming, a new message is on its way.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "192.0.2.1" }),
    );
    vi.mocked(consumeRateLimit).mockResolvedValue(true);
    vi.mocked(auth.api.sendVerificationEmail).mockResolvedValue({} as never);
  });

  it("returns uniform reply when verification email is successfully requested", async () => {
    const formData = new FormData();
    formData.set("email", "valid@example.com");

    const result = await resendVerificationAction({ message: null }, formData);

    expect(result).toEqual(expectedUniformReply);
    expect(auth.api.sendVerificationEmail).toHaveBeenCalledWith({
      body: { email: "valid@example.com", callbackURL: "/login" },
    });
  });

  it("returns uniform reply when IP rate limit is exceeded without sending email", async () => {
    vi.mocked(consumeRateLimit).mockResolvedValueOnce(false);

    const formData = new FormData();
    formData.set("email", "valid@example.com");

    const result = await resendVerificationAction({ message: null }, formData);

    expect(result).toEqual(expectedUniformReply);
    expect(auth.api.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns uniform reply when email format is invalid without sending email", async () => {
    const formData = new FormData();
    formData.set("email", "not-an-email");

    const result = await resendVerificationAction({ message: null }, formData);

    expect(result).toEqual(expectedUniformReply);
    expect(auth.api.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns uniform reply when email rate limit is exceeded without sending email", async () => {
    vi.mocked(consumeRateLimit)
      .mockResolvedValueOnce(true) // IP check passes
      .mockResolvedValueOnce(false); // Email check fails

    const formData = new FormData();
    formData.set("email", "valid@example.com");

    const result = await resendVerificationAction({ message: null }, formData);

    expect(result).toEqual(expectedUniformReply);
    expect(auth.api.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns uniform reply even when auth.api throws (anti-enumeration)", async () => {
    vi.mocked(auth.api.sendVerificationEmail).mockRejectedValue(
      new Error("User not found or unconfigured"),
    );

    const formData = new FormData();
    formData.set("email", "nonexistent@example.com");

    const result = await resendVerificationAction({ message: null }, formData);

    expect(result).toEqual(expectedUniformReply);
    expect(auth.api.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});
