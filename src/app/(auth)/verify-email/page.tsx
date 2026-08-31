// src/app/(auth)/verify-email/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Confirm your email | Agent Roster",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  redirect("/login?verify=true");
}
