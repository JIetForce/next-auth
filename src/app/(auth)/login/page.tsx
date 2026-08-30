import type { Metadata } from "next";
import { CircleAlert, Info } from "lucide-react";
import { redirect } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isGoogleAuthConfigured } from "@/lib/auth/environment";
import { getCurrentViewer } from "@/lib/auth/session";

import { GoogleSignInForm } from "./_components/google-sign-in-form";

export const metadata: Metadata = {
  title: "Sign in | Agent Roster",
  description: "Sign in to Agent Roster with your Google account.",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

type LoginError = "configuration" | "oauth" | null;

function normalizeLoginError(error: string | string[] | undefined): LoginError {
  const value = Array.isArray(error) ? error[0] : error;

  if (!value) return null;
  return value === "configuration" ? "configuration" : "oauth";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  const configured = isGoogleAuthConfigured();
  const { error } = await searchParams;
  const loginError = normalizeLoginError(error);

  const showConfigurationError = !configured || loginError === "configuration";
  const showOAuthError = configured && loginError === "oauth";

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/30 p-4 sm:p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1>Welcome back</h1>
          </CardTitle>
          <CardDescription>
            Continue with your Google account to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {showConfigurationError ? (
            <Alert>
              <Info aria-hidden="true" />
              <AlertTitle>Google sign-in is not configured</AlertTitle>
              <AlertDescription>
                Add AUTH_SECRET, AUTH_GOOGLE_ID, and AUTH_GOOGLE_SECRET, then
                restart the application.
              </AlertDescription>
            </Alert>
          ) : null}
          {showOAuthError ? (
            <Alert variant="destructive">
              <CircleAlert aria-hidden="true" />
              <AlertTitle>Unable to sign in</AlertTitle>
              <AlertDescription>
                Google sign-in could not be completed. Please try again.
              </AlertDescription>
            </Alert>
          ) : null}
          <GoogleSignInForm configured={configured} />
        </CardContent>
        <CardFooter className="justify-center">
          <CardDescription>
            Authentication is handled securely by Google.
          </CardDescription>
        </CardFooter>
      </Card>
    </main>
  );
}
