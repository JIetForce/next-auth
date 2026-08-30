# Authenticated Profile Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable server-first session foundation with a session-aware Header, protected `/profile`, fixed logout/redirect behavior, synthetic authenticated E2E coverage, and canonical architecture documentation.

**Architecture:** Move ordinary pages under a shared `(main)` layout while keeping the root and `(auth)` layouts separate. Centralize session reads in a request-scoped server-only DAL that emits a minimal Viewer DTO. Stream only the Header account slot behind Suspense; keep mobile navigation and menus as small Client islands. Protect `/profile` and logout independently through the DAL.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8 Server Components and `cache`, Auth.js `next-auth@5.0.0-beta.32` JWT sessions, TypeScript strict mode, Tailwind CSS v4, shadcn/base-nova, Base UI, next-themes, Playwright 1.62.1.

**Spec:** `docs/superpowers/specs/2026-08-30-auth-profile-foundation-design.md`

## Global Constraints

- Fixed URLs: login `/login`, profile `/profile`, successful login `/`, authenticated login `/`, anonymous profile `/login`, logout `/`.
- Google remains the only provider; no database, adapter, Credentials provider, roles, or editable profile.
- Existing-session reads depend only on non-empty `AUTH_SECRET`; starting Google login depends on all three auth variables.
- Viewer DTO contains only nullable `name`, `email`, and `image`; never pass a raw Session to Client Components.
- No global `SessionProvider`, `useSession()`, `proxy.ts`, client-controlled provider, callback URL, or redirect destination.
- Root layout remains synchronous. Session access is isolated to a nested Server Component under Suspense and page/action DAL calls.
- `/profile` must enforce its own server-side guard; Header visibility is not authorization.
- Logout is a zero-input POST Server Action and calls `signOut({ redirectTo: "/" })`.
- Synthetic authenticated state exists only under `e2e/**`; no production test provider, route, condition, saved storage state, or real credential.
- Preserve semantic theme classes, Base UI `render` composition, mandatory Avatar fallback, and mobile keyboard behavior.
- Create `docs/auth-architecture.md`, link it from README, and do not modify `AGENTS.md`.
- Remove the obsolete SessionProvider future comment only because the user explicitly approved that cleanup.
- The disclosed Google client secret must be rotated before final real-provider verification; never read or output `.env.local` values.
- Do not add or remove any other source comments.
- Do not change existing `/features`, `/pricing`, Auth.js provider configuration, auth Route Handler, auth layout, or `allowedDevOrigins` behavior.
- Keep exact pinned package versions and add no third-party runtime or test dependency.
- Approved baseline: lint has exactly two existing agent-roster warnings; `npm run test:agents` has exactly one existing duplicate-skill-discovery failure (16 pass / 1 fail). No additional warning/failure is accepted.
- Project `AGENTS.md` overrides the generic plan header: the assigned developer must not dispatch workers or commit/stage implementation; the coordinator needs the working-tree diff.

---

### Task 1: Add the synthetic-session contract and failing behavior matrix

**Files:**

- Modify: `playwright.config.ts`
- Create: `e2e/helpers/auth-session.ts`
- Create: `e2e/auth-session.spec.ts`

**Interfaces:**

- Consumes: pinned `next-auth/jwt` `encode()`, current `/api/auth/session`, Playwright BrowserContext, shared test `AUTH_SECRET`.
- Produces: `E2E_VIEWER`, `addAuthenticatedSession(context)`, `addTamperedSession(context)`, fixture contract, and RED acceptance tests for Header/Profile/Logout.

- [ ] **Step 1: Route Playwright artifacts into ignored build output**

Add this top-level property to `playwright.config.ts`:

```ts
outputDir: ".next/playwright",
```

Keep the existing explicit auth environment handoff, localhost base URL, Chromium project, fresh `npm run dev` web server, and `reuseExistingServer: false`.

- [ ] **Step 2: Create a test-only Auth.js JWT helper**

Create `e2e/helpers/auth-session.ts`:

