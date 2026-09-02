// src/app/(auth)/register/actions.ts
"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getClientIp } from "@/lib/auth/client-ip";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { MIN_PASSWORD_LENGTH, registerSchema } from "@/lib/auth/schemas";

export type RegisterState = { error: string | null };

const genericFailure: RegisterState = {
  error: "Could not complete sign-up. Check your details and try again.",
};

export async function registerAction(
  _state: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const ip = getClientIp(await headers());

  if (!(await consumeRateLimit(`register:ip:${ip}`, 10, 60 * 60 * 1000))) {
    return genericFailure;
  }

  const parseResult = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parseResult.success) {
    const issues = parseResult.error.issues;

    // Preserve the existing reply ordering: name/email, then password,
    // then confirmation mismatch.
    if (
      issues.some(
        (issue) => issue.path[0] === "name" || issue.path[0] === "email",
      )
    ) {
      return genericFailure;
    }
    if (issues.some((issue) => issue.path[0] === "password")) {
      return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
    }
    if (issues.some((issue) => issue.path[0] === "confirmPassword")) {
      return { error: "The two passwords do not match." };
    }

    return genericFailure;
  }

  const { name, email, password } = parseResult.data;

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

  const cookieStore = await cookies();
  cookieStore.set("pending_verification_email", email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 60,
    path: "/verify-email",
  });

  redirect("/verify-email");
}
