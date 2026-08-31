import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, Info, Lock, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { isGoogleAuthConfigured } from "@/lib/auth/environment";
import { getCurrentViewer } from "@/lib/auth/session";

import { AuthCardShell } from "../_components/auth-card-shell";
import { CredentialsForm } from "./_components/credentials-form";
import { GoogleSignInForm } from "./_components/google-sign-in-form";

export const metadata: Metadata = {
  title: "Sign in | Siftloom",
  description: "Sign in or create an account for Siftloom.",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    verify?: string | string[];
  }>;
};

type LoginError = "configuration" | "oauth" | null;

function normalizeLoginError(error: string | string[] | undefined): LoginError {
  const value = Array.isArray(error) ? error[0] : error;

  if (!value) return null;
  return value === "configuration" ? "configuration" : "oauth";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  const configured = isGoogleAuthConfigured();
  const { error, verify } = await searchParams;
  const loginError = normalizeLoginError(error);

  const isVerifyMode = Boolean(Array.isArray(verify) ? verify[0] : verify);
  if (isVerifyMode) redirect("/verify-email");

  const showConfigurationError = !configured || loginError === "configuration";
  const showOAuthError = configured && loginError === "oauth";

  return (
    <AuthCardShell
      badge={
        <>
          <Lock className="size-3 text-primary" aria-hidden="true" />
          <span>Single Sign-On</span>
        </>
      }
      title="Welcome back"
      description="Sign in with your email or Google account to continue."
    >
      {showConfigurationError ? (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-foreground dark:border-amber-500/40 dark:bg-amber-950/20">
          <Info
            className="text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <AlertTitle>Google sign-in is not configured</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Add BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET,
            then restart the application.
          </AlertDescription>
        </Alert>
      ) : null}

      {showOAuthError ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Unable to sign in</AlertTitle>
          <AlertDescription className="text-xs">
            Google sign-in could not be completed. Please try again.
          </AlertDescription>
        </Alert>
      ) : null}

      <CredentialsForm />

      <Link
        href="/reset-password"
        className="text-right text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Forgot your password?
      </Link>

      <div className="relative my-1 flex items-center justify-center">
        <Separator />
        <span className="absolute bg-card px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Secure Access
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
          <Lock className="size-3.5 text-primary" aria-hidden="true" />
          OAuth 2.0 / OIDC
        </span>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Create one
        </Link>
      </p>
    </AuthCardShell>
  );
}
