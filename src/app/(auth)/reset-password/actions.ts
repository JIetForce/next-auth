// src/app/(auth)/reset-password/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getClientIp } from "@/lib/auth/client-ip";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/auth/schemas";

export type RequestPasswordResetState = { message: string | null };

const uniformReply: RequestPasswordResetState = {
  message: "If that address is registered, a reset link is on its way.",
};

export async function requestPasswordResetAction(
  _state: RequestPasswordResetState,
  formData: FormData,
): Promise<RequestPasswordResetState> {
  const parseResult = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });

  if (!parseResult.success) {
    return uniformReply;
  }

  const { email } = parseResult.data;

  // rate-limit by IP and by email
  const ip = getClientIp(await headers());
  if (!(await consumeRateLimit(`request-reset:ip:${ip}`, 10, 60 * 60 * 1000)))
    return uniformReply;
  if (
    !(await consumeRateLimit(`request-reset:email:${email}`, 3, 60 * 60 * 1000))
  )
    return uniformReply;

  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
    });
  } catch {
    // swallowed: the reply must not vary with the outcome
  }

  return uniformReply;
}

export type ResetPasswordState = { error: string | null };

const genericFailure: ResetPasswordState = {
  error: "Could not reset your password. Check the link and try again.",
};

export async function resetPasswordAction(
  _state: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const parseResult = resetPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!token || !parseResult.success) {
    return {
      error: "Use at least 8 characters, and make sure the passwords match.",
    };
  }

  const { password } = parseResult.data;

  // Rate-limit by IP only — the token is the subject and must not become a
  // bucket key: an attacker with one valid token could lock nothing, and an
  // attacker with many tokens could evade the bucket entirely.
  const ip = getClientIp(await headers());
  if (
    !(await consumeRateLimit(`reset-password:ip:${ip}`, 10, 60 * 60 * 1000))
  ) {
    return genericFailure;
  }

  try {
    await auth.api.resetPassword({ body: { newPassword: password, token } });
  } catch {
    return genericFailure;
  }

  redirect("/login");
}
