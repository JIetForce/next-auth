// src/app/(auth)/register/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/auth/rate-limit";

export type RegisterState = { error: string | null };

const genericFailure: RegisterState = {
  error: "Could not complete sign-up. Check your details and try again.",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value: string) {
  return value.length >= 12 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
}

export async function registerAction(
  _state: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");

  if (!name || !isValidEmail(email)) return genericFailure;
  if (!isValidPassword(password)) {
    return {
      error: "Use at least 12 characters, including one letter and one number.",
    };
  }
  if (password !== confirmation) {
    return { error: "The two passwords do not match." };
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown";

  if (!consumeRateLimit(`register:ip:${ip}`, 10, 60 * 60 * 1000)) {
    return genericFailure;
  }

  if (!consumeRateLimit(`register:email:${email}`, 3, 60 * 60 * 1000)) {
    return genericFailure;
  }

  try {
    await auth.api.signUpEmail({
      body: { name, email, password, callbackURL: "/login" },
    });
  } catch {
    return genericFailure;
  }

  redirect("/verify-email");
}
