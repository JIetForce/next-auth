# Auth Route Split, Shared Shell, and Password Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tabbed `AuthCard` on `/login` with three dedicated routes (`/login`, `/register`, `/verify-email`), add a self-service password reset flow at `/reset-password`, and update E2E tests to match.

**Architecture:** A shared `(auth)/layout.tsx` renders the left-side showcase and the right-hand slot; each auth page renders only its card via a shared `AuthCardShell` server component. All auth calls go through Next.js Server Actions that call `auth.api.*` in-process. Password reset uses Better Auth's `requestPasswordReset` / `resetPassword` endpoints with a non-awaited `sendResetPassword` email transport, matching the existing `sendVerificationEmail` pattern.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, Better Auth 1.7.2, Prisma 7.10.0, Zod, react-hook-form, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-31-auth-navigation-password-reset-design.md`

## Global Constraints

- Password minimum length is 6 characters — do not change it. `2026-08-31-reduce-min-password-length` intentionally set it from 12 to 6.
- `sendResetPassword` must be non-blocking and must swallow transport errors, exactly like `sendVerificationEmail` — response timing must not leak whether an address exists.
- `requestPasswordResetAction` always returns the same success message regardless of whether the address is registered — the flow cannot be used to enumerate accounts.
- `requestPasswordResetAction` uses `consumeRateLimit` for IP and email, matching the resend and registration actions.
- `nextCookies()` must stay last in `plugins` in `src/auth.ts`.
- No new email template files. `sendResetPassword` inlines the message.
- No changes to the email transport (`src/lib/email/client.ts`), the database schema, the `/api/auth/[...all]/route.ts` handler, or the session boundary (`src/lib/auth/session.ts`, `Viewer` DTO).
- No new OAuth providers, 2FA, passkeys, organizations, or profile editing.
- All `/login`, `/register`, `/verify-email`, and `/reset-password` pages redirect to `/` when `getCurrentViewer()` returns a user.
- `src/lib/email/client.ts` is the only module that knows which mail transport is in use.
- The developer does NOT commit. Commit steps below define the `git add` scope for the coordinator.

---

### Task 1: Password reset backend — `auth.ts` and schemas

**Files:**

- Modify: `src/auth.ts:11-17` (add reset options + `sendResetPassword` to `emailAndPassword`)
- Modify: `src/lib/auth/schemas.ts:38-42` (append forgot + reset schemas)

**Interfaces:**

- Consumes: `sendEmail` from `@/lib/email/client` (already imported in `auth.ts`).
- Produces: `forgotPasswordSchema` / `ForgotPasswordInput` and `resetPasswordSchema` / `ResetPasswordInput` from `@/lib/auth/schemas`. Task 3's forms consume these. `auth.api.requestPasswordReset` and `auth.api.resetPassword` become available — Task 3's actions call them.

**Verification:** `npm run build` and `npm run lint` pass. Existing E2E tests still pass (no UI changed). The verifier for this task runs `npm run build` and `npm run lint` only — E2E is not affected.

- [ ] **Step 1: Add reset options and `sendResetPassword` to `auth.ts`**

In `src/auth.ts`, replace the `emailAndPassword` block (lines 11–17) with:

```ts
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // Not awaited: response timing must not reveal whether the address exists.
      // The catch keeps a transport failure from becoming an unhandled rejection.
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: [
          "Click the link to reset your password:",
          "",
          url,
          "",
          "If you did not request this, you can ignore this message.",
        ].join("\n"),
      }).catch((error: unknown) => {
        console.error("Failed to send reset password email", error);
      });
    },
  },
```

`nextCookies()` stays last in `plugins` — do not move it.

**API verification:** Before proceeding, confirm that Better Auth 1.7.2 exposes `auth.api.requestPasswordReset` and `auth.api.resetPassword`. If either is missing, file a `### Blocked` report with the exact API surface found in `node_modules/better-auth` and stop. The `sendResetPassword` callback signature `({ user, url, token })` should match what Better Auth calls — verify the parameter names in the Better Auth source or types. If the signature differs (e.g. `({ user, url, token, nonce })`), adapt the destructure but keep the non-awaited `sendEmail` pattern.

- [ ] **Step 2: Add forgot and reset schemas to `schemas.ts`**

