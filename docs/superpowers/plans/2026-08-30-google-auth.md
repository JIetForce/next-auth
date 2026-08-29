# Google Authentication Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive `/login` page backed by real server-side Google OAuth through Auth.js v5, with safe behavior before the user supplies credentials.

**Architecture:** Keep the auth shell and page as Server Components under an `(auth)` route group. Centralize Auth.js in `src/auth.ts`, expose its App Router handler, call a fixed Google provider from a Server Action, and use one leaf Client Component only for submit pending state. Read sessions through server-side `auth()` rather than a global `SessionProvider`.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript strict mode, Auth.js `next-auth@5.0.0-beta.32`, Tailwind CSS v4, shadcn/base-nova, next-themes, Playwright `1.62.1`.

**Spec:** `docs/superpowers/specs/2026-08-30-google-auth-design.md`

## Global Constraints

- Canonical sign-in URL: `/login`.
- Successful sign-in destination: `/`.
- UI copy: English.
- Auth provider: Google only.
- Required runtime variables: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`; never commit their values or expose them through `NEXT_PUBLIC_*`.
- Use exact dependency versions `next-auth@5.0.0-beta.32` and `@playwright/test@1.62.1`.
- Do not add Credentials auth, a database, an adapter, a global `SessionProvider`, `useSession()`, or `proxy.ts`.
- Do not accept provider IDs, callback URLs, or redirect destinations from browser-controlled input.
- Keep pages/layouts server-side and place `'use client'` only on the pending submit button.
- Use existing semantic theme tokens; do not add raw colors or manual dark-mode color overrides.
- Do not add or remove source comments.
- Project-specific `AGENTS.md` overrides generic plan advice: the assigned `developer` must not dispatch workers and must not commit implementation changes; the coordinator needs a working-tree diff for the review loop.

---

### Task 1: Establish the application E2E harness and prove RED

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`
- Create: `e2e/login.spec.ts`

**Interfaces:**

- Consumes: existing `npm run dev`, `/`, `ModeToggle`, and Header.
- Produces: `npm test`; Playwright base URL `http://localhost:3000`; executable acceptance tests for `/login` and `/api/auth/providers`.

- [ ] **Step 1: Install exact runtime and test dependencies**

Run:

```bash
npm install --save-exact next-auth@5.0.0-beta.32
npm install --save-dev --save-exact @playwright/test@1.62.1
npx playwright install chromium
```

Expected: `package.json` and `package-lock.json` record the exact versions; Chromium is installed outside the repository.

- [ ] **Step 2: Add the application test script**

Set the scripts block to include:

```json
{
  "test": "playwright test"
}
```

Keep every existing script unchanged.

- [ ] **Step 3: Create the Playwright configuration**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
  },
});
```

- [ ] **Step 4: Write route, provider, theme, and responsive tests before production code**

Create `e2e/login.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const authConfigured = Boolean(
  process.env.AUTH_SECRET &&
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET,
);

test("renders the Google sign-in page with accessible metadata", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(page).toHaveTitle(/Sign in/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Welcome back" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("links the existing header to the canonical login route", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("shows a safe configuration state without auth environment variables", async ({
  page,
}) => {
  test.skip(authConfigured, "Auth environment is configured for this run");

  await page.goto("/login");

  await expect(
    page.getByRole("alert").getByText("Google sign-in is not configured"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeDisabled();
});

test("enables Google sign-in when auth environment variables exist", async ({
  page,
}) => {
  test.skip(!authConfigured, "Auth environment is not configured for this run");

  await page.goto("/login");

  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeEnabled();
});

test("exposes only the configured Google provider", async ({ request }) => {
  test.skip(!authConfigured, "Auth environment is not configured for this run");

  const response = await request.get("/api/auth/providers");
  const providers = await response.json();

  expect(response.ok()).toBe(true);
  expect(Object.keys(providers)).toEqual(["google"]);
  expect(providers.google).toMatchObject({
    id: "google",
    name: "Google",
    type: "oidc",
    signinUrl: "http://localhost:3000/api/auth/signin/google",
    callbackUrl: "http://localhost:3000/api/auth/callback/google",
  });
});

test("renders a generic OAuth error without exposing provider details", async ({
  page,
}) => {
  test.skip(!authConfigured, "Auth environment is not configured for this run");

  await page.goto("/login?error=OAuthCallback");

  await expect(page.getByRole("alert")).toContainText("Unable to sign in");
  await expect(page.getByRole("alert")).not.toContainText("OAuthCallback");
});

test("switches and persists light and dark themes", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("menuitem", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("menuitem", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
});

test("fits the login shell in a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/login");

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeInViewport();
});
```

- [ ] **Step 5: Run the unconfigured suite and verify the expected RED state**

Run:

```bash
npm test
```

Expected: FAIL because `/login` and its UI do not exist and Header still links to `/auth`. Confirm Playwright itself starts Next.js and launches Chromium successfully.

- [ ] **Step 6: Run the configured provider test and verify the expected RED state**

Run:

```bash
AUTH_SECRET=test-only-auth-secret-with-more-than-32-characters \
AUTH_GOOGLE_ID=test-google-client-id \
AUTH_GOOGLE_SECRET=test-google-client-secret \
npm test -- --grep "exposes only the configured Google provider"
```

Expected: FAIL because `/api/auth/providers` does not exist yet.

- [ ] **Step 7: Record the RED evidence without committing**

Capture the two expected failure reasons in the developer report. Do not commit; the coordinator will capture and review the final working-tree diff.

---

### Task 2: Add the server-only Auth.js boundary and Google provider route

**Files:**

- Create: `src/auth.ts`
- Create: `src/lib/auth/environment.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Test: `e2e/login.spec.ts`

