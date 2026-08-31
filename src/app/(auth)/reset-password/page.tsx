import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentViewer } from "@/lib/auth/session";

import { AuthCardShell } from "../_components/auth-card-shell";
import { ForgotPasswordForm } from "./_components/forgot-password-form";
import { ResetPasswordForm } from "./_components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset your password | Agent Roster",
  robots: { index: false, follow: false },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  const { token } = await searchParams;
  const tokenValue = Array.isArray(token) ? token[0] : token;

  if (tokenValue) {
    return (
      <AuthCardShell
        badge={
          <>
            <Lock className="size-3 text-primary" aria-hidden="true" />
            <span>New password</span>
          </>
        }
        title="Set a new password"
        description="Enter a new password below."
      >
        <ResetPasswordForm token={tokenValue} />

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck
              className="size-3.5 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            Secure Reset
          </span>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Back to sign in
          </Link>
        </p>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell
      badge={
        <>
          <KeyRound className="size-3 text-primary" aria-hidden="true" />
          <span>Password Recovery</span>
        </>
      }
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
    >
      <ForgotPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
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
