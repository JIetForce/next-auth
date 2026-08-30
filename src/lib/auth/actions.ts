// src/lib/auth/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCurrentViewer } from "@/lib/auth/session";

export async function signOutAction(): Promise<void> {
  const viewer = await getCurrentViewer();
  if (!viewer) redirect("/");

  await auth.api.signOut({ headers: await headers() });

  redirect("/");
}
