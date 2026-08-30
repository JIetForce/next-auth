# Authenticated Profile Foundation Design

## Status

This design extends the existing Google OAuth login implementation with a canonical server-first session, Header, profile, logout, redirect, test, and documentation architecture. After implementation, `docs/auth-architecture.md` becomes the canonical application-auth reference; this dated design remains the decision record.

The Google client secret shown during debugging must be rotated before the final real-provider smoke test. No credential value may be copied into tracked files, tests, reports, logs, or conversation.

## Goals

- Redirect successful Google login to `/` and render authenticated Header state on the returned page.
- Replace `Sign in` with an Avatar dropdown containing the viewer identity, Profile navigation, and Logout.
- Add a protected `/profile` Server Page with the safe minimum identity data and logout control.
- Centralize server session reads, authorization, and client-safe projection in a reusable auth DAL.
- Establish a shared `(main)` route shell for current and future authenticated-aware application pages.
- Preserve Server Components as the default and stream only the session-dependent Header slot behind Suspense.
- Fully test Header, profile, redirects, and logout without production test hooks or real Google credentials.
- Create canonical auth architecture documentation for future agents without expanding the agent-roster `AGENTS.md` contract.

## Non-goals

- A database, account model, editable profile, roles, permissions, or provider account management.
- Credentials authentication, registration, password recovery, additional OAuth providers, or Google-wide logout.
- A global `SessionProvider`, `useSession()`, focus polling, or automatic cross-tab session synchronization.
- `proxy.ts`; the profile page and auth actions enforce their own server-side checks.
- User-controlled callback URLs, return-to paths, provider IDs, or logout destinations.
- Displaying session expiry, JWT subject, raw Session objects, access/refresh tokens, or provider payloads.
- Replacing Base UI Avatar with `next/image` or adding remote image allowlists.
- Changing existing `/features` or `/pricing` behavior.
- Adding application architecture to `AGENTS.md`.

## Fixed decisions

- Route group: `(main)`.
- Profile URL: `/profile`.
- Login URL: `/login`.
- Successful login destination: `/`.
- Authenticated `/login` destination: `/`.
- Anonymous `/profile` destination: `/login`.
- Logout destination: `/`.
- Header UI: Avatar dropdown on desktop and mobile.
- Profile fields: avatar, name, email, provider `Google`, and logout.
- State model: server-first without `SessionProvider`.
- Automated authenticated testing: synthetic Auth.js JWT cookie in `e2e/**` only.
- Canonical documentation: `docs/auth-architecture.md`, linked from README.

## Route and file structure

```text
src/
  app/
    layout.tsx
    (main)/
      layout.tsx
      page.tsx
      profile/
        page.tsx
    (auth)/
      layout.tsx
      login/
        page.tsx
        actions.ts
        _components/
          google-sign-in-form.tsx
          google-sign-in-button.tsx
    api/auth/[...nextauth]/route.ts
  components/
    header.tsx
    header-account.tsx
    mobile-navigation.tsx
    user-menu.tsx
    user-avatar.tsx
    sign-out-button.tsx
    mode-toggle.tsx
    providers.tsx
    ui/
      skeleton.tsx
  lib/auth/
    actions.ts
    environment.ts
    session.ts
    types.ts

e2e/
  helpers/
    auth-session.ts
  auth-session.spec.ts
  login.spec.ts

docs/
  auth-architecture.md
```

### Root and route-group layouts

`src/app/layout.tsx` remains synchronous and owns only the global HTML, fonts, ThemeProvider/Toaster wrapper, and root metadata. It must not read cookies or sessions.

Create `src/app/(main)/layout.tsx` as the synchronous shared shell for ordinary application pages. It renders the Server Header and `{children}` inside the existing background/text layout.

Move, rather than copy, `src/app/page.tsx` to `src/app/(main)/page.tsx`. Remove the page-local Header and outer shell while preserving the existing home `<main>` content and `/` URL. The old page must not remain because two route-group pages cannot resolve to `/`.

The existing `(auth)` layout remains separate and does not render the account Header. An authenticated request to `/login` redirects before the login UI; an anonymous visitor sees the compact auth header.

## Session boundary and Viewer DTO

### Types

