// src/app/(auth)/register/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentViewer } from "@/lib/auth/session";
import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