```ts
import type { BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

const sessionCookieName = "authjs.session-token";

export const E2E_VIEWER = {
  name: "E2E User",
  email: "e2e-user@example.invalid",
  image: null,
} as const;

function getTestSecret() {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("AUTH_SECRET is required for authenticated E2E tests");
  }

  return secret;
}

export async function addAuthenticatedSession(context: BrowserContext) {
  const value = await encode({
    salt: sessionCookieName,
    secret: getTestSecret(),
    maxAge: 5 * 60,
    token: {
      sub: "private-e2e-subject",
      name: E2E_VIEWER.name,
      email: E2E_VIEWER.email,
      picture: E2E_VIEWER.image,
    },
  });

  await context.addCookies([
    {
      name: sessionCookieName,
      value,
      url: "http://localhost:3000",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

export async function addTamperedSession(context: BrowserContext) {
  await context.addCookies([
    {
      name: sessionCookieName,
      value: "tampered-session",
      url: "http://localhost:3000",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
```

The helper stays under `e2e/**`, never logs the secret/token, and never writes storage state.

- [ ] **Step 3: Write the fixture contract and complete desired behavior before production changes**

Create `e2e/auth-session.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

import {
  addAuthenticatedSession,
  addTamperedSession,
  E2E_VIEWER,
} from "./helpers/auth-session";

const authConfigured = Boolean(process.env.AUTH_SECRET?.trim());

async function openAccountMenu(page: import("@playwright/test").Page) {
  await page
    .getByRole("button", { name: `Open account menu for ${E2E_VIEWER.name}` })
    .click();
}

test("redirects an anonymous profile request to the fixed login route", async ({
  request,
}) => {
  const response = await request.get(
    "/profile?callbackUrl=https://attacker.example&redirectTo=//attacker.example",
    { maxRedirects: 0 },
  );

  expect([303, 307]).toContain(response.status());
  const location = new URL(
    response.headers().location!,
    "http://localhost:3000",
  );
  expect(location.origin).toBe("http://localhost:3000");
  expect(location.pathname).toBe("/login");
  expect(await response.text()).not.toContain("E2E User");
});

test.describe("authenticated session", () => {
  test.skip(!authConfigured, "AUTH_SECRET is required for synthetic sessions");

  test("recognizes the test-only Auth.js JWT fixture", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);

    const response = await page.request.get("/api/auth/session");
    const session = await response.json();

    expect(response.ok()).toBe(true);
    expect(session.user).toMatchObject(E2E_VIEWER);
  });

  test("renders account navigation instead of Sign in on desktop", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    const response = await page.request.get("/");
    const html = await response.text();

    expect(html).toContain(E2E_VIEWER.name);
    expect(html).not.toContain(">Sign in<");

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
    await openAccountMenu(page);
    await expect(page.getByText(E2E_VIEWER.email)).toBeVisible();
    await expect(page.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "href",
      "/profile",
    );
    await expect(page.getByRole("menuitem", { name: "Log out" })).toBeVisible();
  });

  test("renders account navigation on a mobile viewport", async ({
    context,
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await addAuthenticatedSession(context);
    await page.goto("/");

    await openAccountMenu(page);
    await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Log out" })).toBeVisible();
  });

  test("renders only allowlisted viewer fields on the profile page", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto("/profile");

    await expect(
      page.getByRole("heading", { level: 1, name: "Profile" }),
    ).toBeVisible();
    await expect(page.getByText(E2E_VIEWER.name)).toBeVisible();
    await expect(page.getByText(E2E_VIEWER.email)).toBeVisible();
    await expect(page.getByText("Google", { exact: true })).toBeVisible();
    await expect(page.getByText("EU", { exact: true })).toHaveCount(2);
    await expect(page.locator("body")).not.toContainText("private-e2e-subject");
  });

  test("redirects an authenticated login request to home", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto(
      "/login?callbackUrl=https://attacker.example&redirectTo=//attacker.example",
    );

    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("logs out locally and protects profile again", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto("/profile");

    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    const response = await page.request.get("/api/auth/session");
    expect(await response.json()).toBeNull();

    await page.goto("/profile");
    await expect(page).toHaveURL("http://localhost:3000/login");
  });

  test("fails closed for a tampered Auth.js cookie", async ({
    context,
    page,
  }) => {
    await addTamperedSession(context);
    await page.goto("/profile");

    await expect(page).toHaveURL("http://localhost:3000/login");
    await expect(page.locator("body")).not.toContainText(E2E_VIEWER.email);
  });
});
```

