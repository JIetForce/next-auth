import type { Metadata } from "next";
import { Suspense } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { getLinkedAccountProviderLabels } from "@/lib/auth/accounts";
import { signOutAction } from "@/lib/auth/actions";
import { requireCurrentViewer } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Profile | Siftloom",
  description: "View your authenticated Siftloom account details.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilePage() {
  return (
    <main
      id="main-content"
      className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-6"
    >
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />

      <Card className="relative z-10 w-full max-w-md border border-border/80 bg-card/85 shadow-2xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-bold tracking-tight">Profile</h1>
          </CardTitle>
          <CardDescription>
            Your authenticated Siftloom account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ProfileDetailsSkeleton />}>
            <ProfileDetails />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function ProfileDetails() {
  const viewer = await requireCurrentViewer();
  const displayName = viewer.name ?? "Not provided";
  const displayEmail = viewer.email ?? "Not provided";

  const providerLabels = await getLinkedAccountProviderLabels(viewer.id);
  const displayProviders =
    providerLabels.length > 0 ? providerLabels.join(", ") : "Not available";

  return (
    <div className="flex flex-col gap-6">
      <UserAvatar viewer={viewer} size="lg" />
      <dl className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm text-muted-foreground">Name</dt>
          <dd className="text-right text-sm font-medium text-foreground">
            {displayName}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="min-w-0 truncate text-right text-sm font-medium text-foreground">
            {displayEmail}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm text-muted-foreground">Provider</dt>
          <dd className="text-right text-sm font-medium text-foreground">
            {displayProviders}
          </dd>
        </div>
      </dl>
      <form
        action={signOutAction}
        className="w-full border-t border-border/50 pt-4"
      >
        <SignOutButton />
      </form>
    </div>
  );
}

function ProfileDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="size-10 rounded-full" aria-hidden="true" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-full" aria-hidden="true" />
        <Skeleton className="h-4 w-full" aria-hidden="true" />
        <Skeleton className="h-4 w-2/3" aria-hidden="true" />
      </div>
      <Skeleton className="h-8 w-full" aria-hidden="true" />
    </div>
  );
}