`src/lib/auth/types.ts` defines the only identity shape allowed across the server/client boundary:

```ts
type Viewer = Readonly<{
  name: string | null;
  email: string | null;
  image: string | null;
}>;
```

The type contains no Session expiry, provider tokens, JWT subject, provider profile, or future private application fields.

### Environment separation

Extend `src/lib/auth/environment.ts` with a session-readiness check that depends only on non-empty `AUTH_SECRET`. Keep `isGoogleAuthConfigured()` dependent on all three variables: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`.

This separation is required because decoding an existing JWT session needs the session secret but does not need Google client credentials. Google credentials control whether a new Google sign-in may begin, not whether an existing session may be read.

### DAL

Create `src/lib/auth/session.ts` with `import "server-only"` and two exports:

- `getCurrentViewer(): Promise<Viewer | null>`
- `requireCurrentViewer(): Promise<Viewer>`

`getCurrentViewer` is a module-level React `cache(async () => ...)` wrapper. It returns `null` without calling Auth.js when `AUTH_SECRET` is absent. Otherwise it calls server-side `auth()` and explicitly constructs a fresh Viewer object from only `session.user.name`, `session.user.email`, and `session.user.image`.

Do not spread `session.user`, return the Session object, use `"use cache"`, or use a persistent cache. React `cache` here only deduplicates work inside one RSC render pass.

`requireCurrentViewer` calls `getCurrentViewer()` and performs a fixed `redirect("/login")` when no viewer exists. Unknown Auth.js/runtime errors propagate to the normal Next.js error boundary rather than becoming anonymous state silently.

The DAL is the security boundary for profile rendering and future user-specific data access. Header visibility is not authorization.

## Header architecture

### Server shell

Convert `src/components/header.tsx` from a whole Client Component into a synchronous Server Component. It renders immediately:

- brand link;
- desktop primary navigation (`Home`, `Features`, `Pricing`);
- existing `ModeToggle` Client island;
- `HeaderAccount` inside a local `<Suspense>` boundary;
- `MobileNavigation` Client island.

Remove `Sign in` from the primary link array. Authentication state belongs exclusively to `HeaderAccount`, preventing duplicated desktop/mobile conditions.

The Suspense fallback uses the official shadcn/base-nova `Skeleton` and reserves the account-control area. It must not render a false anonymous `Sign in` state while the session is loading.

### Account slot

`src/components/header-account.tsx` is an async Server Component. It calls `getCurrentViewer()`:

- `null` renders a real `/login` link styled with `buttonVariants`;
- a Viewer renders `<UserMenu viewer={viewer} />`.

Only the Viewer DTO crosses into the client graph. The full Session is never passed to Header children.

### Mobile navigation

`src/components/mobile-navigation.tsx` is a small controlled Client Component containing the Sheet and public links only. It owns `open` state and closes the persistent route-layout Sheet when a link is activated by pointer or keyboard.

Do not use a button-semantic SheetClose wrapper around navigation links. Links remain actual `next/link` anchors.

### Avatar and account menu

`src/components/user-avatar.tsx` is a pure reusable component over the installed Avatar primitives. It always includes `AvatarFallback` and conditionally includes `AvatarImage` with `referrerPolicy="no-referrer"`. The provider image is decorative beside equivalent text, so it uses an empty alt value.

Fallback initials are deterministic and support nullable identity data:

1. Prefer trimmed name words.
2. Use the first code point of the first and last words, or two code points for a single word.
3. Fall back to the email local-part split by whitespace, `.`, `_`, or `-`.
4. Uppercase at most two code points.
5. Use `U` when both name and email are absent.

`src/components/user-menu.tsx` is a Client Component using the installed Base UI DropdownMenu. Its trigger is one Button rendered through `DropdownMenuTrigger.render`, with an accessible account-menu label. The popup shows safe display name/email, a Profile item rendered as a real Link, and a Logout item rendered as a real submit button inside a Server Action form. All items remain inside DropdownMenuGroup; no nested interactive elements are permitted.

The same Avatar dropdown appears on desktop and mobile, next to the existing theme control. The mobile Sheet never receives Viewer data.

## Profile page

Create `src/app/(main)/profile/page.tsx` as an async Server Component with `noindex` metadata.

The first page operation is `requireCurrentViewer()`. The page then renders a responsive full Card composition with:

- a real `<h1>Profile</h1>`;
- `UserAvatar`;
- semantic `<dl>` rows for Name, Email, and Provider;
- fallback copy `Not provided` for nullable name/email;
- static provider value `Google`, valid while Google remains the only configured provider;
- a logout form/button in CardFooter.

Do not render `JSON.stringify(session)`, IDs, expiry, tokens, or hidden provider fields.

## Login redirect correction

Update `/login` to call `getCurrentViewer()` independently of `isGoogleAuthConfigured()` and redirect an existing Viewer to `/` before rendering the form.

After that check, `isGoogleAuthConfigured()` continues to control the sign-in button and configuration alert. This preserves the current safe unconfigured UI while allowing a valid existing session to be recognized if Google client credentials are temporarily unavailable.

## Logout action

Create `src/lib/auth/actions.ts` with file-level `"use server"` and `signOutAction(): Promise<void>`.

The action accepts no FormData-derived provider, identity, callback, or destination. It calls `getCurrentViewer()` to enforce an application-level session check. A missing viewer redirects to `/`; an authenticated viewer invokes the server export `signOut({ redirectTo: "/" })` from `@/auth`.

The logout UI must use an HTML form, so state mutation is POST-backed and benefits from Next.js Server Action origin checks. Do not use a GET link, `next-auth/react`, `router.push`, user-controlled redirect, or an extra redirect after Auth.js signOut.

`src/components/sign-out-button.tsx` is the profile-page Client leaf using `useFormStatus` and the existing Spinner for pending/disabled feedback. The account menu may implement its menuitem-specific pending control inside `user-menu.tsx`, because its Base UI semantics differ from the standard Button.

Logout clears the local Auth.js JWT cookie. It does not revoke the user's Google session or provide server-side revocation of a copied JWT.

## Redirect and state matrix

| State/action | Required result |
| --- | --- |
| Anonymous `GET /` | `200`; Header shows Sign in and no PII/Profile/Logout |
| Authenticated `GET /` | `200`; Sign in absent; Avatar menu exposes Profile and Logout |
| Anonymous/invalid/expired session `GET /profile` | fixed redirect to `/login`; private profile markup absent |
| Authenticated `GET /profile` | `200`; safe Viewer fields only |
| Anonymous `GET /login` | existing login/configuration UI |
| Authenticated `GET /login` | fixed redirect to `/` |
| Successful Google login | fixed redirect to `/`; authenticated Header rendered server-side |
| Authenticated logout submit | JWT cookie cleared; fixed redirect to `/`; Header becomes anonymous |
| Anonymous direct logout action | fixed redirect to `/` |
| Any callback/redirect/provider browser input | ignored; no destination changes |

Layouts and Header state are UX only. Every future protected page, action, handler, or data function must invoke the DAL/authorization boundary itself.

## Synthetic authenticated E2E strategy

Create `e2e/helpers/auth-session.ts`, never a production route or provider. The helper uses the pinned `next-auth/jwt` `encode()` API to create a short-lived Auth.js JWE with:

- the same ephemeral test-only `AUTH_SECRET` supplied to the Playwright server;
- cookie name/salt `authjs.session-token` for local HTTP;
- an identity such as `E2E User`, `e2e-user@example.invalid`, and no remote image;
- five-minute maximum age;
- HttpOnly, SameSite=Lax, non-Secure localhost cookie;
- browser-context-only storage.

The helper must never print or persist the secret, cookie, or token. Do not use real `.env.local` credentials, saved `storageState`, trace fixtures containing real sessions, a Credentials provider, or a test-only production endpoint.

This seam is intentionally coupled to pinned `next-auth@5.0.0-beta.32`. A focused fixture-contract test first proves that `/api/auth/session` recognizes the synthetic cookie. Dependency upgrades must update this helper and contract before other authenticated tests.

Create `e2e/auth-session.spec.ts` covering independent browser contexts:

1. fixture contract through `/api/auth/session`;
2. anonymous desktop/mobile Header;
3. anonymous `/profile` redirect with no private markup;
4. authenticated Header initial server render, menu, name/email, Profile link, and absence of Sign in;
5. authenticated `/profile` safe fields;
6. authenticated `/login` redirect to `/`;
7. logout cookie removal, redirect to `/`, anonymous Header, and re-denied `/profile`;
8. tampered cookie fails closed;
9. fixed destinations are unaffected by callback/redirect query or form values.

Keep existing login/theme/LAN-origin tests. Explicitly run both unconfigured and configured synthetic-session modes; configured tests must not all skip silently.

Set Playwright `outputDir` under ignored `.next/playwright` so test runs do not leave `test-results/` in the worktree.

A real-provider smoke test still covers Google consent/MFA, OIDC callback/token exchange, real profile mapping, production host, HTTPS cookie prefix, and persistence across restart.

## Documentation architecture

Create `docs/auth-architecture.md` as the canonical reference for future agents. It contains:

1. pinned versions and Google-only/JWT/no-database invariants;
2. route and redirect matrix;
3. route-group and file ownership;
4. DAL and Viewer DTO contracts;
5. Server/Client/Suspense Header boundaries;
6. profile and logout contracts;
7. synthetic-session test seam and upgrade warning;
8. threat model and prohibited patterns;
9. environment setup and real Google smoke checklist;
10. rule to update the document and tests whenever auth behavior changes.

README keeps concise setup/operator instructions and links prominently to the canonical auth document. The previous Google auth design document receives a short pointer to the canonical document because its original non-goals no longer describe the expanded profile foundation.

Do not add application details to `AGENTS.md`; it remains the agent-roster operating contract. Remove the now-false `SessionProvider` future comment from `src/components/providers.tsx` as an explicitly approved cleanup.

## Security properties

- Only `AUTH_SECRET` readiness controls existing-session reads; all secret values stay server-side.
- Only allowlisted Viewer fields cross to Client Components.
- Profile authorization occurs in the profile page through the DAL, not in Header/layout visibility.
- Server Actions are treated as public POST endpoints and perform their own session check.
- Sign-in and sign-out destinations are compile-time relative constants.
- No real session/token is committed, logged, placed in URLs, persisted in Playwright state, or exposed in UI.
- A corrupt/expired cookie fails closed.
- Native provider Avatar loading avoids server-side SSRF and uses `no-referrer`; fallback remains available.
- The current JWT strategy supports cookie deletion but not central token revocation.
- The synthetic cookie seam cannot be imported from `src/**` and provides no runtime authentication bypass.
- The disclosed Google client secret must be reset in Google Cloud before real-provider completion.

## Verification and accepted baseline

Follow TDD: fixture and behavioral tests must fail for the expected missing behavior before production changes, then pass after the minimal implementation.

Required verification:

- focused synthetic-session fixture test;
- full unconfigured Playwright suite;
- full configured synthetic-session Playwright suite with ephemeral non-secret test values;
- lint;
- configured production build;
- agent-roster tests;
- diff/secret/artifact checks;
- browser inspection in light/dark and mobile/desktop;
- final real Google login/profile/logout smoke after the user rotates the disclosed client secret.

The approved baseline remains: lint has two pre-existing agent-roster warnings, and `npm run test:agents` has exactly one pre-existing environment-dependent duplicate-skill-discovery failure (16 pass / 1 fail). No additional warning or failure is accepted.

## Acceptance criteria

- `/` and `/profile` share a `(main)` Header shell; `/login` keeps its separate auth shell.
- Anonymous and authenticated Header variants are server-rendered without global client session state.
- The account slot streams independently and never flashes a false Sign in state while loading.
- The Avatar dropdown works by pointer and keyboard on desktop and mobile.
- `/profile` is protected independently and renders only the safe minimum Viewer information.
- Login, profile denial, successful auth, and logout follow the fixed redirect matrix.
- Logout is POST-backed, clears the local JWT cookie, and updates Header state.
- Synthetic E2E proves authenticated behavior without a production backdoor or real credentials.
- Canonical architecture is documented in `docs/auth-architecture.md` and linked from README.
- No database, Proxy, SessionProvider, dynamic redirect, raw Session client prop, or secret-bearing artifact is added.
- App tests, lint, and build pass; agent-roster verification introduces no regression beyond its approved baseline.
- Real Google smoke is reported honestly and remains incomplete until the disclosed Google client secret is rotated.
