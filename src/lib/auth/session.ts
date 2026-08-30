import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAuthSessionConfigured } from "@/lib/auth/environment";
import type { Viewer } from "@/lib/auth/types";

export const getCurrentViewer = cache(async (): Promise<Viewer | null> => {
  if (!isAuthSessionConfigured()) return null;

  const session = await auth();
  if (!session?.user) return null;

  return {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };
});

export async function requireCurrentViewer(): Promise<Viewer> {
  const viewer = await getCurrentViewer();
  if (!viewer) redirect("/login");
  return viewer;
}
