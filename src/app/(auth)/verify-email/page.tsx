import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck, ShieldCheck } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentViewer } from "@/lib/auth/session";

import { AuthCardShell } from "../_components/auth-card-shell";
import { AuthContentSkeleton } from "../_components/auth-content-skeleton";
import { ResendForm } from "./_components/resend-form";

export const metadata: Metadata = {
  title: "Confirm your email | Siftloom",
  description: "Confirm your email address to access your Siftloom account.",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <AuthCardShell
      badge={
        <>
          <MailCheck className="size-3 text-primary" aria-hidden="true" />
          <span>Email Confirmation</span>
        </>
      }
      title="Confirm your email"
      description="We sent a verification link to your email. Open it to finish creating your account."
    >
      <Suspense fallback={<AuthContentSkeleton />}>
        <VerifyEmailContent />
      </Suspense>
    </AuthCardShell>
  );
}

export async function VerifyEmailContent() {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  const cookieStore = await cookies();
  const initialEmail = cookieStore.get("pending_verification_email")?.value;

  return (
    <>
      <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <MailCheck className="size-4.5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            Verification link sent
          </span>
          <span>
            Check your inbox to confirm your email. It may take a minute to
            arrive.
          </span>
        </div>
      </div>

      <ResendForm defaultEmail={initialEmail} />

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck
            className="size-3.5 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          Secure Verification
        </span>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already confirmed?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
