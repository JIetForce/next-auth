import { rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import nodemailer from "nodemailer";

import { sendEmail } from "./client";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

describe("sendEmail", () => {
  const originalEnv = process.env;
  let tempCaptureFile: string | undefined;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EMAIL_CAPTURE_FILE;
    delete process.env.EMAIL_FROM;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    vi.clearAllMocks();
  });

  afterEach(async () => {
    process.env = originalEnv;
    if (tempCaptureFile) {
      try {
        await rm(tempCaptureFile, { force: true });
      } catch {
        // ignore cleanup error
      }
      tempCaptureFile = undefined;
    }
  });

  describe("EMAIL_CAPTURE_FILE mode", () => {
    it("appends valid single-line JSON with html and preserves plain-text", async () => {
      tempCaptureFile = join(
        tmpdir(),
        `test-mail-capture-${Date.now()}-${Math.random().toString(36).slice(2)}.log`,
      );
      process.env.EMAIL_CAPTURE_FILE = tempCaptureFile;

      await sendEmail({
        to: "alice@example.com",
        subject: "Confirm your email address",
        text: "Confirm your address:\n\nhttps://example.com/verify\n\nIf you did not sign up, ignore this.",
        html: "<p>HTML verification email</p>",
      });

      const content = await readFile(tempCaptureFile, "utf8");
      const lines = content.split("\n").filter(Boolean);

      expect(lines).toHaveLength(1);
      const parsed = JSON.parse(lines[0]!);

      expect(parsed.to).toBe("alice@example.com");
      expect(parsed.subject).toBe("Confirm your email address");
      expect(parsed.text).toBe(
        "Confirm your address:\n\nhttps://example.com/verify\n\nIf you did not sign up, ignore this.",
      );
      expect(parsed.html).toBe("<p>HTML verification email</p>");
      expect(typeof parsed.at).toBe("number");
    });

    it("appends valid single-line JSON when html is omitted", async () => {
      tempCaptureFile = join(
        tmpdir(),
        `test-mail-capture-${Date.now()}-${Math.random().toString(36).slice(2)}.log`,
      );
      process.env.EMAIL_CAPTURE_FILE = tempCaptureFile;

      await sendEmail({
        to: "bob@example.com",
        subject: "Reset your password",
        text: "Reset your password:\n\nhttps://example.com/reset",
      });

      const content = await readFile(tempCaptureFile, "utf8");
      const lines = content.split("\n").filter(Boolean);

      expect(lines).toHaveLength(1);
      const parsed = JSON.parse(lines[0]!);

      expect(parsed.to).toBe("bob@example.com");
      expect(parsed.subject).toBe("Reset your password");
      expect(parsed.text).toBe(
        "Reset your password:\n\nhttps://example.com/reset",
      );
      expect(parsed.html).toBeUndefined();
      expect(typeof parsed.at).toBe("number");
    });

    it("appends multiple messages sequentially without corrupting JSON lines", async () => {
      tempCaptureFile = join(
        tmpdir(),
        `test-mail-capture-${Date.now()}-${Math.random().toString(36).slice(2)}.log`,
      );
      process.env.EMAIL_CAPTURE_FILE = tempCaptureFile;

      await sendEmail({
        to: "user1@example.com",
        subject: "First email",
        text: "Body 1",
        html: "<p>HTML 1</p>",
      });

      await sendEmail({
        to: "user2@example.com",
        subject: "Second email",
        text: "Body 2",
        html: "<p>HTML 2</p>",
      });

      const content = await readFile(tempCaptureFile, "utf8");
      const lines = content.split("\n").filter(Boolean);

      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0]!).to).toBe("user1@example.com");
      expect(JSON.parse(lines[1]!).to).toBe("user2@example.com");
    });
  });

  describe("SMTP transport mode", () => {
    it("throws when EMAIL_FROM is missing", async () => {
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "587";

      await expect(
        sendEmail({
          to: "alice@example.com",
          subject: "Test",
          text: "Test text",
        }),
      ).rejects.toThrow("EMAIL_FROM is required to send email");
    });

    it("throws when SMTP_HOST or SMTP_PORT is missing", async () => {
      process.env.EMAIL_FROM = "noreply@siftloom.com";

      await expect(
        sendEmail({
          to: "alice@example.com",
          subject: "Test",
          text: "Test text",
        }),
      ).rejects.toThrow("SMTP_HOST and SMTP_PORT are required to send email");
    });

    it("passes from, to, subject, text, and html to nodemailer sendMail", async () => {
      process.env.EMAIL_FROM = "noreply@siftloom.com";
      process.env.SMTP_HOST = "smtp.gmail.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user@gmail.com";
      process.env.SMTP_PASSWORD = "app-password";

      const mockSendMail = vi.fn().mockResolvedValue({ messageId: "123" });
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as unknown as ReturnType<typeof nodemailer.createTransport>);

      await sendEmail({
        to: "alice@example.com",
        subject: "Confirm your email address",
        text: "Plain text link: https://example.com/verify",
        html: "<p>HTML template</p>",
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "user@gmail.com",
          pass: "app-password",
        },
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: "noreply@siftloom.com",
        to: "alice@example.com",
        subject: "Confirm your email address",
        text: "Plain text link: https://example.com/verify",
        html: "<p>HTML template</p>",
      });
    });

    it("configures secure: true when SMTP_PORT is 465", async () => {
      process.env.EMAIL_FROM = "noreply@siftloom.com";
      process.env.SMTP_HOST = "smtp.gmail.com";
      process.env.SMTP_PORT = "465";

      const mockSendMail = vi.fn().mockResolvedValue({ messageId: "456" });
      vi.mocked(nodemailer.createTransport).mockReturnValue({
        sendMail: mockSendMail,
      } as unknown as ReturnType<typeof nodemailer.createTransport>);

      await sendEmail({
        to: "bob@example.com",
        subject: "Reset your password",
        text: "Plain text reset",
      });

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: undefined,
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: "noreply@siftloom.com",
        to: "bob@example.com",
        subject: "Reset your password",
        text: "Plain text reset",
      });
    });
  });
});
