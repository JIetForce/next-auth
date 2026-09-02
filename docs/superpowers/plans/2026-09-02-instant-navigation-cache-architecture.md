# Instant Navigation and Caching Architecture — Implementation Plan

> **For agentic workers:** This repository runs the agent-roster contract
> (`AGENTS.md`), which supersedes `superpowers:subagent-driven-development` and
> `superpowers:executing-plans`. Execute **one contract loop run per task**:
> the coordinator opens `.roster/ledger.md` with the task's spec, dispatches
> `developer`, captures the uncommitted working tree as the review artifact,
> dispatches `verifier`, then `reviewer` (and `security-reviewer` where the
> task declares security-relevant paths), and only then commits. The `Commit`
> steps below are **not the developer's to run** — they define the `git add`
> scope the coordinator uses after all verdicts are in. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** Every route navigates instantly: static shells prerender at build,
session/cookies/searchParams reads stream behind `<Suspense>`, and no
`instant = false` opt-outs remain.

**Architecture:** Next.js 16.3.3 Cache Components. The session layer
(`src/lib/auth/session.ts`, `"use cache: private"`) is already canonical and
stays untouched. Five pages stop blocking at the page level; a DB-derived read
gets the tag-based `"use cache"` convention; `partialPrefetching` turns on
App Shell prefetching; `@next/playwright`'s `instant()` helper locks the
behavior into e2e regressions.

**Tech Stack:** Next.js 16.3.3 (cacheComponents, partialPrefetching), React 19
Suspense, Playwright + `@next/playwright@16.3.3`, Prisma, Better Auth.

**Spec:** `docs/superpowers/specs/2026-09-02-instant-navigation-cache-architecture-design.md`

## Global Constraints

- Next.js is `16.3.3`; patterns come only from
  `node_modules/next/dist/docs/` — this version diverges from older training
  data ("This is NOT the Next.js you know").
- The only new dependency is `@next/playwright` pinned to exactly `16.3.3`
  (devDependencies). No other dependency changes.
- Zero `export const instant = false` in `src/app` at plan completion.
- `src/lib/auth/session.ts` is not modified by any task.
- `npm run lint` reports 0 warnings; `npm run format:check` passes.
- Public routes (`/`, `/features`, `/pricing`, `/terms`, `/privacy`) remain
  `○` (static) in the `npm run build` route table.
- Untouched: anti-enumeration timing in `src/auth.ts`, `server-only` imports,
  the CSP/headers block in `next.config.ts`, logout re-validation behavior.
- The existing 50-test e2e suite stays green throughout.
- Verification suite per task (verifier): `npm run build`, `npx tsc --noEmit`,
  `npm run lint`, `npm run test:unit`, `npm run test:agents`,
  `npm run check:agents`, `npm run format:check`, plus the task's targeted
  Playwright specs. Full `npm test` is human-gated (Task 8).

---

### Task 1: instant() test infrastructure, partialPrefetching, failing tests

**Files:**

- Modify: `next.config.ts` (add one flag next to `cacheComponents: true`)
- Modify: `package.json` (devDependency via npm install, not hand-edited)
- Create: `e2e/instant-navigation.spec.ts`

**Interfaces:**

- Consumes: `addAuthenticatedSession(context)`, `E2E_VIEWER` from
  `e2e/helpers/auth-session.ts`; `teardownAuthTestInstance` from
  `e2e/helpers/auth-test-instance.ts`.
- Produces: `e2e/instant-navigation.spec.ts` — the red-to-green anchor every
  later task is judged against. Four tests: pricing-instant,
  profile-instant (client nav), profile-shell (initial load),
  login-instant (anonymous).

- [ ] **Step 1: Install the test helper**

```bash
npm install -D @next/playwright@16.3.3
```

Expected: package.json gains `"@next/playwright": "16.3.3"` in
devDependencies; no other dependency moves.

- [ ] **Step 2: Enable partial prefetching**

