// src/app/(auth)/reset-password/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { isValidPassword } from "@/lib/auth/validation";

export type RequestPasswordResetState = { message: string | null };

const uniformReply: RequestPasswordResetState = {
  message: "If that address is registered, a reset link is on its way.",
};

export async function requestPasswordResetAction(
  _state: RequestPasswordResetState,
  formData: FormData,
): Promise<RequestPasswordResetState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return uniformReply;

  // rate-limit by IP and by email
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown";
  if (!consumeRateLimit(`request-reset:ip:${ip}`, 10, 60 * 60 * 1000))
    return uniformReply;
  if (!consumeRateLimit(`request-reset:email:${email}`, 3, 60 * 60 * 1000))
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
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token || !isValidPassword(password) || password !== confirmPassword) {
    return {
      error:
        "Use at least 6 characters, including one letter and one number, and make sure the passwords match.",
    };
  }

  try {
    await auth.api.resetPassword({ body: { newPassword: password, token } });
  } catch {
    return genericFailure;
  }

  redirect("/login");
}