Append to `src/lib/auth/schemas.ts`, after the `resendSchema` block:

```ts
export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, {
        message:
          "Use at least 6 characters, including one letter and one number.",
      })
      .regex(/[a-zA-Z]/, {
        message:
          "Use at least 6 characters, including one letter and one number.",
      })
      .regex(/[0-9]/, {
        message:
          "Use at least 6 characters, including one letter and one number.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

- [ ] **Step 3: Run build and lint**

Run: `npm run build && npm run lint`
Expected: both pass with no errors.

- [ ] **Step 4: Commit (coordinator only — defines scope)**

```bash
git add src/auth.ts src/lib/auth/schemas.ts
git commit -m "feat(auth): enable password reset in Better Auth config and schemas"
```

---

### Task 2: Route split — shared shell, layout, dedicated pages, E2E updates

**Files:**

- Create: `src/app/(auth)/_components/auth-showcase.tsx`
- Create: `src/app/(auth)/_components/auth-card-shell.tsx`
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(auth)/login/page.tsx` (full rewrite)
- Modify: `src/app/(auth)/register/page.tsx` (full rewrite — no longer redirects)
- Modify: `src/app/(auth)/verify-email/page.tsx` (full rewrite — no longer redirects)
- Modify: `src/app/(auth)/register/actions.ts:65` (redirect target)
- Delete: `src/app/(auth)/login/_components/auth-card.tsx`
- Modify: `e2e/login.spec.ts` (add forgot-link test)
- Modify: `e2e/registration.spec.ts` (remove tab clicks, use /register, expect /verify-email)

**Interfaces:**

- Consumes: `getCurrentViewer` from `@/lib/auth/session`, `isGoogleAuthConfigured` from `@/lib/auth/environment`, `CredentialsForm` from `@/app/(auth)/login/_components/credentials-form`, `RegisterForm` from `@/app/(auth)/register/_components/register-form`, `ResendForm` from `@/app/(auth)/verify-email/_components/resend-form`, `GoogleSignInForm` from `@/app/(auth)/login/_components/google-sign-in-form`.
- Produces: `AuthShowcase` (server component, no props) and `AuthCardShell` (server component, props: `badge: ReactNode`, `title: string`, `description: string`, `children: ReactNode`). Task 3's reset-password page consumes `AuthCardShell`.

**Verification:** `npm run build` and `npm run lint` pass. `npm run test` passes for `e2e/login.spec.ts` and `e2e/registration.spec.ts`. The verifier runs all three.

- [ ] **Step 1: Create `auth-showcase.tsx`**

Create `src/app/(auth)/_components/auth-showcase.tsx`. This is a server component that renders the left column currently embedded in `login/page.tsx` (lines 64–188). Copy the JSX verbatim — the badge, heading, description, metrics grid, feature highlights, and testimonial quote:

```tsx
import { Bot, CheckCircle2, Quote, Shield, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function AuthShowcase() {
  return (
    <div className="hidden flex-col justify-between gap-8 lg:col-span-6 lg:flex xl:col-span-7">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            <span>Next-Gen Multi-Agent Platform</span>
          </Badge>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl xl:text-5xl">
            Deterministic Review &amp; Delivery Loop
          </h2>
          <p className="max-w-lg text-base text-muted-foreground">
            Orchestrate developers, verifiers, and specialized review
            triumvirates with automated consensus and real-time verification.
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
              <span className="text-sm font-medium">Enterprise Security</span>
              <span className="text-xs text-muted-foreground">
                OIDC tokens, zero local credential storage &amp; strict origin
                isolation
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
  );
}
```

- [ ] **Step 2: Create `auth-card-shell.tsx`**

Create `src/app/(auth)/_components/auth-card-shell.tsx`. Server component. The footer matches the existing `auth-card.tsx` footer (lines 255–276):

```tsx
import type { ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthCardShellProps = {
  badge: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthCardShell({
  badge,
  title,
  description,
  children,
}: AuthCardShellProps) {
  return (
    <Card className="w-full max-w-md border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/20">
      <CardHeader className="flex flex-col gap-2 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start">
          <Badge
            variant="outline"
            className="gap-1 px-2.5 py-0.5 text-xs text-muted-foreground"
          >
            {badge}
          </Badge>
        </div>
        <CardTitle>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">{children}</CardContent>

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
```