In `next.config.ts`, directly below `cacheComponents: true,` add:

```ts
  partialPrefetching: true,
```

The flag is top-level (not `experimental`); it requires `cacheComponents`,
which is already present. Do not touch the `headers()` block below it.

- [ ] **Step 3: Write the instant() spec**

Create `e2e/instant-navigation.spec.ts`:

```typescript
import { expect, test } from "@playwright/test";
import { instant } from "@next/playwright";

import { addAuthenticatedSession, E2E_VIEWER } from "./helpers/auth-session";
import { teardownAuthTestInstance } from "./helpers/auth-test-instance";

test.afterAll(async () => {
  await teardownAuthTestInstance();
});

test.describe("instant navigation", () => {
  test("client navigation to /pricing is instant", async ({ page }) => {
    await page.goto("/");

    await instant(page, async () => {
      await page.getByRole("link", { name: "Pricing" }).click();
      await page.waitForURL((url) => url.pathname === "/pricing");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Free,",
      );
    });

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "forever",
    );
  });

  test("client navigation to /profile is instant when authenticated", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto("/");

    await instant(page, async () => {
      await page
        .getByRole("button", {
          name: `Open account menu for ${E2E_VIEWER.name}`,
        })
        .click();
      await page.getByRole("menuitem", { name: "Profile" }).click();
      await page.waitForURL((url) => url.pathname === "/profile");
      await expect(
        page.getByRole("heading", { level: 1, name: "Profile" }),
      ).toBeVisible();
    });

    await expect(page.getByText(E2E_VIEWER.email)).toBeVisible();
  });

  test("initial /profile load shows the shell instantly", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);

    await instant(page, async () => {
      await page.goto("/profile");
      await expect(
        page.getByRole("heading", { level: 1, name: "Profile" }),
      ).toBeVisible();
    });

    await expect(page.getByText(E2E_VIEWER.email)).toBeVisible();
  });

  test("client navigation to /login is instant for an anonymous session", async ({
    page,
  }) => {
    await page.goto("/");

    await instant(page, async () => {
      await page.getByRole("link", { name: "Sign in" }).click();
      await page.waitForURL((url) => url.pathname === "/login");
      await expect(
        page.getByRole("heading", { level: 1, name: "Welcome back" }),
      ).toBeVisible();
    });

    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
```

- [ ] **Step 4: Run the spec and record the red state**

Run: `npx playwright test e2e/instant-navigation.spec.ts`
Expected: the two `/profile` tests and the `/login` test **FAIL** (those
routes carry `instant = false` and block on the server). The `/pricing` test
is expected to **PASS** (static route + partial prefetching). If `/pricing`
flakes, note it and judge it again after Task 3 — its end state is "passes".

- [ ] **Step 5: Commit** (coordinator, after verdicts)

```bash
git add package.json package-lock.json next.config.ts e2e/instant-navigation.spec.ts
git commit -m "test(e2e): add instant() navigation specs and enable partialPrefetching"
```

---

### Task 2: /profile streams behind Suspense

**Files:**

- Modify: `src/app/(main)/profile/page.tsx` (full restructure, code below)

**Interfaces:**

- Consumes: `requireCurrentViewer` from `@/lib/auth/session` (unchanged
  signature: `Promise<Viewer>`, redirects to `/login` when anonymous),
  `getLinkedAccountProviderLabels(viewer.id)` from `@/lib/auth/accounts`
  (unchanged signature in this task), `signOutAction`, `UserAvatar`, `Card*`,
  `Skeleton`.
- Produces: `ProfilePage` renders a static frame and one `<Suspense>` whose
  child `ProfileDetails` resolves the viewer. Task 7 changes what
  `getLinkedAccountProviderLabels` does internally — its call site here does
  not change again.

- [ ] **Step 1: Restructure the page**

