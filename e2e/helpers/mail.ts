// e2e/helpers/mail.ts
import { readFile, writeFile } from "node:fs/promises";

import { MAIL_LOG } from "../global-setup";

type CapturedMessage = {
  to: string;
  subject: string;
  text: string;
  at: number;
};

async function readCaptured(): Promise<CapturedMessage[]> {
  let raw: string;

  try {
    raw = await readFile(MAIL_LOG, "utf8");
  } catch {
    return [];
  }

  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CapturedMessage);
}

export async function clearMailbox() {
  await writeFile(MAIL_LOG, "");
}

/** Polls the capture file until a message addressed to `email` arrives. */
export async function readLatestMessageTo(
  email: string,
  timeoutMs = 10_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const messages = await readCaptured();
    const match = messages
      .filter((m) => m.to.toLowerCase() === email.toLowerCase())
      .sort((a, b) => a.at - b.at)
      .at(-1);

    if (match) return match.text;

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`No captured message for ${email} within ${timeoutMs}ms`);
}

export function extractFirstUrl(body: string): string {
  const match = body.match(/https?:\/\/\S+/);
  if (!match) throw new Error("No URL found in the message body");
  return match[0];
}
