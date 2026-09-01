// src/app/(auth)/login/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getClientIp } from "@/lib/auth/client-ip";
import { isGoogleAuthConfigured } from "@/lib/auth/environment";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { signInSchema } from "@/lib/auth/schemas";

export async function signInWithGoogle() {
  if (!isGoogleAuthConfigured()) {
    redirect("/login?error=configuration");
  }

  let providerUrl: string | undefined;

  try {
    const result = await auth.api.signInSocial({
      body: { provider: "google", callbackURL: "/" },
    });
    providerUrl = result.url;
  } catch {
    redirect("/login?error=oauth");
  }

  if (!providerUrl) {
    redirect("/login?error=oauth");
  }

  redirect(providerUrl);
}

export type SignInState = { error: string | null };

export async function signInWithCredentials(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const ip = getClientIp(await headers());

  if (!(await consumeRateLimit(`signin:ip:${ip}`, 20, 15 * 60 * 1000))) {
    return { error: "Too many attempts. Try again later." };
  }

  const parseResult = signInSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parseResult.success) {
    return { error: "Enter your email and password." };
  }

  const { email, password } = parseResult.data;

  if (!(await consumeRateLimit(`signin:email:${email}`, 5, 15 * 60 * 1000))) {
    return { error: "Too many attempts. Try again later." };
  }

  try {
    await auth.api.signInEmail({ body: { email, password } });
  } catch {
    // One message for wrong password, unknown address, and unconfirmed
    // address alike — the caller learns nothing about which it was.
    return {
      error:
        "Could not sign in. Check your details, and confirm your email if you have not yet.",
    };
  }

  redirect("/");
}
