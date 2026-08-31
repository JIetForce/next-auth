import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { isGoogleAuthConfigured } from "@/lib/auth/environment";
import { getCurrentViewer } from "@/lib/auth/session";

import { AuthCardShell } from "../_components/auth-card-shell";
import { GoogleSignInForm } from "../login/_components/google-sign-in-form";
import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = {
  title: "Create an account | Siftloom",
  description: "Create an account for Siftloom to access curated AI and SaaS tools.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  const configured = isGoogleAuthConfigured();

  return (
    <AuthCardShell
      badge={
        <>
          <Sparkles className="size-3 text-primary" aria-hidden="true" />
          <span>Get Started</span>
        </>
      }
      title="Create an account"
      description="Enter your details to create a new Siftloom account."
    >
      <RegisterForm />

      <div className="relative my-1 flex items-center justify-center">
        <Separator />
        <span className="absolute bg-card px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Or continue with
        </span>
      </div>

      <GoogleSignInForm configured={configured} />

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck
            className="size-3.5 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          256-bit TLS
        </span>
        <span>&bull;</span>
        <span className="inline-flex items-center gap-1">
          <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
          Email Verification
        </span>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </AuthCardShell>
  );
}