- [ ] **Step 3: Rewrite `layout.tsx`**

Replace `src/app/(auth)/layout.tsx` with the header plus the main grid. The ambient background divs and the grid come from the current `login/page.tsx` (lines 52–63). The `AuthShowcase` goes in the left column; `{children}` goes in the right column:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { AuthShowcase } from "./_components/auth-showcase";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading text-base font-semibold tracking-tight transition-opacity hover:opacity-90"
          >
            <span
              className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-xs"
              aria-hidden="true"
            >
              AR
            </span>
            <span>Agent Roster</span>
          </Link>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>
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
          <AuthShowcase />
          <div className="flex w-full flex-col items-center justify-center lg:col-span-6 xl:col-span-5">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `login/page.tsx`**

Replace `src/app/(auth)/login/page.tsx`. The page renders only the `AuthCardShell` with login content. It handles `?verify=true` (redirect to `/verify-email`) and `?error=...` (render alert). The error alerts, separator, Google form, security badges, and links come from the current `auth-card.tsx` signin tab (lines 114–175):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, Info, Lock, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { isGoogleAuthConfigured } from "@/lib/auth/environment";
import { getCurrentViewer } from "@/lib/auth/session";

import { AuthCardShell } from "../_components/auth-card-shell";
import { CredentialsForm } from "./_components/credentials-form";
import { GoogleSignInForm } from "./_components/google-sign-in-form";

export const metadata: Metadata = {
  title: "Sign in | Agent Roster",
  description: "Sign in or create an account for Agent Roster.",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    verify?: string | string[];
  }>;
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
  const { error, verify } = await searchParams;
  const loginError = normalizeLoginError(error);

  const isVerifyMode = Boolean(Array.isArray(verify) ? verify[0] : verify);
  if (isVerifyMode) redirect("/verify-email");

  const showConfigurationError = !configured || loginError === "configuration";
  const showOAuthError = configured && loginError === "oauth";

  return (
    <AuthCardShell
      badge={
        <>
          <Lock className="size-3 text-primary" aria-hidden="true" />
          <span>Single Sign-On</span>
        </>
      }
      title="Welcome back"
      description="Sign in with your email or Google account to continue."
    >
      {showConfigurationError ? (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-foreground dark:border-amber-500/40 dark:bg-amber-950/20">
          <Info
            className="text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <AlertTitle>Google sign-in is not configured</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Add BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET,
            then restart the application.
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

      <Link
        href="/reset-password"
        className="text-right text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Forgot your password?
      </Link>

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
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Create one
        </Link>
      </p>
    </AuthCardShell>
  );
}
```

- [ ] **Step 5: Rewrite `register/page.tsx`**

Replace `src/app/(auth)/register/page.tsx`. No longer redirects — renders the registration form:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { isGoogleAuthConfigured } from "@/lib/auth/environment";
import { getCurrentViewer } from "@/lib/auth/session";

import { AuthCardShell } from "../_components/auth-card-shell";
import { GoogleSignInForm } from "../login/_components/google-sign-in-form";
import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = {
  title: "Create an account | Agent Roster",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  const configured = isGoogleAuthConfigured();

  return (
    <AuthCardShell
      badge={
        <>
          <Sparkles className="size-3 text-primary" aria-hidden="true" />
          <span>Get Started</span>
        </>
      }
      title="Create an account"
      description="Enter your details to create a new Agent Roster account."
    >
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
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </AuthCardShell>
  );
}
```

- [ ] **Step 6: Rewrite `verify-email/page.tsx`**

Replace `src/app/(auth)/verify-email/page.tsx`. No longer redirects — renders the verify-email content:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentViewer } from "@/lib/auth/session";

import { AuthCardShell } from "../_components/auth-card-shell";
import { ResendForm } from "./_components/resend-form";