**Interfaces:**

- Produces: `handlers`, `auth`, `signIn`, and `signOut` from `@/auth`; `isGoogleAuthConfigured(): boolean`; `GET` and `POST` auth handlers.
- Consumes: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` by name only.

- [ ] **Step 1: Add the centralized environment policy**

Create `src/lib/auth/environment.ts`:

```ts
import "server-only";

const googleAuthEnvironmentKeys = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
] as const;

export function isGoogleAuthConfigured() {
  return googleAuthEnvironmentKeys.every((key) =>
    Boolean(process.env[key]?.trim()),
  );
}
```

- [ ] **Step 2: Add the Auth.js configuration**

Create `src/auth.ts`:

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
```

- [ ] **Step 3: Add the App Router Route Handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Run the focused configured provider test**

Run:

```bash
AUTH_SECRET=test-only-auth-secret-with-more-than-32-characters \
AUTH_GOOGLE_ID=test-google-client-id \
AUTH_GOOGLE_SECRET=test-google-client-secret \
npm test -- --grep "exposes only the configured Google provider"
```

Expected: PASS with exactly one `google` provider and local Auth.js URLs. If Auth.js reports a different documented provider `type`, verify the installed API response and adjust only that assertion.

- [ ] **Step 5: Run lint for the new server boundary**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Record the GREEN checkpoint without committing**

Record the focused passing command in the developer report. Do not commit.

---

### Task 3: Build the server-first `/login` route and Google sign-in action

**Files:**

- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/login/actions.ts`
- Create: `src/app/(auth)/login/_components/google-sign-in-form.tsx`
- Create: `src/app/(auth)/login/_components/google-sign-in-button.tsx`
- Create through shadcn CLI: `src/components/ui/spinner.tsx`
- Test: `e2e/login.spec.ts`

**Interfaces:**

- Consumes: `auth()` and `signIn()` from `@/auth`; `isGoogleAuthConfigured()`; existing `ModeToggle`, `Alert`, `Button`, and `Card` components.
- Produces: `signInWithGoogle(): Promise<void>` Server Action; `/login`; configuration and generic OAuth UI states.

- [ ] **Step 1: Install the official shadcn spinner source**

Run:

```bash
npx shadcn@latest add spinner
```

Expected: only `src/components/ui/spinner.tsx` is added. Read the generated file and confirm it uses the project alias and Lucide icon library; do not overwrite unrelated components.

- [ ] **Step 2: Add the fixed-input Google Server Action**

Create `src/app/(auth)/login/actions.ts`:

```ts
"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { isGoogleAuthConfigured } from "@/lib/auth/environment";

export async function signInWithGoogle() {
  if (!isGoogleAuthConfigured()) {
    redirect("/login?error=configuration");
  }

  try {
    await signIn("google", { redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=oauth");
    }

    throw error;
  }
}
```

- [ ] **Step 3: Add the leaf pending button**

Create `src/app/(auth)/login/_components/google-sign-in-button.tsx`:

```tsx
"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function GoogleSignInButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={disabled || pending}
    >
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          Redirecting…
        </>
      ) : (
        "Continue with Google"
      )}
    </Button>
  );
}
```

- [ ] **Step 4: Add the server-rendered form**

Create `src/app/(auth)/login/_components/google-sign-in-form.tsx`:

```tsx
import { signInWithGoogle } from "../actions";
import { GoogleSignInButton } from "./google-sign-in-button";

