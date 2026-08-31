import type { Metadata } from "next";

import { SignOutButton } from "@/components/sign-out-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
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

export default async function ProfilePage() {
  const viewer = await requireCurrentViewer();
  const displayName = viewer.name ?? "Not provided";
  const displayEmail = viewer.email ?? "Not provided";

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />

      <Card className="relative z-10 w-full max-w-md border border-border/80 bg-card/85 shadow-2xl backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <UserAvatar viewer={viewer} size="lg" />
            <div className="min-w-0">
              <CardTitle>
                <h1 className="text-xl font-bold tracking-tight">Profile</h1>
              </CardTitle>
              <CardDescription>
                Your authenticated Siftloom account.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                Google
              </dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter>
          <form action={signOutAction} className="w-full">
            <SignOutButton />
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
