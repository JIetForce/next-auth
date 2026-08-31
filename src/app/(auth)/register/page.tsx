// src/app/(auth)/register/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create an account | Agent Roster",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  redirect("/login");
}
