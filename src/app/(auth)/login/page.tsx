import type { Metadata } from "next";
import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  CircleAlert,
  Info,
  Lock,
  Quote,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";

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
import { isGoogleAuthConfigured } from "@/lib/auth/environment";
import { getCurrentViewer } from "@/lib/auth/session";

import { CredentialsForm } from "./_components/credentials-form";
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
    <main className="relative flex min-h-[calc(100svh-3.5rem)] flex-1 overflow-hidden bg-background">
      {/* Ambient background lighting and gradient effects */}
      <div
        className="pointer-events-none absolute -top-40 left-1/4 -z-10 size-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-1/4 -z-10 size-[500px] translate-x-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
        aria-hidden="true"
      />

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-8 p-4 sm:p-6 lg:grid-cols-12 lg:gap-12 lg:p-8">
        {/* Left column: Showcase & Brand Value (Desktop) */}
        <div className="hidden flex-col justify-between gap-8 lg:col-span-6 lg:flex xl:col-span-7">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
                <Sparkles
                  className="size-3.5 text-primary"
                  aria-hidden="true"
                />
                <span>Next-Gen Multi-Agent Platform</span>
              </Badge>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl xl:text-5xl">
                Deterministic Review &amp; Delivery Loop
              </h2>
              <p className="max-w-lg text-base text-muted-foreground">
                Orchestrate developers, verifiers, and specialized review
                triumvirates with automated consensus and real-time
                verification.
              </p>
            </div>

            {/* Platform Metrics */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-xs">
              <div className="flex flex-col gap-1 border-r border-border/50 pr-2">
                <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  100%
                </span>
                <span className="text-xs text-muted-foreground">
                  Deterministic Builds
                </span>
              </div>
              <div className="flex flex-col gap-1 border-r border-border/50 px-2">
                <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  3-Lens
                </span>
                <span className="text-xs text-muted-foreground">
                  Review Consensus
                </span>
              </div>
              <div className="flex flex-col gap-1 pl-2">
                <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  Zero
                </span>
                <span className="text-xs text-muted-foreground">
                  Stored Secrets
                </span>
              </div>
            </div>

            {/* Feature Highlights Matrix */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 p-3.5 backdrop-blur-xs">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Bot className="size-4" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Autonomous Roles</span>
                  <span className="text-xs text-muted-foreground">
                    Developer, verifier, and 3-lens reviewers
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 p-3.5 backdrop-blur-xs">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    Real-time Verification
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Deterministic build and test evidence
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 p-3.5 backdrop-blur-xs sm:col-span-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Shield className="size-4" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    Enterprise Security
                  </span>
                  <span className="text-xs text-muted-foreground">
                    OIDC tokens, zero local credential storage &amp; strict
                    origin isolation
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof / Customer Testimonial Quote */}
          <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-5 shadow-xs backdrop-blur-sm">
            <Quote
              className="pointer-events-none absolute right-3 top-3 size-12 text-foreground/5 dark:text-foreground/10"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-3">
              <p className="text-sm italic text-foreground/90">
                &ldquo;Agent Roster transformed our delivery cycle into a
                verifiable, deterministic loop with automated multi-agent
                consensus.&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  AI
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">
                    Autonomous Engineering Lead
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    AI Systems Infrastructure
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Auth Card */}
        <div className="flex w-full flex-col items-center justify-center lg:col-span-6 xl:col-span-5">
          <Card className="w-full max-w-md border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/20">
            <CardHeader className="flex flex-col gap-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start">
                <Badge
                  variant="outline"
                  className="gap-1 px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  <Lock className="size-3" aria-hidden="true" />
                  <span>Single Sign-On</span>
                </Badge>
              </div>
              <CardTitle>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome back
                </h1>
              </CardTitle>
              <CardDescription className="text-sm">
                Continue with your Google account to sign in.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
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
                <Link
                  href="/register"
                  className="underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  Create one
                </Link>
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 border-t border-border/50 pt-4 text-center">
              <CardDescription className="text-xs">
                Authentication is handled securely by Google.
              </CardDescription>
              <p className="text-[11px] text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link
                  href="/"
                  className="underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/"
                  className="underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