Replace the body of `src/app/(main)/profile/page.tsx` below `metadata` with
(the imports gain `Suspense` from react and `Skeleton` from
`@/components/ui/skeleton`; the `CardFooter` import is dropped — nothing uses
it after the restructure; the `instant = false` export and its comment are
deleted):

```tsx
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
    <div className="flex flex-col gap-6" aria-hidden="true">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
```

Notes: the avatar, viewer fields, and sign-out form are one streamed unit per
the spec — an anonymous visitor never sees a "Sign out" button flash before
`requireCurrentViewer()` redirects. `CardFooter` disappears; the form carries
a `border-t` divider so the visual weight is preserved.

- [ ] **Step 2: Run the targeted specs**

Run: `npx playwright test e2e/instant-navigation.spec.ts e2e/auth-session.spec.ts`
Expected: both `/profile` instant tests now PASS; every
`auth-session.spec.ts` test stays green (fields, initials, logout, a11y).

- [ ] **Step 3: Commit** (coordinator, after verdicts)

```bash
git add src/app/(main)/profile/page.tsx
git commit -m "feat(profile): stream viewer details behind Suspense for instant navigation"
```

---

### Task 3: /login streams behind Suspense; shared auth skeletons

**Files:**

- Create: `src/app/(auth)/_components/auth-content-skeleton.tsx`
- Create: `src/app/(auth)/_components/auth-card-skeleton.tsx`
- Modify: `src/app/(auth)/loading.tsx` (body becomes `AuthCardSkeleton`)
- Modify: `src/app/(auth)/login/page.tsx` (full restructure, code below)

**Interfaces:**

- Consumes: `getCurrentViewer` (`Promise<Viewer | null>`), `redirect`,
  `isGoogleAuthConfigured`, `CredentialsForm`, `GoogleSignInForm`,
  `AuthCardShell`.
- Produces: `AuthContentSkeleton` (content-rows fallback — used by Tasks 4
  and 6) and `AuthCardSkeleton` (full-card fallback — used by Task 5), both
  exported from `(auth)/_components/`.

- [ ] **Step 1: Create the two skeleton components**

`src/app/(auth)/_components/auth-content-skeleton.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function AuthContentSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-3 w-32 self-end" />
      <Skeleton className="h-3 w-40 self-center" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-3 w-48 self-center" />
    </div>
  );
}
```

`src/app/(auth)/_components/auth-card-skeleton.tsx` — the exact JSX that
today is the body of `(auth)/loading.tsx`, moved verbatim into a component
(imports: `Card`, `CardContent`, `CardFooter`, `CardHeader` from
`@/components/ui/card`, `Skeleton` from `@/components/ui/skeleton`):

```tsx
export function AuthCardSkeleton() {
  return (
    <Card className="w-full max-w-md border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/20">
      <CardHeader className="flex flex-col gap-2 text-center sm:text-left">
        <Skeleton className="h-7 w-32" aria-hidden="true" />
        <Skeleton className="h-4 w-56" aria-hidden="true" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" aria-hidden="true" />
        <Skeleton className="h-10 w-full" aria-hidden="true" />
        <Skeleton className="h-10 w-full" aria-hidden="true" />
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-border/50 pt-4 text-center">
        <Skeleton className="h-3 w-48 mx-auto" aria-hidden="true" />
      </CardFooter>
    </Card>
  );
}
```

`src/app/(auth)/loading.tsx` becomes:

```tsx
import { AuthCardSkeleton } from "./_components/auth-card-skeleton";

export default function Loading() {
  return <AuthCardSkeleton />;
}
```

- [ ] **Step 2: Restructure the login page**

In `src/app/(auth)/login/page.tsx`: delete the `instant = false` export and
its comment; add `Suspense` (from react) and `AuthContentSkeleton` imports.
`normalizeLoginError`, `LoginPageProps`, and `LoginError` stay. The page and
a new `LoginContent` component:

```tsx
export default function LoginPage({ searchParams }: LoginPageProps) {
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
      <Suspense fallback={<AuthContentSkeleton />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AuthCardShell>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: LoginPageProps["searchParams"];
}) {
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
    <>
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
    </>
  );
}
```

