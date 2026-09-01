import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  MIN_PASSWORD_LENGTH,
  registerSchema,
  resendSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/auth/schemas";

describe("auth zod schemas", () => {
  describe("8-character minimum for passwords", () => {
    it("exports MIN_PASSWORD_LENGTH as 8", () => {
      expect(MIN_PASSWORD_LENGTH).toBe(8);
    });

    it("rejects passwords shorter than 8 characters in registerSchema", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "short",
        confirmPassword: "short",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password",
        );
        expect(passwordError).toBeDefined();
        expect(passwordError?.message).toContain("Use at least 8 characters.");
      }
    });

    it("rejects 7-character passwords and accepts 8-character passwords in resetPasswordSchema", () => {
      const failResult = resetPasswordSchema.safeParse({
        password: "1234567",
        confirmPassword: "1234567",
      });
      expect(failResult.success).toBe(false);

      const passResult = resetPasswordSchema.safeParse({
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(passResult.success).toBe(true);
    });
  });

  describe("no composition rules enforced", () => {
    it("accepts passwords without uppercase letters", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password: "onlylowercasepass",
        confirmPassword: "onlylowercasepass",
      });
      expect(result.success).toBe(true);
    });

    it("accepts passwords without digits", () => {
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password: "justletterspassword",
        confirmPassword: "justletterspassword",
      });
      expect(result.success).toBe(true);
    });

    it("accepts passwords containing only digits", () => {
      const result = resetPasswordSchema.safeParse({
        password: "1234567890",
        confirmPassword: "1234567890",
      });
      expect(result.success).toBe(true);
    });

    it("accepts passwords with spaces and symbols", () => {
      const password = "correct horse battery staple!";
      const result = registerSchema.safeParse({
        name: "User",
        email: "user@example.com",
        password,
        confirmPassword: password,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email lowercased and trimmed by schema", () => {
    const rawEmail = "  Alice.Smith+Test@EXAMPLE.com   ";
    const expectedEmail = "alice.smith+test@example.com";

    it("normalizes email in signInSchema", () => {
      const result = signInSchema.safeParse({
        email: rawEmail,
        password: "anypassword",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(expectedEmail);
      }
    });

    it("normalizes email in registerSchema", () => {
      const result = registerSchema.safeParse({
        name: "Alice",
        email: rawEmail,
        password: "validpassword123",
        confirmPassword: "validpassword123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(expectedEmail);
      }
    });

    it("normalizes email in resendSchema", () => {
      const result = resendSchema.safeParse({ email: rawEmail });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(expectedEmail);
      }
    });

    it("normalizes email in forgotPasswordSchema", () => {
      const result = forgotPasswordSchema.safeParse({ email: rawEmail });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(expectedEmail);
      }
    });

    it("rejects invalid email formats", () => {
      const result = signInSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Please enter a valid email address.",
        );
      }
    });
  });

  describe("mismatched confirmation fails on the confirmPassword path", () => {
    it("fails on confirmPassword path in registerSchema", () => {
      const result = registerSchema.safeParse({
        name: "Alice",
        email: "alice@example.com",
        password: "securepassword123",
        confirmPassword: "mismatchedpassword123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const mismatchError = result.error.issues.find(
          (issue) => issue.path.join(".") === "confirmPassword",
        );
        expect(mismatchError).toBeDefined();
        expect(mismatchError?.message).toBe("The two passwords do not match.");
        expect(mismatchError?.path).toEqual(["confirmPassword"]);
      }
    });

    it("fails on confirmPassword path in resetPasswordSchema", () => {
      const result = resetPasswordSchema.safeParse({
        password: "securepassword123",
        confirmPassword: "mismatchedpassword123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const mismatchError = result.error.issues.find(
          (issue) => issue.path.join(".") === "confirmPassword",
        );
        expect(mismatchError).toBeDefined();
        expect(mismatchError?.message).toBe("The two passwords do not match.");
        expect(mismatchError?.path).toEqual(["confirmPassword"]);
      }
    });
  });
});
