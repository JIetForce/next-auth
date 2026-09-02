// src/lib/email/client.ts
import "server-only";

import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import nodemailer from "nodemailer";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

async function captureEmail(path: string, message: SendEmailInput) {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(
    path,
    `${JSON.stringify({ ...message, at: Date.now() })}\n`,
    "utf8",
  );
}

function createTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);

  if (!host || !Number.isFinite(port)) {
    throw new Error("SMTP_HOST and SMTP_PORT are required to send email");
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();

  return nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587 negotiates STARTTLS, which Gmail advertises.
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function sendEmail(message: SendEmailInput) {
  const capturePath = process.env.EMAIL_CAPTURE_FILE?.trim();

  if (capturePath) {
    await captureEmail(capturePath, message);
    return;
  }

  const from = process.env.EMAIL_FROM?.trim();

  if (!from) {
    throw new Error("EMAIL_FROM is required to send email");
  }

  await createTransport().sendMail({ from, ...message });
}