export const metadata: Metadata = {
  title: "Confirm your email | Agent Roster",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage() {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  return (
    <AuthCardShell
      badge={
        <>
          <MailCheck className="size-3 text-primary" aria-hidden="true" />
          <span>Email Confirmation</span>
        </>
      }
      title="Confirm your email"
      description="We sent a verification link to your email. Open it to finish creating your account."
    >
      <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <MailCheck className="size-4.5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            Verification link sent
          </span>
          <span>
            Check your inbox to confirm your email. It may take a minute to
            arrive.
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
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </AuthCardShell>
  );
}
```

- [ ] **Step 7: Update `register/actions.ts` redirect**

In `src/app/(auth)/register/actions.ts`, change line 65 from:

```ts
redirect("/login?verify=true");
```

to:

```ts
redirect("/verify-email");
```

- [ ] **Step 8: Delete `auth-card.tsx`**

Delete `src/app/(auth)/login/_components/auth-card.tsx`. It is no longer imported by any page.

- [ ] **Step 9: Run build and lint**

Run: `npm run build && npm run lint`
Expected: both pass. If the build reports an unused import in `auth-card.tsx` consumers, ensure no other file imports `AuthCard` — grep for `auth-card` to confirm.

- [ ] **Step 10: Update `e2e/registration.spec.ts`**

Replace `e2e/registration.spec.ts` in full. The tab clicks become `page.goto("/register")`. The redirect tests are removed (the routes no longer redirect). The URL expectations change from `/login?verify=true` to `/verify-email`:

```ts
// e2e/registration.spec.ts
import { expect, test } from "@playwright/test";

import { extractFirstUrl, readLatestMessageTo } from "./helpers/mail";

const password = "correct-horse-1";

function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.invalid`;
}

test("registers, confirms by email, then signs in", async ({ page }) => {
  const email = uniqueEmail("happy");

  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify-email$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Confirm your email" }),
  ).toBeVisible();

  const body = await readLatestMessageTo(email);
  await page.goto(extractFirstUrl(body));

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("http://localhost:3000/");

  await page.goto("/profile");
  await expect(page).toHaveURL(/\/profile$/);
});

test("refuses sign-in before the address is confirmed", async ({ page }) => {
  const email = uniqueEmail("unconfirmed");

  await page.goto("/register");
  await page.getByLabel("Name").fill("Unconfirmed Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email$/);

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Could not sign in" }),
  ).toBeVisible();
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
});

test("shows a client-side error for a password that is too short", async ({
  page,
}) => {
  const email = uniqueEmail("short-password");

  await page.goto("/register");
  await page.getByLabel("Name").fill("Short Password");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("abc1");
  await page.getByLabel("Confirm password").fill("abc1");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText(
      "Use at least 6 characters, including one letter and one number.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("shows a client-side error for a password missing a letter or number", async ({
  page,
}) => {
  const email = uniqueEmail("no-number-password");

  await page.goto("/register");
  await page.getByLabel("Name").fill("No Number Password");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("onlyletters");
  await page.getByLabel("Confirm password").fill("onlyletters");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText(
      "Use at least 6 characters, including one letter and one number.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("shows a client-side error when the confirmation password does not match", async ({
  page,
}) => {
  const email = uniqueEmail("mismatch");

  await page.goto("/register");
  await page.getByLabel("Name").fill("Mismatch Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill("different-password-1");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("The two passwords do not match.")).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("answers identically when the address is already registered", async ({
  page,
}) => {
  const email = uniqueEmail("duplicate");

  for (const attempt of [1, 2]) {
    await page.goto("/register");
    await page.getByLabel("Name").fill(`Duplicate ${attempt}`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    // Identical outcome both times: no error, same destination.
    await expect(page).toHaveURL(/\/verify-email$/);
  }
});
```

- [ ] **Step 11: Add forgot-link test to `e2e/login.spec.ts`**

Append this test at the end of `e2e/login.spec.ts`:

```ts
test("links to the password reset page", async ({ page }) => {
  await page.goto("/login");

  const forgotLink = page.getByRole("link", { name: "Forgot your password?" });
  await expect(forgotLink).toBeVisible();
  await expect(forgotLink).toHaveAttribute("href", "/reset-password");
});
```

- [ ] **Step 12: Run build, lint, and E2E tests**

Run: `npm run build && npm run lint && npx playwright test e2e/login.spec.ts e2e/registration.spec.ts`
Expected: all pass. The `e2e/reset-password.spec.ts` does not exist yet — that is Task 4. The `e2e/auth-session.spec.ts` should still pass unchanged.

- [ ] **Step 13: Commit (coordinator only — defines scope)**

```bash
git add src/app/(auth)/_components/auth-showcase.tsx src/app/(auth)/_components/auth-card-shell.tsx src/app/(auth)/layout.tsx src/app/(auth)/login/page.tsx src/app/(auth)/register/page.tsx src/app/(auth)/verify-email/page.tsx src/app/(auth)/register/actions.ts e2e/login.spec.ts e2e/registration.spec.ts
git rm src/app/(auth)/login/_components/auth-card.tsx
git commit -m "feat(auth): split auth routes into dedicated pages with shared shell"
```

---

### Task 3: Reset-password UI — actions, forms, page

**Files:**

- Create: `src/app/(auth)/reset-password/actions.ts`
- Create: `src/app/(auth)/reset-password/_components/forgot-password-form.tsx`
- Create: `src/app/(auth)/reset-password/_components/reset-password-form.tsx`
- Create: `src/app/(auth)/reset-password/page.tsx`

**Interfaces:**

- Consumes: `auth` from `@/auth`, `consumeRateLimit` from `@/lib/auth/rate-limit`, `forgotPasswordSchema` / `ForgotPasswordInput` and `resetPasswordSchema` / `ResetPasswordInput` from `@/lib/auth/schemas` (Task 1), `AuthCardShell` from `@/app/(auth)/_components/auth-card-shell` (Task 2), `getCurrentViewer` from `@/lib/auth/session`.
- Produces: `/reset-password` route (no token → email request form; `?token=...` → new password form). Task 4's E2E test navigates here.

**Verification:** `npm run build` and `npm run lint` pass. The `/reset-password` route renders without error. The verifier runs `npm run build` and `npm run lint`.

- [ ] **Step 1: Create `reset-password/actions.ts`**

Create `src/app/(auth)/reset-password/actions.ts` with the two server actions from the spec. The `requestPasswordResetAction` uses `consumeRateLimit` for IP and email, swallows all errors, and returns a uniform reply. The `resetPasswordAction` validates the password, calls `auth.api.resetPassword`, and redirects to `/login` on success:

```ts
// src/app/(auth)/reset-password/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/auth/rate-limit";

export type RequestPasswordResetState = { message: string | null };

const uniformReply: RequestPasswordResetState = {
  message: "If that address is registered, a reset link is on its way.",
};

export async function requestPasswordResetAction(
  _state: RequestPasswordResetState,
  formData: FormData,
): Promise<RequestPasswordResetState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return uniformReply;

  // rate-limit by IP and by email
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown";
  if (!consumeRateLimit(`request-reset:ip:${ip}`, 10, 60 * 60 * 1000))
    return uniformReply;
  if (!consumeRateLimit(`request-reset:email:${email}`, 3, 60 * 60 * 1000))
    return uniformReply;

  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
    });
  } catch {
    // swallowed: the reply must not vary with the outcome
  }

  return uniformReply;
}

export type ResetPasswordState = { error: string | null };

const genericFailure: ResetPasswordState = {
  error: "Could not reset your password. Check the link and try again.",
};

function isValidPassword(value: string) {
  return value.length >= 6 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
}

export async function resetPasswordAction(
  _state: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token || !isValidPassword(password) || password !== confirmPassword) {
    return {
      error:
        "Use at least 6 characters, including one letter and one number, and make sure the passwords match.",
    };
  }

  try {
    await auth.api.resetPassword({ body: { newPassword: password, token } });
  } catch {
    return genericFailure;
  }

  redirect("/login");
}
```

**API verification:** Confirm the parameter names for `auth.api.requestPasswordReset` and `auth.api.resetPassword` against the Better Auth 1.7.2 source in `node_modules/better-auth`. The spec uses `redirectTo` for `requestPasswordReset` and `{ newPassword, token }` for `resetPassword`. If the actual parameter names differ (e.g. `callbackURL` instead of `redirectTo`), adapt to match the library and note the discrepancy in the report. Do not guess — verify in the source.

- [ ] **Step 2: Create `forgot-password-form.tsx`**

Create `src/app/(auth)/reset-password/_components/forgot-password-form.tsx`. Client component using `useActionState` + `react-hook-form` + `zodResolver`, matching the pattern in `resend-form.tsx`:

```tsx
// src/app/(auth)/reset-password/_components/forgot-password-form.tsx
"use client";

import { startTransition, useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Mail, Send } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/auth/schemas";

import {
  requestPasswordResetAction,
  type RequestPasswordResetState,
} from "../actions";

const initialState: RequestPasswordResetState = { message: null };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onValid = (data: ForgotPasswordInput) => {
    const formData = new FormData();
    formData.set("email", data.email);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onValid)}
      noValidate
      className="flex flex-col gap-4"
    >
      {state.message ? (
        <Alert className="border-primary/20 bg-primary/5 py-2.5 text-xs text-foreground">
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5" data-invalid={!!errors.email}>
        <Label htmlFor="forgot-email" className="text-xs font-medium">
          Email
        </Label>
        <div className="relative flex items-center">
          <Mail
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="forgot-email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            className="pl-9"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full gap-2 font-medium"
      >
        {pending ? (
          <span>Sending…</span>
        ) : (
          <>
            <Send className="size-3.5" aria-hidden="true" />
            <span>Send reset link</span>
          </>
        )}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Create `reset-password-form.tsx`**

Create `src/app/(auth)/reset-password/_components/reset-password-form.tsx`. Client component with password, confirm, and a hidden token field. The token is passed as a prop from the page (read from `searchParams`):

```tsx
// src/app/(auth)/reset-password/_components/reset-password-form.tsx
"use client";

import { startTransition, useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, CircleAlert, KeyRound, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/auth/schemas";

import { resetPasswordAction, type ResetPasswordState } from "../actions";

const initialState: ResetPasswordState = { error: null };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onValid = (data: ResetPasswordInput) => {
    const formData = new FormData();
    formData.set("token", token);
    formData.set("password", data.password);
    formData.set("confirmPassword", data.confirmPassword);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onValid)}
      noValidate
      className="flex flex-col gap-4"
    >
      {state.error ? (
        <Alert variant="destructive" className="py-2.5 text-xs">
          <CircleAlert className="size-4" aria-hidden="true" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5" data-invalid={!!errors.password}>
        <Label htmlFor="reset-password" className="text-xs font-medium">
          New password
        </Label>
        <div className="relative flex items-center">
          <KeyRound
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="reset-password"
            type="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            className="pl-9"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </div>
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Must be at least 6 characters with letters and numbers.
          </p>
        )}
      </div>

      <div
        className="flex flex-col gap-1.5"
        data-invalid={!!errors.confirmPassword}
      >
        <Label htmlFor="reset-confirmPassword" className="text-xs font-medium">
          Confirm password
        </Label>
        <div className="relative flex items-center">
          <ShieldCheck
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="reset-confirmPassword"
            type="password"
            placeholder="Repeat password"
            autoComplete="new-password"
            className="pl-9"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </div>
        {errors.confirmPassword ? (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full gap-2 font-medium"
      >
        {pending ? (
          <span>Resetting…</span>
        ) : (
          <>
            <span>Reset password</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Create `reset-password/page.tsx`**

Create `src/app/(auth)/reset-password/page.tsx`. Server component that reads `searchParams.token` and renders either the forgot-password form or the reset-password form:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentViewer } from "@/lib/auth/session";

import { AuthCardShell } from "../_components/auth-card-shell";
import { ForgotPasswordForm } from "./_components/forgot-password-form";
import { ResetPasswordForm } from "./_components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset your password | Agent Roster",
  robots: { index: false, follow: false },
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  const { token } = await searchParams;
  const tokenValue = Array.isArray(token) ? token[0] : token;

  if (tokenValue) {
    return (
      <AuthCardShell
        badge={
          <>
            <Lock className="size-3 text-primary" aria-hidden="true" />
            <span>New password</span>
          </>
        }
        title="Set a new password"
        description="Enter a new password below."
      >
        <ResetPasswordForm token={tokenValue} />

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck
              className="size-3.5 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            Secure Reset
          </span>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Back to sign in
          </Link>
        </p>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell
      badge={
        <>
          <KeyRound className="size-3 text-primary" aria-hidden="true" />
          <span>Password Recovery</span>
        </>
      }
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
    >
      <ForgotPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </AuthCardShell>
  );
}
```

- [ ] **Step 5: Run build and lint**

Run: `npm run build && npm run lint`
Expected: both pass with no errors.

- [ ] **Step 6: Commit (coordinator only — defines scope)**

```bash
git add src/app/(auth)/reset-password/
git commit -m "feat(auth): add self-service password reset flow at /reset-password"
```

---

### Task 4: Reset-password E2E test

**Files:**

- Create: `e2e/reset-password.spec.ts`

**Interfaces:**

- Consumes: `extractFirstUrl`, `readLatestMessageTo` from `./helpers/mail`. The `/register`, `/verify-email`, `/login`, and `/reset-password` routes from Tasks 2–3.

**Verification:** `npm run build`, `npm run lint`, and `npm run test` all pass, including `e2e/reset-password.spec.ts`.

- [ ] **Step 1: Write `e2e/reset-password.spec.ts`**

Create `e2e/reset-password.spec.ts`. The test registers a user, verifies the email, signs in, signs out, requests a password reset, opens the captured reset link, sets a new password, and signs in with it. It follows the same mail-capture pattern as `registration.spec.ts`:

```ts
// e2e/reset-password.spec.ts
import { expect, test } from "@playwright/test";

import { extractFirstUrl, readLatestMessageTo } from "./helpers/mail";

const password = "correct-horse-1";
const newPassword = "new-stable-9";

function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.invalid`;
}

test("requests a reset, opens the link, sets a new password, and signs in", async ({
  page,
}) => {
  const email = uniqueEmail("reset");

  // Register
  await page.goto("/register");
  await page.getByLabel("Name").fill("Reset Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email$/);

  // Verify email
  const verifyBody = await readLatestMessageTo(email);
  await page.goto(extractFirstUrl(verifyBody));

  // Sign in with the original password, then sign out
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  // Request a reset
  await page.goto("/reset-password");
  await expect(
    page.getByRole("heading", { level: 1, name: "Reset your password" }),
  ).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(
    page.getByText(
      "If that address is registered, a reset link is on its way.",
    ),
  ).toBeVisible();

  // Open the reset link from the email
  const resetBody = await readLatestMessageTo(email);
  const resetUrl = extractFirstUrl(resetBody);
  await page.goto(resetUrl);

  await expect(
    page.getByRole("heading", { level: 1, name: "Set a new password" }),
  ).toBeVisible();

  // Set a new password
  await page.getByLabel("New password").fill(newPassword);
  await page.getByLabel("Confirm password").fill(newPassword);
  await page.getByRole("button", { name: "Reset password" }).click();

  // Redirected to login
  await expect(page).toHaveURL(/\/login$/);

  // Sign in with the new password
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(newPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
});

test("returns the same message for an unregistered address", async ({
  page,
}) => {
  await page.goto("/reset-password");
  await page.getByLabel("Email").fill("nonexistent@example.invalid");
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(
    page.getByText(
      "If that address is registered, a reset link is on its way.",
    ),
  ).toBeVisible();
});
```

**Note on the reset link URL:** Better Auth's `requestPasswordResetCallback` validates the token and redirects to `callbackURL + ?token=...`. The `redirectTo: "/reset-password"` parameter in the action controls where the callback redirects. The `extractFirstUrl` helper pulls the raw URL from the email body — that URL is the Better Auth callback endpoint (e.g. `http://localhost:3000/api/auth/reset-password/...`), which validates the token and redirects to `/reset-password?token=...`. Navigating to it in the browser follows the redirect chain automatically. If the URL in the email is already the `/reset-password?token=...` URL (no intermediate API call), that also works — `page.goto` handles either.

- [ ] **Step 2: Run build, lint, and all E2E tests**

Run: `npm run build && npm run lint && npm run test`
Expected: all pass, including `e2e/reset-password.spec.ts`, `e2e/login.spec.ts`, `e2e/registration.spec.ts`, and `e2e/auth-session.spec.ts`.

- [ ] **Step 3: Commit (coordinator only — defines scope)**

```bash
git add e2e/reset-password.spec.ts
git commit -m "test(auth): add E2E coverage of the password reset flow"
```
