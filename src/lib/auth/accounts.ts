// src/lib/auth/accounts.ts
import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { prisma } from "@/lib/db";

function displayNameForProviderId(providerId: string): string {
  switch (providerId) {
    case "credential":
      return "Email and password";
    case "google":
      return "Google";
    default:
      return providerId;
  }
}

async function getLinkedAccountProviderLabelsByUserId(
  userId: string,
): Promise<readonly string[]> {
  "use cache";
  cacheTag(`accounts:${userId}`);
  cacheLife("hours");

  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { providerId: true },
  });

  const providerIds = Array.from(
    new Set(accounts.map((account) => account.providerId)),
  ).sort();

  return providerIds.map(displayNameForProviderId);
}

export async function getLinkedAccountProviderLabels(
  userId: string,
): Promise<readonly string[]> {
  return getLinkedAccountProviderLabelsByUserId(userId);
}
