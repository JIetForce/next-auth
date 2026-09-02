import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

import { renderResetPassword, ResetPasswordTemplate } from "./reset-password";
import { renderVerifyEmail, VerifyEmailTemplate } from "./verify-email";

describe("email templates", () => {
  describe("VerifyEmailTemplate", () => {
    it("renders HTML email with Siftloom branding, heading, verify URL, and ignore note", async () => {
      const url = "https://example.com/verify-email?token=test-verify-123";
      const html = await renderVerifyEmail({ url });

      expect(html).toContain("<!DOCTYPE html");
      expect(html).toContain("Siftloom");
      expect(html).toContain("Confirm your email address");
      expect(html).toContain(url);
      expect(html).toContain("#2fb8ae");
      expect(html).toContain(
        "If you did not sign up, you can ignore this message.",
      );
      expect(html).toContain("Verify Email Address");

      const directHtml = await render(<VerifyEmailTemplate url={url} />);
      expect(directHtml).toBe(html);
    });
  });

  describe("ResetPasswordTemplate", () => {
    it("renders HTML email with Siftloom branding, heading, reset URL, and security note", async () => {
      const url = "https://example.com/reset-password?token=test-reset-456";
      const html = await renderResetPassword({ url });

      expect(html).toContain("<!DOCTYPE html");
      expect(html).toContain("Siftloom");
      expect(html).toContain("Reset your password");
      expect(html).toContain(url);
      expect(html).toContain("#2fb8ae");
      expect(html).toContain(
        "If you did not request this, you can ignore this message.",
      );
      expect(html).toContain("Reset Password");

      const directHtml = await render(<ResetPasswordTemplate url={url} />);
      expect(directHtml).toBe(html);
    });
  });
});
