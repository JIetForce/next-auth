# Instant navigation and caching architecture — design

Date: 2026-09-02
Status: approved approach A (full adoption), pending spec review
Origin: user report — "every time the profile opens, it reloads"; scope widened
by the user to an application-wide architecture using current Next.js 16
practices, because the code is public.

## Context

The app runs Next.js 16.3.3 with `cacheComponents: true`. The session layer
already follows the documented pattern: `getCurrentViewer()` and
`requireCurrentViewer()` in `src/lib/auth/session.ts` use `"use cache: private"`
with the default cache profile (5-minute `stale`), and `redirect()` sits inside
the private scope so it produces an HTTP redirect. The header already renders
`HeaderAccount` behind a `<Suspense>` boundary.

Five pages still opt out of instant navigation with `export const instant =
false`, each with a comment deferring to this design: `/profile`, `/login`,
`/register`, `/reset-password`, `/verify-email`. All five read the session at
the page level; `/login` and `/reset-password` also read `searchParams` there;
`/verify-email` reads a cookie there. With the opt-out, navigation to these
routes blocks on the server — the reported profile symptom.

Sources of truth for every pattern below (this Next.js version diverges from
older training data; the packaged docs govern):
`node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`,
`.../02-guides/instant-navigation.md`, `.../02-guides/optimizing-prefetching.md`,
`.../03-api-reference/05-config/01-next-config-js/partialPrefetching.md`.

## What changes

### 1. Target model

Every route is composed of a static shell (prerendered at build, carried in the
App Shell, rendered instantly on navigation) plus session-dependent content
behind a `<Suspense>` boundary (streams in; with `"use cache: private"` and the
default profile the resolved content is prefetched per session). No
`instant = false` exports remain anywhere in `src/app`.

### 2. Session layer — unchanged

`src/lib/auth/session.ts` stays as is. It already matches the
`authentication-with-cache-components` guide verbatim.

### 3. Page restructures (5 pages)

One rule applied everywhere: **the page renders a static frame and wraps
everything that depends on the session, cookies, searchParams, or environment
configuration in `<Suspense fallback={skeleton}>`**.

- `/profile` (`src/app/(main)/profile/page.tsx`): frame keeps the background
  layers, `Card` frame, and static title. The boundary wraps the avatar, the
  name/email/providers list, and the sign-out footer as one unit — wrapping the
  footer too, so an anonymous visitor never sees a "Sign out" button flash
  before `requireCurrentViewer()` redirects them. Delete
  `export const instant = false`.
- `/login` (`src/app/(auth)/login/page.tsx`): frame is the `AuthCardShell`
  badge/title/description. The boundary wraps the session check (redirect to
  `/` when authenticated), the `searchParams` handling (`verify` redirect,
  error alerts), `isGoogleAuthConfigured()`, both forms, and the links.
  Keeping the env check inside the boundary avoids baking configuration state
  into the prerendered shell.
- `/register` (`src/app/(auth)/register/page.tsx`): same shape as `/login`
  minus `searchParams`.
- `/reset-password` (`src/app/(auth)/reset-password/page.tsx`): the boundary
  wraps the session check, the `token` branch of `searchParams`, and the
  corresponding form (`ResetPasswordForm` vs `ForgotPasswordForm`).
- `/verify-email` (`src/app/(auth)/verify-email/page.tsx`): the boundary wraps
  the session check, the `pending_verification_email` cookie read, and
  `ResendForm`.