If Auth.js returns an empty object rather than JSON `null` after logout in this pinned beta, first inspect the documented endpoint response and assert the exact anonymous contract instead of weakening the test.

- [ ] **Step 4: Run the fixture contract before implementation**

Run with an ephemeral secret shared by the runner and child server:

```bash
AUTH_URL=http://localhost:3000 \
AUTH_SECRET="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))')" \
AUTH_GOOGLE_ID=e2e-not-a-google-client \
AUTH_GOOGLE_SECRET=e2e-not-a-google-secret \
npm test -- --grep "recognizes the test-only Auth.js JWT fixture"
```

Expected: PASS. This proves the pinned Auth.js cookie seam before feature behavior is interpreted.

- [ ] **Step 5: Run the new behavior matrix and verify RED**

Run the same ephemeral environment against `e2e/auth-session.spec.ts`:

```bash
AUTH_URL=http://localhost:3000 \
AUTH_SECRET="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))')" \
AUTH_GOOGLE_ID=e2e-not-a-google-client \
AUTH_GOOGLE_SECRET=e2e-not-a-google-secret \
npm test -- e2e/auth-session.spec.ts
```

Expected: fixture contract passes, while `/profile` is 404, authenticated Header still exposes Sign in, Profile UI is absent, and Logout is absent. Record each expected product failure; fix test setup errors before proceeding.

- [ ] **Step 6: Record RED evidence without committing**

Return exact failing test names and reasons in the developer report. Do not commit or stage.

---

### Task 2: Implement the session DAL, environment split, login guard, and logout action

**Files:**

- Modify: `src/lib/auth/environment.ts`
- Create: `src/lib/auth/types.ts`
- Create: `src/lib/auth/session.ts`
- Create: `src/lib/auth/actions.ts`
- Modify: `src/app/(auth)/login/page.tsx`
- Test: `e2e/auth-session.spec.ts`

**Interfaces:**

- Produces: `Viewer`, `isAuthSessionConfigured()`, `getCurrentViewer()`, `requireCurrentViewer()`, `signOutAction()`.
- Consumes: server `auth` and `signOut` exports, `AUTH_SECRET`, fixed `/login` and `/` destinations.

- [ ] **Step 1: Separate session readiness from provider readiness**

Replace `src/lib/auth/environment.ts` with:

```ts
import "server-only";

const googleProviderEnvironmentKeys = [
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
] as const;

export function isAuthSessionConfigured() {
  return Boolean(process.env.AUTH_SECRET?.trim());
}

export function isGoogleAuthConfigured() {
  return (
    isAuthSessionConfigured() &&
    googleProviderEnvironmentKeys.every((key) =>
      Boolean(process.env[key]?.trim()),
    )
  );
}
```

- [ ] **Step 2: Define the public Viewer DTO**

Create `src/lib/auth/types.ts`:

```ts
export type Viewer = Readonly<{
  name: string | null;
  email: string | null;
  image: string | null;
}>;
```

- [ ] **Step 3: Add the request-scoped server DAL**

Create `src/lib/auth/session.ts`:

```ts
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
```

- [ ] **Step 4: Add the checked fixed-destination logout action**

Create `src/lib/auth/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { getCurrentViewer } from "@/lib/auth/session";

export async function signOutAction() {
  const viewer = await getCurrentViewer();
  if (!viewer) redirect("/");

  await signOut({ redirectTo: "/" });
}
```

- [ ] **Step 5: Make login session-aware independently of Google credentials**

