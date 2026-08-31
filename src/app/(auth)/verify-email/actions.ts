// src/app/(auth)/verify-email/actions.ts
"use server";

import { headers } from "next/headers";

import { auth } from "@/auth";
import { getClientIp } from "@/lib/auth/client-ip";
import { consumeRateLimit } from "@/lib/auth/rate-limit";

export type ResendState = { message: string | null };

const uniformReply: ResendState = {
  message: "If that address needs confirming, a new message is on its way.",
};

export async function resendVerificationAction(
  _state: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) return uniformReply;

  const ip = getClientIp(await headers());

  if (!(await consumeRateLimit(`resend:ip:${ip}`, 10, 60 * 60 * 1000))) {
    return uniformReply;
  }

  if (!(await consumeRateLimit(`resend:email:${email}`, 3, 60 * 60 * 1000))) {
    return uniformReply;
  }

  try {
    await auth.api.sendVerificationEmail({
      body: { email, callbackURL: "/login" },
    });
  } catch {
    // Deliberately swallowed: the reply must not vary with the outcome.
  }

  return uniformReply;
}
