import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.DATABASE_URL = "postgresql://mock:5432/mock";
  process.env.BETTER_AUTH_SECRET = "mock-secret-for-tests-123456789";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
});

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email/client";

describe("auth email callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendVerificationEmail", () => {
    it("dispatches email with both plain-text and HTML versions without blocking", async () => {
      let resolveSendEmail: () => void = () => {};
      const sendEmailPromise = new Promise<void>((resolve) => {
        resolveSendEmail = resolve;
      });
      vi.mocked(sendEmail).mockImplementation(() => sendEmailPromise);

      const sendVerificationEmail =
        auth.options.emailVerification?.sendVerificationEmail;
      expect(sendVerificationEmail).toBeDefined();

      const user = {
        id: "user-1",
        email: "alice@example.com",
        name: "Alice",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const url = "https://siftloom.com/verify-email?token=token-123";

      // The outer call returns immediately without awaiting the email send
      const returnVal = await sendVerificationEmail!({ user, url } as never);
      expect(returnVal).toBeUndefined();

      // Resolve the internal async dispatch
      resolveSendEmail();
      // Allow microtasks to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(sendEmail).toHaveBeenCalledTimes(1);
      const callArg = vi.mocked(sendEmail).mock.calls[0]![0];
      expect(callArg.to).toBe("alice@example.com");
      expect(callArg.subject).toBe("Confirm your email address");
      expect(callArg.text).toContain(url);
      expect(callArg.text).toContain(
        "Confirm your address to finish creating your account:",
      );
      expect(callArg.text).toContain(
        "If you did not sign up, you can ignore this message.",
      );
      expect(callArg.html).toContain("<!DOCTYPE html");
      expect(callArg.html).toContain(url);
      expect(callArg.html).toContain("Confirm your email address");
    });

    it("catches errors without throwing unhandled rejection", async () => {
      vi.mocked(sendEmail).mockRejectedValue(new Error("SMTP down"));

      const sendVerificationEmail =
        auth.options.emailVerification?.sendVerificationEmail;

      const user = {
        id: "user-2",
        email: "bob@example.com",
        name: "Bob",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const url = "https://siftloom.com/verify-email?token=token-456";

      await expect(
        sendVerificationEmail!({ user, url } as never),
      ).resolves.not.toThrow();

      // Allow microtasks to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        "Failed to send verification email",
      );
    });
  });

  describe("sendResetPassword", () => {
    it("dispatches email with both plain-text and HTML versions without blocking", async () => {
      let resolveSendEmail: () => void = () => {};
      const sendEmailPromise = new Promise<void>((resolve) => {
        resolveSendEmail = resolve;
      });
      vi.mocked(sendEmail).mockImplementation(() => sendEmailPromise);

      const sendResetPassword =
        auth.options.emailAndPassword?.sendResetPassword;
      expect(sendResetPassword).toBeDefined();

      const user = {
        id: "user-3",
        email: "carol@example.com",
        name: "Carol",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const url = "https://siftloom.com/reset-password?token=reset-token-789";

      const returnVal = await sendResetPassword!({ user, url } as never);
      expect(returnVal).toBeUndefined();

      resolveSendEmail();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(sendEmail).toHaveBeenCalledTimes(1);
      const callArg = vi.mocked(sendEmail).mock.calls[0]![0];
      expect(callArg.to).toBe("carol@example.com");
      expect(callArg.subject).toBe("Reset your password");
      expect(callArg.text).toContain(url);
      expect(callArg.text).toContain("Click the link to reset your password:");
      expect(callArg.text).toContain(
        "If you did not request this, you can ignore this message.",
      );
      expect(callArg.html).toContain("<!DOCTYPE html");
      expect(callArg.html).toContain(url);
      expect(callArg.html).toContain("Reset your password");
    });

    it("catches errors without throwing unhandled rejection", async () => {
      vi.mocked(sendEmail).mockRejectedValue(new Error("Network timeout"));

      const sendResetPassword =
        auth.options.emailAndPassword?.sendResetPassword;

      const user = {
        id: "user-4",
        email: "dave@example.com",
        name: "Dave",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const url = "https://siftloom.com/reset-password?token=reset-token-000";

      await expect(
        sendResetPassword!({ user, url } as never),
      ).resolves.not.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(logger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        "Failed to send reset password email",
      );
    });
  });
});