In `src/app/(auth)/login/page.tsx`:

- remove the direct `auth` import;
- import `getCurrentViewer`;
- call it before computing Google form availability;
- redirect a Viewer to `/`;
- keep `isGoogleAuthConfigured()` solely for form/configuration UI.

The resulting opening is:

```ts
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  const configured = isGoogleAuthConfigured();
  const { error } = await searchParams;
  const loginError = normalizeLoginError(error);
```

- [ ] **Step 6: Run the fixture and authenticated-login focused tests**

Run:

```bash
AUTH_URL=http://localhost:3000 \
AUTH_SECRET="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))')" \
AUTH_GOOGLE_ID=e2e-not-a-google-client \
AUTH_GOOGLE_SECRET=e2e-not-a-google-secret \
npm test -- --grep "recognizes the test-only|redirects an authenticated login"
```

Expected: both PASS. Header/profile/logout tests remain RED until their UI/routes exist.

- [ ] **Step 7: Run lint and record the checkpoint**

Run `npm run lint`; expected 0 errors and only the two approved warnings. Do not commit or stage.

---

### Task 3: Create the shared main shell and streamed account Header

**Files:**

- Create: `src/app/(main)/layout.tsx`
- Move: `src/app/page.tsx` → `src/app/(main)/page.tsx`
- Modify: `src/components/header.tsx`
- Create: `src/components/header-account.tsx`
- Create: `src/components/mobile-navigation.tsx`
- Create: `src/components/user-avatar.tsx`
- Create: `src/components/user-menu.tsx`
- Create through shadcn CLI: `src/components/ui/skeleton.tsx`
- Test: `e2e/auth-session.spec.ts`

**Interfaces:**

- Consumes: `getCurrentViewer()`, `Viewer`, `signOutAction()`, public navigation links, existing ModeToggle/Avatar/DropdownMenu/Sheet/Button.
- Produces: shared `(main)` shell, server Header, streamed account state, accessible mobile navigation, reusable avatar/menu.

- [ ] **Step 1: Add the official Skeleton primitive**

Run:

```bash
npx shadcn@latest add skeleton
```

Expected: only `src/components/ui/skeleton.tsx` is added. Read the generated file and confirm project aliases/style; do not overwrite other components.

- [ ] **Step 2: Move the home route into `(main)`**

Create the `(main)` directory and move `src/app/page.tsx` to `src/app/(main)/page.tsx`. Remove only the Header import, outer shell, and Header render so the file returns its existing `<main>` content:

```tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md border border-border">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            This is a minimal shell to verify the shadcn/ui setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Try the theme toggle in the header to switch between light, dark,
            and system modes.
          </p>
          <Button className="w-full sm:w-auto">Get started</Button>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Semantic colors: bg-background, text-foreground, border-border.
        </CardFooter>
      </Card>
    </main>
  );
}
```

- [ ] **Step 3: Add the shared main layout**

Create `src/app/(main)/layout.tsx`:

```tsx
import type { ReactNode } from "react";

import { Header } from "@/components/header";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <Header />
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Add controlled mobile navigation**

Create `src/components/mobile-navigation.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type NavigationLink = Readonly<{
  href: string;
  label: string;
}>;

