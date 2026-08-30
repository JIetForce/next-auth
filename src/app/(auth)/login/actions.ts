"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { isGoogleAuthConfigured } from "@/lib/auth/environment";

export async function signInWithGoogle() {
  if (!isGoogleAuthConfigured()) {
    redirect("/login?error=configuration");
  }

  try {
    await signIn("google", { redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=oauth");
    }

    throw error;
  }
}
