"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CircleAlert,
  Info,
  Lock,
  MailCheck,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { RegisterForm } from "@/app/(auth)/register/_components/register-form";
import { ResendForm } from "@/app/(auth)/verify-email/_components/resend-form";

import { CredentialsForm } from "./credentials-form";
import { GoogleSignInForm } from "./google-sign-in-form";

type AuthCardProps = {
  configured: boolean;
  showConfigurationError: boolean;
  showOAuthError: boolean;
  defaultTab?: "signin" | "register" | "verify";
};

export function AuthCard({
  configured,
  showConfigurationError,
  showOAuthError,
  defaultTab = "signin",
}: AuthCardProps) {
  const [tab, setTab] = useState<"signin" | "register" | "verify">(defaultTab);

  return (
    <Card className="w-full max-w-md border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/20">
      <CardHeader className="flex flex-col gap-2 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start">
          <Badge
            variant="outline"
            className="gap-1 px-2.5 py-0.5 text-xs text-muted-foreground"
          >
            {tab === "signin" ? (
              <>
                <Lock className="size-3 text-primary" aria-hidden="true" />
                <span>Single Sign-On</span>
              </>
            ) : tab === "register" ? (
              <>
                <Sparkles className="size-3 text-primary" aria-hidden="true" />
                <span>Get Started</span>
              </>
            ) : (
              <>
                <MailCheck className="size-3 text-primary" aria-hidden="true" />
                <span>Email Confirmation</span>
              </>
            )}
          </Badge>
        </div>
        <CardTitle>
          <h1 className="text-2xl font-bold tracking-tight">
            {tab === "signin"
              ? "Welcome back"
              : tab === "register"
                ? "Create an account"
                : "Confirm your email"}
          </h1>
        </CardTitle>
        <CardDescription className="text-sm">
          {tab === "signin"
            ? "Sign in with your email or Google account to continue."
            : tab === "register"
              ? "Enter your details to create a new Agent Roster account."
              : "We sent a verification link to your email. Open it to finish creating your account."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <Tabs
          value={tab}
          onValueChange={(val) => setTab(val as "signin" | "register" | "verify")}
          className="w-full gap-4"
        >
          <TabsList className="grid w-full grid-cols-2 p-1">
            <TabsTrigger value="signin" className="gap-1.5">
              <Lock className="size-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-1.5">
              <UserPlus className="size-3.5" aria-hidden="true" />
              <span>Create Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-2 flex flex-col gap-4">
            {showConfigurationError ? (
              <Alert className="border-amber-500/30 bg-amber-500/10 text-foreground dark:border-amber-500/40 dark:bg-amber-950/20">
                <Info
                  className="text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                <AlertTitle>Google sign-in is not configured</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  Add BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, and
                  GOOGLE_CLIENT_SECRET, then restart the application.
                </AlertDescription>
              </Alert>
            ) : null}

            {showOAuthError ? (
              <Alert variant="destructive">
                <CircleAlert aria-hidden="true" />
                <AlertTitle>Unable to sign in</AlertTitle>
                <AlertDescription className="text-xs">
                  Google sign-in could not be completed. Please try again.
                </AlertDescription>
              </Alert>
            ) : null}

            <CredentialsForm />

            <div className="relative my-1 flex items-center justify-center">
              <Separator />
              <span className="absolute bg-card px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Secure Access
              </span>
            </div>

            <GoogleSignInForm configured={configured} />

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck
                  className="size-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                256-bit TLS
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3.5 text-primary" aria-hidden="true" />
                OAuth 2.0 / OIDC
              </span>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setTab("register")}
                className="cursor-pointer font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                Create one
              </button>
            </p>
          </TabsContent>

          <TabsContent value="register" className="mt-2 flex flex-col gap-4">
            <RegisterForm />

            <div className="relative my-1 flex items-center justify-center">
              <Separator />
              <span className="absolute bg-card px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Or continue with
              </span>
            </div>

            <GoogleSignInForm configured={configured} />

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck
                  className="size-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                256-bit TLS
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                Email Verification
              </span>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setTab("signin")}
                className="cursor-pointer font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                Sign in
              </button>
            </p>
          </TabsContent>

          <TabsContent value="verify" className="mt-2 flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MailCheck className="size-4.5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Verification link sent</span>
                <span>
                  Check your inbox to confirm your email. It may take a minute to arrive.
                </span>
              </div>
            </div>

            <ResendForm />

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck
                  className="size-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                Secure Verification
              </span>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already confirmed?{" "}
              <button
                type="button"
                onClick={() => setTab("signin")}
                className="cursor-pointer font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                Sign in
              </button>
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border/50 pt-4 text-center">
        <CardDescription className="text-xs">
          Authentication is handled securely with deterministic verification.
        </CardDescription>
        <p className="text-[11px] text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link
            href="/"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
