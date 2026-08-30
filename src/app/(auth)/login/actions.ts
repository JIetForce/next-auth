// src/app/(auth)/login/actions.ts
"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isGoogleAuthConfigured } from "@/lib/auth/environment";

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