export function MobileNavigation({
  links,
}: {
  links: readonly NavigationLink[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <Menu aria-hidden="true" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        }
      />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Browse the application sections.</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-2 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex h-9 items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 5: Add reusable Viewer Avatar and initials**

Create `src/components/user-avatar.tsx` with a pure `getViewerInitials(viewer)` helper and `UserAvatar` component. Implement the exact name/email/`U` algorithm from the spec. Render:

```tsx
<Avatar size={size} aria-hidden="true">
  {viewer.image ? (
    <AvatarImage src={viewer.image} alt="" referrerPolicy="no-referrer" />
  ) : null}
  <AvatarFallback>{getViewerInitials(viewer)}</AvatarFallback>
</Avatar>
```

Export `getViewerInitials` so the E2E-visible fallback contract and future focused tests have one named rule. Do not add `next/image` or remote patterns.

- [ ] **Step 6: Add the client Avatar dropdown**

Create `src/components/user-menu.tsx`. It must:

- begin with `"use client"`;
- receive only `{ viewer: Viewer }`;
- use `DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}`;
- set trigger label `Open account menu for ${displayName}`;
- include `UserAvatar`;
- render name/email inside `DropdownMenuLabel`;
- render Profile with `DropdownMenuItem render={<Link href="/profile" />}>` inside a group;
- render a separator;
- wrap the logout group in `<form action={signOutAction}>`;
- render the logout item as a native submit button:

```tsx
<DropdownMenuItem
  nativeButton
  disabled={pending}
  render={<button type="submit" />}
  className="w-full"
>
  {pending ? <Spinner data-icon="inline-start" /> : <LogOut />}
  {pending ? "Signing out…" : "Log out"}
</DropdownMenuItem>
```

Place `useFormStatus()` in a small inner component rendered inside the form. Every item remains inside `DropdownMenuGroup`; no button contains another button and no menu item contains a nested link.

- [ ] **Step 7: Add the async account Server Component**

Create `src/components/header-account.tsx`:

```tsx
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { getCurrentViewer } from "@/lib/auth/session";

export async function HeaderAccount() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return (
      <Link
        href="/login"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Sign in
      </Link>
    );
  }

  return <UserMenu viewer={viewer} />;
}
```

- [ ] **Step 8: Convert Header into the synchronous Server shell**

Modify `src/components/header.tsx`:

- remove `"use client"`;
- remove Sheet/Menu imports and inline mobile Sheet;
- import `Suspense`, `HeaderAccount`, `MobileNavigation`, and `Skeleton`;
- keep only `Home`, `Features`, and `Pricing` in `primaryLinks`;
- preserve brand, sticky header classes, desktop NavigationMenu, ModeToggle, and component props;
- render actions in this order:

```tsx
<div className="flex items-center gap-2">
  <ModeToggle />
  <Suspense fallback={<Skeleton className="h-8 w-20" aria-hidden="true" />}>
    <HeaderAccount />
  </Suspense>
  <div className="md:hidden">
    <MobileNavigation links={primaryLinks} />
  </div>
</div>
```

- [ ] **Step 9: Run Header-focused RED/GREEN tests**

Before adding Tasks 3 production files, the authenticated Header tests from Task 1 must have been RED. After implementation, run the fixture, desktop, and mobile Header tests with an ephemeral configured environment. Expected: PASS; initial response contains Viewer name and omits Sign in, dropdown semantics pass, and `/` URL is unchanged.

- [ ] **Step 10: Run full tests and lint checkpoint**

Run full configured and unconfigured suites. Expected: Header tests green; Profile/Logout tests may remain RED until Task 4. Run lint; do not commit/stage.

---

### Task 4: Add protected Profile and complete logout behavior

**Files:**

- Create: `src/app/(main)/profile/page.tsx`
- Create: `src/components/sign-out-button.tsx`
- Modify: `src/components/providers.tsx:8`
- Test: `e2e/auth-session.spec.ts`

**Interfaces:**

- Consumes: `requireCurrentViewer()`, `signOutAction()`, Viewer DTO, UserAvatar, Card/Button/Spinner.
- Produces: protected `/profile`, profile logout form, complete redirect/logout matrix.

- [ ] **Step 1: Add a pending profile logout button**

Create `src/components/sign-out-button.tsx`:

```tsx
"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={pending}
    >
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {pending ? "Signing out…" : "Log out"}
    </Button>
  );
}
```

- [ ] **Step 2: Add the protected Profile Server Page**

Create `src/app/(main)/profile/page.tsx` with static metadata title `Profile | Agent Roster`, description, and `robots: { index: false, follow: false }`.

Use this data/structure:

```tsx
const viewer = await requireCurrentViewer();
const displayName = viewer.name ?? "Not provided";
const displayEmail = viewer.email ?? "Not provided";

return (
  <main className="flex flex-1 items-center justify-center bg-muted/30 p-4 sm:p-6">
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-4">
          <UserAvatar viewer={viewer} size="lg" />
          <div className="min-w-0">
            <CardTitle>
              <h1>Profile</h1>
            </CardTitle>
            <CardDescription>
              Your authenticated account details.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm text-muted-foreground">Name</dt>
            <dd className="text-right text-sm font-medium">{displayName}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="min-w-0 truncate text-right text-sm font-medium">
              {displayEmail}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm text-muted-foreground">Provider</dt>
            <dd className="text-right text-sm font-medium">Google</dd>
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
```

Use the exact imports from the established aliases and existing UI primitives. Do not expose any other Session field.

- [ ] **Step 3: Remove the obsolete Provider comment**

Delete only the explicitly approved line claiming SessionProvider should be added when authentication arrives. Do not otherwise reformat `src/components/providers.tsx`.

- [ ] **Step 4: Run profile/logout tests to GREEN**

Run configured `e2e/auth-session.spec.ts`. Expected: all fixture, Header, Profile, login redirect, logout, tampered-cookie, and fixed-destination tests PASS.

- [ ] **Step 5: Run the unconfigured suite**

Run with all auth variables explicitly unset. Expected: anonymous `/` remains 200, Header shows Sign in, `/profile` redirects to `/login`, login configuration UI works, and no session test is accidentally executed.

- [ ] **Step 6: Run lint and build checkpoint**

Run lint and a configured production build. Expected: 0 new errors/warnings and dynamic `/profile`, `/login`, and auth handler routes. Do not commit/stage.

---

### Task 5: Establish canonical auth documentation and run final verification

**Files:**

- Create: `docs/auth-architecture.md`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-30-google-auth-design.md`
- Verify: all Task 1–4 files

**Interfaces:**

- Consumes: final implemented routes, DAL, Header islands, action, and tests.
- Produces: canonical future-agent reference and verifier-ready evidence.

- [ ] **Step 1: Create the canonical auth architecture document**

Create `docs/auth-architecture.md` with these concrete sections and statements:

```markdown
# Authentication Architecture

## Canonical status

This file is the source of truth for application authentication. Update it together with auth behavior and E2E tests. The implementation is pinned to Next.js 16.3.3 and next-auth 5.0.0-beta.32.

## Invariants

- Google OAuth only; JWT cookie sessions; no database adapter.
- Server Components and server auth() are the source of truth.
- No global SessionProvider/useSession.
- Client Components receive only Viewer `{ name, email, image }`.
- Every protected page/action/data boundary checks the Viewer itself.
- Provider and redirect destinations are server-owned constants.

## Routes and redirects

| State/action             | Result                      |
| ------------------------ | --------------------------- |
| Anonymous `/`            | Sign in in Header           |
| Authenticated `/`        | Avatar account menu         |
| Anonymous `/profile`     | `/login`                    |
| Authenticated `/profile` | Safe profile fields         |
| Authenticated `/login`   | `/`                         |
| Successful Google login  | `/`                         |
| Logout                   | local JWT cleared, then `/` |

## File ownership

Document `(main)` versus `(auth)`, root layout responsibilities, `src/auth.ts`, `src/lib/auth/environment.ts`, `types.ts`, `session.ts`, `actions.ts`, Header account slot/client islands, `/profile`, and auth Route Handler.

## Session and authorization boundary

Document `isAuthSessionConfigured`, `isGoogleAuthConfigured`, request-scoped React cache, explicit Viewer mapping, `getCurrentViewer`, `requireCurrentViewer`, and the rule that layouts/Header are not authorization boundaries.

## Header and profile boundaries

Document the synchronous Header shell, Suspense account slot, client-only Sheet/Dropdown/theme controls, Avatar fallback, safe profile fields, and fixed POST logout.

## Testing seam

Document that `e2e/helpers/auth-session.ts` creates a local five-minute Auth.js JWE only for pinned-version tests, uses ephemeral non-production values, persists nothing, adds no production route/provider, and must be revalidated before upgrading Auth.js.

## Prohibited patterns

List raw Session client props, SessionProvider without a new approved requirement, GET logout, browser callback URLs, test auth routes/providers, stored storageState, real credentials in tests, Proxy as sole authorization, and spreading session.user.

## Real Google smoke

List rotated Google client secret, exact callback URI, consent/callback, redirect `/`, Header profile state, `/profile`, logout, session removal, HTTPS cookie behavior, and restart persistence. State that synthetic E2E does not prove Google OIDC interoperability.
```

Expand each file-ownership bullet with the exact current path. Do not include any secret value or application architecture in `AGENTS.md`.

- [ ] **Step 2: Link README to the canonical document**

Add immediately after the Google authentication setup section:

```markdown
Application auth architecture, extension rules, redirect contracts, and test strategy are documented in [`docs/auth-architecture.md`](docs/auth-architecture.md). Read it before changing authentication, session handling, protected routes, Header account state, or logout.
```

- [ ] **Step 3: Mark the old Google login design as historical**

Add a short Status note near the top of `docs/superpowers/specs/2026-08-30-google-auth-design.md` stating that `docs/auth-architecture.md` is canonical after the authenticated profile foundation, while this document remains the original login decision record.

- [ ] **Step 4: Verify documentation consistency and secret safety**

Use a Node assertion to confirm:

- all documented destinations match the fixed route matrix;
- README links to the canonical document;
- canonical doc names no SessionProvider/Proxy/test-provider usage as required architecture;
- no real `AUTH_*` credential, JWT, cookie value, Google client value, or real email appears in tracked docs; only the documented allowlisted `e2e-not-*` and `build-not-*` test sentinels may be assigned;
- `AGENTS.md` is unchanged.

- [ ] **Step 5: Run complete unconfigured E2E**

Run:

```bash
env -u AUTH_URL -u AUTH_SECRET -u AUTH_GOOGLE_ID -u AUTH_GOOGLE_SECRET npm test
```

Expected: all anonymous, login/theme/LAN, and profile-denial tests PASS; configured-only tests SKIP intentionally.

- [ ] **Step 6: Run complete configured synthetic-session E2E**

Run:

```bash
AUTH_URL=http://localhost:3000 \
AUTH_SECRET="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("base64url"))')" \
AUTH_GOOGLE_ID=e2e-not-a-google-client \
AUTH_GOOGLE_SECRET=e2e-not-a-google-secret \
npm test
```

Expected: all authenticated tests PASS; only the unconfigured configuration-alert test skips. The command and output must not print the random secret.

- [ ] **Step 7: Run lint, build, and agent baseline**

Run:

```bash
npm run lint
AUTH_URL=http://localhost:3000 \
AUTH_SECRET=build-only-non-secret-value \
AUTH_GOOGLE_ID=build-not-a-google-client \
AUTH_GOOGLE_SECRET=build-not-a-google-secret \
npm run build
npm run test:agents
```

Expected: lint/build PASS; agent tests remain exactly 16 pass / 1 approved duplicate-skill-discovery failure.

- [ ] **Step 8: Inspect the browser and final patch**

Run a configured synthetic dev server and inspect desktop/mobile light/dark UI: anonymous Sign in, authenticated Avatar menu, Profile card, mobile Sheet close, and logout transition. Then run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no test artifacts or secret files; only planned application/test/documentation files differ. `test-results/` must not exist because output is under ignored `.next/playwright`.

- [ ] **Step 9: Report the real-provider boundary and secret rotation blocker**

Do not claim Google callback/session mapping passed until the user resets the exposed Google client secret, updates ignored `.env.local` without sharing the value, and completes login → `/` → Header Avatar → `/profile` → logout → `/`.

- [ ] **Step 10: Return the developer role report without committing**

Return exactly `### Changed files`, `### Test results`, `### Lint results`, `### Concerns`, and `### Blocked`. Include RED/GREEN evidence and the real-provider limitation. Do not commit or stage implementation.
