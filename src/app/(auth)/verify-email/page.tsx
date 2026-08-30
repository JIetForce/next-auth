// src/app/(auth)/verify-email/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

import { ResendForm } from "./_components/resend-form";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Confirm your email</h1>
      <p className="text-sm text-muted-foreground">
        We sent you a link. Open it to finish creating your account. It may take
        a minute to arrive, and it can land in your spam folder.
      </p>
      <ResendForm />
      <p className="text-sm text-muted-foreground">
        Already confirmed? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