export function GoogleSignInForm({ configured }: { configured: boolean }) {
  return (
    <form action={signInWithGoogle}>
      <GoogleSignInButton disabled={!configured} />
    </form>
  );
}
```

- [ ] **Step 5: Add the server auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-base font-medium"
          >
            <span className="size-6 rounded-md bg-primary" aria-hidden="true" />
            <span>Agent Roster</span>
          </Link>
          <ModeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Add the Server Component page and safe error normalization**

Create `src/app/(auth)/login/page.tsx`:

```tsx
import type { Metadata } from "next";
import { CircleAlert, Info } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
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
  const configured = isGoogleAuthConfigured();
  const { error } = await searchParams;
  const loginError = normalizeLoginError(error);

  if (configured) {
    const session = await auth();
    if (session?.user) redirect("/");
  }

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
```

- [ ] **Step 7: Run the unconfigured UI tests to reach GREEN**

Run:

```bash
npm test -- --grep "renders the Google sign-in page|safe configuration state|switches and persists|fits the login shell"
```

Expected: the page, configuration, theme, and mobile tests PASS. The Header-link test remains RED until Task 4.

- [ ] **Step 8: Run the configured UI and provider tests to reach GREEN**

Run:

```bash
AUTH_SECRET=test-only-auth-secret-with-more-than-32-characters \
AUTH_GOOGLE_ID=test-google-client-id \
AUTH_GOOGLE_SECRET=test-google-client-secret \
npm test -- --grep "renders the Google sign-in page|enables Google sign-in|exposes only|generic OAuth error|switches and persists|fits the login shell"
```

Expected: all selected tests PASS without contacting Google or exposing the test values in rendered HTML.

- [ ] **Step 9: Record the GREEN checkpoint without committing**

Record both passing commands and any intentional skipped tests in the developer report. Do not commit.

---

### Task 4: Align navigation and document credential setup

**Files:**

- Modify: `src/components/header.tsx:25-30`
- Modify: `README.md:38-56`
- Test: `e2e/login.spec.ts`

**Interfaces:**

- Consumes: canonical `/login` route and Auth.js environment names.
- Produces: working Header navigation and exact operator setup instructions.

- [ ] **Step 1: Change the existing Header route**

Replace only the sign-in entry:

```ts
{ href: "/login", label: "Sign in" },
```

Do not refactor the unrelated Header or change the remaining navigation entries.

- [ ] **Step 2: Run the focused navigation test**

Run:

```bash
npm test -- --grep "links the existing header"
```

Expected: PASS.

- [ ] **Step 3: Add exact Google OAuth setup instructions to README**

Append this section after the existing Notes section:

````markdown
## Google authentication

The `/login` page uses Auth.js v5 with Google OAuth. Add these values to the ignored `.env.local` file:

```env
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

Generate `AUTH_SECRET` with `npx auth secret`. In Google Cloud, register the callback URL for each environment:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://your-domain.example/api/auth/callback/google`

Restart the application after changing environment variables. Without all three values, `/login` remains available but disables Google sign-in.
````

- [ ] **Step 4: Verify no secret-like values entered the diff**

Run:

```bash
git diff -- README.md src/auth.ts src/lib/auth/environment.ts
```

Expected: only variable names, test-only documentation examples, and server configuration appear; no real token, client ID, client secret, or generated `.env.local` is tracked.

- [ ] **Step 5: Record the documentation checkpoint without committing**

Record the passing navigation test and secret review in the developer report. Do not commit.

---

### Task 5: Run full verification and inspect the browser result

**Files:**

- Verify all files changed by Tasks 1–4.

**Interfaces:**

- Consumes: completed implementation.
- Produces: verifier-ready evidence and a browser-previewable `/login` page in both configuration modes.

- [ ] **Step 1: Run the complete unconfigured application suite**

Run:

```bash
npm test
```

Expected: PASS; configured-only tests are reported skipped, and the safe configuration-state test passes.

- [ ] **Step 2: Run the complete configured application suite with non-secret test values**

Run:

```bash
AUTH_SECRET=test-only-auth-secret-with-more-than-32-characters \
AUTH_GOOGLE_ID=test-google-client-id \
AUTH_GOOGLE_SECRET=test-google-client-secret \
npm test
```

Expected: PASS; the unconfigured-only test is reported skipped, and configured provider/UI tests pass.

- [ ] **Step 3: Run lint and production build**

Run:

```bash
npm run lint
AUTH_SECRET=test-only-auth-secret-with-more-than-32-characters \
AUTH_GOOGLE_ID=test-google-client-id \
AUTH_GOOGLE_SECRET=test-google-client-secret \
npm run build
```

Expected: both commands PASS with no TypeScript, React Compiler, lint, or route-generation failures.

- [ ] **Step 4: Verify the repository agent contract remains healthy**

Run:

```bash
npm run test:agents
```

Expected: PASS.

- [ ] **Step 5: Check the final patch for formatting and scope**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; only the planned auth, test, package, Header, README, and shadcn spinner files are changed. No `.env*`, browser binary, build output, or secret is tracked.

- [ ] **Step 6: Preview both themes in a browser**

Start the configured development server with the same non-secret test environment values, open `/login`, and inspect desktop and 375px-wide mobile layouts. Verify light, dark, and system menu choices, focus visibility, configuration/error alert layout, and no horizontal overflow. Stop the server after inspection.

- [ ] **Step 7: Report the real-provider verification boundary**

State explicitly that Google consent, callback, JWT session creation, and authenticated `/login` redirect require the user's real credentials. Provide the three environment variable names and exact callback URL; do not claim that real Google login passed before the user performs that smoke test.

- [ ] **Step 8: Hand the working tree back to the coordinator without committing**

Return exactly the developer role sections required by `agents/roles/developer/role.md`, including changed files, test results, lint results, concerns, and an empty `### Blocked` when no obstacle remains.
