// src/app/(auth)/verify-email/actions.ts
"use server";

import { headers } from "next/headers";

import { auth } from "@/auth";
import { getClientIp } from "@/lib/auth/client-ip";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { resendSchema } from "@/lib/auth/schemas";

export type ResendState = { message: string | null };

const uniformReply: ResendState = {
  message: "If that address needs confirming, a new message is on its way.",
};

export async function resendVerificationAction(
  _state: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const parseResult = resendSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });

  if (!parseResult.success) {
    return uniformReply;
  }

  const { email } = parseResult.data;

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
