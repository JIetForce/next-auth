// src/app/(auth)/register/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getClientIp } from "@/lib/auth/client-ip";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { isValidPassword } from "@/lib/auth/validation";

export type RegisterState = { error: string | null };

const genericFailure: RegisterState = {
  error: "Could not complete sign-up. Check your details and try again.",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
      error: "Use at least 6 characters, including one letter and one number.",
    };
  }
  if (password !== confirmation) {
    return { error: "The two passwords do not match." };
  }

  const ip = getClientIp(await headers());

  if (!(await consumeRateLimit(`register:ip:${ip}`, 10, 60 * 60 * 1000))) {
    return genericFailure;
  }

  if (!(await consumeRateLimit(`register:email:${email}`, 3, 60 * 60 * 1000))) {
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