- [ ] **Step 3: Run the targeted specs**

Run: `npx playwright test e2e/instant-navigation.spec.ts e2e/login.spec.ts`
Expected: all four instant tests PASS; every login.spec test stays green
(invalid-email client errors, theme persistence, mobile fit, a11y).

- [ ] **Step 4: Commit** (coordinator, after verdicts)

```bash
git add src/app/(auth)/_components/auth-content-skeleton.tsx src/app/(auth)/_components/auth-card-skeleton.tsx src/app/(auth)/loading.tsx src/app/(auth)/login/page.tsx
git commit -m "feat(login): stream session and searchParams reads behind Suspense"
```

---

### Task 4: /register streams behind Suspense

**Files:**

- Modify: `src/app/(auth)/register/page.tsx`

**Interfaces:**

- Consumes: `AuthContentSkeleton` from Task 3; `getCurrentViewer`,
  `isGoogleAuthConfigured`, `RegisterForm`, `GoogleSignInForm`,
  `AuthCardShell`, `Separator`.

- [ ] **Step 1: Restructure the page**

Delete the `instant = false` export and its comment; add `Suspense` and
`AuthContentSkeleton` imports. The page and content component:

```tsx
export default function RegisterPage() {
  return (
    <AuthCardShell
      badge={
        <>
          <Sparkles className="size-3 text-primary" aria-hidden="true" />
          <span>Get Started</span>
        </>
      }
      title="Create an account"
      description="Enter your details to create a new Siftloom account."
    >
      <Suspense fallback={<AuthContentSkeleton />}>
        <RegisterContent />
      </Suspense>
    </AuthCardShell>
  );
}

async function RegisterContent() {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  const configured = isGoogleAuthConfigured();

  return (
    <>
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
    </>
  );
}
```

- [ ] **Step 2: Run the targeted specs**

Run: `npx playwright test e2e/instant-navigation.spec.ts e2e/registration.spec.ts`
Expected: instant spec stays green (4/4); registration flows — register,
confirm by email, refuse unconfirmed sign-in, duplicate-address reply — all
green.

- [ ] **Step 3: Commit** (coordinator, after verdicts)

```bash
git add src/app/(auth)/register/page.tsx
git commit -m "feat(register): stream session read behind Suspense for instant navigation"
```

---

### Task 5: /reset-password streams its whole shell behind Suspense

**Files:**

- Modify: `src/app/(auth)/reset-password/page.tsx`

**Interfaces:**

- Consumes: `AuthCardSkeleton` from Task 3 (this page's two branches render
  different `AuthCardShell` titles, so the whole shell — not just the content
  — streams); `getCurrentViewer`, `ResetPasswordForm`, `ForgotPasswordForm`.

- [ ] **Step 1: Restructure the page**

Delete the `instant = false` export and its comment; add `Suspense` and
`AuthCardSkeleton` imports:

```tsx
export default function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetPasswordContent({
  searchParams,
}: {
  searchParams: ResetPasswordPageProps["searchParams"];
}) {
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

- [ ] **Step 2: Run the targeted specs**

Run: `npx playwright test e2e/instant-navigation.spec.ts e2e/reset-password.spec.ts`
Expected: instant spec stays green; the request-reset → open-link →
set-password → sign-in flow and the unregistered-address reply stay green.

- [ ] **Step 3: Commit** (coordinator, after verdicts)

```bash
git add src/app/(auth)/reset-password/page.tsx
git commit -m "feat(reset-password): stream token branch and session read behind Suspense"
```

---

### Task 6: /verify-email streams behind Suspense

**Files:**

- Modify: `src/app/(auth)/verify-email/page.tsx`

**Interfaces:**

- Consumes: `AuthContentSkeleton` from Task 3; `getCurrentViewer`,
  `cookies` from `next/headers`, `ResendForm`.

- [ ] **Step 1: Restructure the page**

Delete the `instant = false` export and its comment; add `Suspense` and
`AuthContentSkeleton` imports:

```tsx
export default function VerifyEmailPage() {
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
      <Suspense fallback={<AuthContentSkeleton />}>
        <VerifyEmailContent />
      </Suspense>
    </AuthCardShell>
  );
}