Fallbacks are small skeleton components defined next to the page that wraps
them (the auth group's `_components`, a profile-local component), visually
matching the existing `loading.tsx` skeletons — card-shaped placeholder rows,
no spinners. The `loading.tsx` files themselves stay: they remain the
segment-level fallback for full document loads, while the in-page boundaries
cover client navigations.

Redirect semantics are preserved: the redirects run inside the boundary via the
existing private-scope helpers, so an authenticated user visiting `/login`
still lands on `/`, and an anonymous visitor to `/profile` still lands on
`/login`. With a warm per-session shell the redirect is prefetched ahead of the
click; on a cold cache the frame appears first and the redirect streams in.

### 4. Database-derived data caching (DAL convention seed)

`getLinkedAccountProviderLabels(userId)` in `src/lib/auth/accounts.ts` gains an
internal cached function:

- unexported `...ByUserId(userId)` with `"use cache"`, `cacheTag(\`accounts:${userId}\`)`,
and `cacheLife("hours")` (provider links change rarely; expiry covers the
  no-mutation-flow present today);
- the exported wrapper keeps its signature and calls the cached function.

Convention recorded for future data access functions: pass `userId` as an
argument (never read `cookies()` inside a plain `"use cache"` scope), tag with
`entity:<userId>`, and call `updateTag(\`entity:<userId>\`)` from the Server
Action when a mutation touching that entity is added. Cache keys and tags are
stored in plain text — key only on stable identifiers, never secrets.

### 5. Configuration

`partialPrefetching: true` in `next.config.ts` (top-level flag; requires
`cacheComponents`, which is already on). Effect: one App Shell per route is
prefetched and cached on the client; routes reading `cookies()`/`headers()`
automatically produce per-session shells.

No `<Link prefetch={true}>` is added now: no shell depends on URL data —
`searchParams`-derived content lives inside boundaries and resolves after
navigation. Rule for the future: when a route's shell comes to depend on
`params`/`searchParams`, opt the links pointing at it into `prefetch={true}`.

### 6. Tests

- New dev dependency `@next/playwright` pinned to `16.3.3` (exact match with
  `next@16.3.3`; peer range `@playwright/test >= 1.0.0` is satisfied).
- New `e2e/instant-navigation.spec.ts` using the `instant()` helper:
  - client navigation `/` → `/profile` is instant; profile content streams in
    after the callback scope;
  - initial page load of `/profile` shows the shell instantly;
  - client navigation `/` → `/login` is instant for an anonymous session;
  - client navigation `/` → `/pricing` is instant (public shell).
    The suite's `webServer` runs `npm run dev`, where the testing API is enabled
    automatically — no production-build flag needed.
- The existing 50-test e2e suite must stay green: user-visible behavior is
  preserved, only its delivery changes. Playwright auto-waiting covers the
  streaming content; any test asserting form visibility synchronously is fixed
  by adding waits, never by reverting the architecture.

## What must not change

- Anti-enumeration timing invariants in `src/auth.ts` (un-awaited email
  dispatch) — untouched.
- `server-only` boundaries on the data access modules — untouched.
- Security response headers and the CSP setup in `next.config.ts` — the only
  config change is `partialPrefetching`.
- HTTP-redirect semantics from the private cache scope.
- The logout form's server-side session re-validation.
- The public routes (`/`, `/features`, `/pricing`, `/terms`, `/privacy`)
  remain static (`○`) in the build route table.

## How it is verified

- `npm run build` — succeeds; route table inspected: public routes `○`, the
  five restructured routes no longer blocking (shell + streaming).
- `npx tsc --noEmit`
- `npm run lint` with 0 warnings
- `npm run test:unit`
- `npm run test:agents`
- `npm run check:agents`
- `npm run format:check`
- New `e2e/instant-navigation.spec.ts` passes; full `npm test` suite passes
  (human-gated per project convention — report un-run).

Security-relevant paths touched:
`src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`,
`src/app/(auth)/reset-password/page.tsx`, `src/app/(auth)/verify-email/page.tsx`,
`src/app/(main)/profile/page.tsx`, `src/lib/auth/accounts.ts`, `next.config.ts`
(per-session client-side caching of shells containing session-derived content —
documented `"use cache: private"` behavior, flagged for the security reviewer).

## Out of scope (already decided)

- TanStack Query / SWR: not adopted. The app is server-centric (Server
  Components + Server Actions); Cache Components covers its caching needs.
  Revisit only when client-owned server-state features arrive (polling,
  optimistic CRUD, infinite feeds).
- A full Data Access Layer subsystem: not built. One DB-derived read exists;
  the convention seed in section 4 is the whole deliverable. YAGNI.
- Per-link prefetching (`<Link prefetch={true}>`): no current route needs it
  (section 5).
- Broader best-practices pass (providers, error boundaries, metadata): metadata
  and error boundaries were delivered by earlier audits; no evidence of gaps.
- Removing `loading.tsx` segment fallbacks: they remain useful for full
  document loads.
