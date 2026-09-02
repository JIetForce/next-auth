import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookieStore, mockRedirect } = vi.hoisted(() => ({
  mockCookieStore: {
    set: vi.fn(),
    get: vi.fn(),
  },
  mockRedirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi
    .fn()
    .mockResolvedValue(new Headers({ "x-forwarded-for": "127.0.0.1" })),
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  consumeRateLimit: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/auth", () => ({
  auth: {
    api: {
      signUpEmail: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { registerAction } from "./actions";

describe("registerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(consumeRateLimit).mockResolvedValue(true);
    vi.mocked(auth.api.signUpEmail).mockResolvedValue({} as never);
  });

  it("sets pending_verification_email cookie and redirects to /verify-email without query parameters", async () => {
    const formData = new FormData();
    formData.set("name", "Alice Test");
    formData.set("email", "alice@example.com");
    formData.set("password", "ValidPassword123");
    formData.set("confirmPassword", "ValidPassword123");

    await expect(registerAction({ error: null }, formData)).rejects.toThrow(
      "REDIRECT:/verify-email",
    );

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "pending_verification_email",
      "alice@example.com",
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 60,
        path: "/verify-email",
      },
    );

    expect(mockRedirect).toHaveBeenCalledWith("/verify-email");
    expect(mockRedirect).not.toHaveBeenCalledWith(expect.stringContaining("?"));
  });

  it("does not set cookie when validation fails", async () => {
    const formData = new FormData();
    formData.set("name", "Alice Test");
    formData.set("email", "invalid-email");
    formData.set("password", "ValidPassword123");
    formData.set("confirmPassword", "ValidPassword123");

    const result = await registerAction({ error: null }, formData);
    expect(result.error).toBe(
      "Could not complete sign-up. Check your details and try again.",
    );
    expect(mockCookieStore.set).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("does not set cookie when signUpEmail throws", async () => {
    vi.mocked(auth.api.signUpEmail).mockRejectedValue(
      new Error("Database error"),
    );

    const formData = new FormData();
    formData.set("name", "Alice Test");
    formData.set("email", "alice@example.com");
    formData.set("password", "ValidPassword123");
    formData.set("confirmPassword", "ValidPassword123");

    const result = await registerAction({ error: null }, formData);
    expect(result.error).toBe(
      "Could not complete sign-up. Check your details and try again.",
    );
    expect(mockCookieStore.set).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("does not set cookie when rate limit is exceeded", async () => {
    vi.mocked(consumeRateLimit).mockResolvedValue(false);

    const formData = new FormData();
    formData.set("name", "Alice Test");
    formData.set("email", "alice@example.com");
    formData.set("password", "ValidPassword123");
    formData.set("confirmPassword", "ValidPassword123");

    const result = await registerAction({ error: null }, formData);
    expect(result.error).toBe(
      "Could not complete sign-up. Check your details and try again.",
    );
    expect(mockCookieStore.set).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