async function VerifyEmailContent() {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  const cookieStore = await cookies();
  const initialEmail = cookieStore.get("pending_verification_email")?.value;

  return (
    <>
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

      <ResendForm defaultEmail={initialEmail} />

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
    </>
  );
}
```

- [ ] **Step 2: Run the targeted specs**

Run: `npx playwright test e2e/instant-navigation.spec.ts e2e/registration.spec.ts`
Expected: instant spec green; the pending-address prefill behavior (cookie
read inside the boundary) stays green.

- [ ] **Step 3: Commit** (coordinator, after verdicts)

```bash
git add src/app/(auth)/verify-email/page.tsx
git commit -m "feat(verify-email): stream session and pending-address cookie behind Suspense"
```

---

### Task 7: Tag-based caching for linked-account labels (DAL seed)

**Files:**

- Modify: `src/lib/auth/accounts.ts`

**Interfaces:**

- Consumes: `prisma` from `@/lib/db` (unchanged).
- Produces: `getLinkedAccountProviderLabels(userId: string):
Promise<readonly string[]>` — signature unchanged, call sites unchanged.
  New convention for future data functions: unexported `"use cache"` inner
  function keyed on `userId`, `cacheTag(\`entity:${userId}\`)`, `cacheLife`preset,`updateTag` from the mutating Server Action when mutation flows
  exist (none today).

- [ ] **Step 1: Split the read into a cached inner function**

In `src/lib/auth/accounts.ts` add `import { cacheLife, cacheTag } from "next/cache";`
and restructure:

```ts
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
```

`displayNameForProviderId` stays as is. The inner function stays unexported —
a caller must never pass an arbitrary id; the exported wrapper is the only
door. Cache keys and tags are plain text: `userId` is a stable identifier,
never a secret.

- [ ] **Step 2: Verify through build and the profile path**

There is no unit test for this module (it thin-wraps Prisma; a mocked
`next/cache` would test the mock). The behavior is covered end to end:
Run: `npx playwright test e2e/auth-session.spec.ts` and `npm run build`
Expected: "renders only allowlisted viewer fields" stays green (providers
render through the cached path); build succeeds.

- [ ] **Step 3: Commit** (coordinator, after verdicts)

```bash
git add src/lib/auth/accounts.ts
git commit -m "perf(auth): cache linked-account provider labels with use cache and cacheTag"
```

---

### Task 8: Full verification sweep and route-table check

**Files:**

- Create: none (verification only; the route table paste goes into the ledger)

**Interfaces:**

- Consumes: everything above.
- Produces: the delivery evidence for the whole plan.

- [ ] **Step 1: Zero opt-outs check**

Run: `grep -rn "instant = false" src/`
Expected: no matches.

- [ ] **Step 2: Build and route table**

Run: `npm run build`
Expected: succeeds; `/`, `/features`, `/pricing`, `/terms`, `/privacy`
marked `○` (static); the five restructured routes render shells with
streaming holes rather than blocking. Paste the route table into
`.roster/ledger.md`.

- [ ] **Step 3: Static suites**

Run: `npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:agents && npm run check:agents && npm run format:check`
Expected: all green; lint with 0 warnings.

- [ ] **Step 4: Full e2e (human-gated)**

Run: `npm test` (the human runs this; report un-run if not)
Expected: 50 existing tests + 4 new instant tests pass.

- [ ] **Step 5: Coordinator final commit** (after all verdicts)

Any straggler files (e.g. `package-lock.json` adjustments) join the task
commits above; this step is the empty-scope check that the working tree is
clean before the ledger is archived.
