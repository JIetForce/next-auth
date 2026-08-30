"use server";

import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { getCurrentViewer } from "@/lib/auth/session";

export async function signOutAction(): Promise<void> {
  const viewer = await getCurrentViewer();
  if (!viewer) redirect("/");

  await signOut({ redirectTo: "/" });
}
