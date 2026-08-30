# Google Authentication Page Design

## Status

After the authenticated profile foundation, `docs/auth-architecture.md` is the canonical application-auth reference. This document remains the original Google login decision record.

## Summary

Build a production-oriented `/login` page with a real Google OAuth flow through Auth.js v5. Keep Next.js Server Components as the default, isolate the authentication routes with an `(auth)` route group, and limit new client-side code to the pending state of the submit button. The page must work in the existing light, dark, and system themes.

The user will add real credentials after implementation. No secret values, generated `.env.local`, database, or Credentials provider are part of this change.

## Goals

- Provide a responsive English-language `/login` page with a single Google sign-in action.
- Configure Auth.js v5 and its App Router Route Handler for Google OAuth.
- Redirect successful sign-ins to `/`.
- Redirect an already authenticated visitor from `/login` to `/` on the server.
- Preserve a usable configuration state before the required environment variables are present.
- Follow the installed Next.js 16.3.3 documentation, the repository research, and the existing shadcn/base-nova conventions.
- Add browser-level regression coverage for routing, provider configuration, accessibility, responsiveness, and theme switching.

## Non-goals

- Email/password authentication, account registration, password recovery, or a Credentials provider.
- A database, adapter, persistent application-user records, roles, refresh-token storage, or immediate server-side session revocation.
- A global `SessionProvider`, `useSession()`, or client-side authentication state.
- Protected application routes or `proxy.ts`; there is currently no protected route to pre-filter.
- Dynamic callback URLs or redirects supplied through search parameters, hidden fields, or other client-controlled input.
- Localization infrastructure; the page remains English to match the existing `lang="en"` application shell.
- Storing or committing real OAuth credentials.

## Dependencies

- Add runtime dependency `next-auth@5.0.0-beta.32` exactly. This version supports Next.js 16 and React 19 and was published more than seven days before this design.
- Add dev dependency `@playwright/test@1.62.1` exactly for application E2E tests.
- Add the official shadcn/base-nova `spinner` component through the project package runner. Do not overwrite unrelated installed UI components.
- Do not add an ORM, password hashing package, schema library, or alternate auth library.

## File structure and responsibilities

```text
src/
  auth.ts
  lib/
    auth/
      environment.ts
  app/
    api/
      auth/
        [...nextauth]/
          route.ts
    (auth)/
      layout.tsx
      login/
        page.tsx
        actions.ts
        _components/
          google-sign-in-form.tsx
          google-sign-in-button.tsx
  components/
    header.tsx
    ui/
      spinner.tsx

e2e/
  login.spec.ts

playwright.config.ts
README.md
package.json
package-lock.json
```

### `src/auth.ts`

This is the single Auth.js configuration boundary. It initializes `NextAuth` with the Google provider, an explicit JWT session strategy, and custom `signIn` and `error` pages at `/login`. It exports `handlers`, `auth`, `signIn`, and `signOut` using the Auth.js v5 App Router API.

Provider credentials are inferred from `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`; `AUTH_SECRET` signs/encrypts Auth.js state. No environment value is copied into source or exposed through `NEXT_PUBLIC_*`.

### `src/lib/auth/environment.ts`

This server-only module exposes a boolean configuration check. It verifies that `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` are all non-empty without returning or logging their values. The login page and sign-in action use the same check, avoiding duplicated environment policy.

### `src/app/api/auth/[...nextauth]/route.ts`

This App Router Route Handler re-exports `GET` and `POST` from `handlers`. It contains no provider logic of its own.

### `src/app/(auth)/layout.tsx`

This Server Component is the shared authentication shell. It renders a compact header with a brand link to `/` and the existing `ModeToggle`, then renders its children. It does not duplicate the root `<html>` or `<body>` elements and does not reuse the full client-side marketing `Header`.

### `src/app/(auth)/login/page.tsx`

This remains a Server Component and owns page metadata and top-level composition. It:

1. Reads only a normalized error discriminator from the asynchronous Next.js 16 `searchParams` prop.
2. Checks whether the auth environment is configured.
3. Calls `auth()` only when configuration is present.
4. Redirects an authenticated user to `/`.
5. Renders the centered Google sign-in card for an unauthenticated user.

Metadata includes an English title and description plus `robots: { index: false, follow: false }`.

### `src/app/(auth)/login/actions.ts`

The exported Server Action accepts no user-controlled provider or redirect value. It:

1. Checks the server-only environment policy.
2. Redirects to `/login?error=configuration` when required configuration is absent.
3. Calls `signIn("google", { redirectTo: "/" })` with compile-time constants.
4. Converts expected `AuthError` failures into `/login?error=oauth`.
5. Re-throws unknown and framework control-flow errors unchanged.

This action is treated as a public POST endpoint. It does not log secrets, provider responses, tokens, or raw error details.

### Form components

`google-sign-in-form.tsx` is a Server Component containing the `<form action={signInWithGoogle}>`. It passes the server-derived configured state into the submit button.

`google-sign-in-button.tsx` is the smallest new Client Component. It uses `useFormStatus()` to disable duplicate submissions and swap the label to `Redirecting…` with the shadcn `Spinner`. It does not import Auth.js client APIs.

## Authentication flow

1. An unauthenticated visitor requests `/login`.
2. With complete environment configuration, the Server Component calls `auth()`; no session renders the page.
3. The visitor submits the Google-only form.
4. The Server Action invokes `signIn("google", { redirectTo: "/" })`.
5. Auth.js routes the browser through Google using `/api/auth/callback/google` as the callback.
6. Auth.js creates the JWT-backed session cookie and redirects to `/`.
7. A later request to `/login` calls `auth()` and redirects to `/` before rendering the sign-in card.

Without complete environment configuration, `/login` stays renderable, does not call `auth()`, shows a configuration alert, and disables the submit button. Direct invocation of the action still fails closed by redirecting to the configuration error state.

## UI and theme behavior

- Use a centered, mobile-first Card with `w-full max-w-sm`.
- Compose the Card with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`. The header owns the title and description, the content owns alerts and the form, and the footer states that authentication is handled by Google.
- Render a real `<h1>` inside the card title because the installed `CardTitle` is not itself a heading element.
- Use the copy `Welcome back`, a short Google-specific description, and `Continue with Google` for the primary action.
- Do not render email/password controls, registration links, password-reset links, or links to routes that do not exist.
- Use the installed `Alert` for configuration and generic OAuth failures.
- Use only semantic theme utilities such as `bg-background`, `bg-muted`, `text-foreground`, `text-muted-foreground`, and `border-border`. Do not add raw color values or manual dark-mode color overrides.
- Reuse the existing `ThemeProvider` and `ModeToggle`; retain light, dark, and system options and hydration-safe behavior.
- Update the existing Header sign-in link from `/auth` to `/login`.
- Preserve visible focus states, keyboard operation, accessible button names, status semantics, and disabled state semantics.

## Error handling and security

- All provider and redirect choices are server-owned constants.
- No `callbackUrl`, `redirectTo`, provider ID, or absolute URL is accepted from the browser.
- Expected configuration and OAuth failures become allowlisted query discriminators; raw Auth.js error types and messages are not rendered.
- Unknown errors are thrown so the nearest Next.js error boundary handles them.
- Successful Auth.js redirects remain control-flow exceptions and must not be swallowed.
- `Proxy` is omitted because it would not replace checks near data or actions and there are no protected routes in this scope.
- `SessionProvider` is omitted because all session reads occur through server-side `auth()`.
- Google callback URLs to configure after implementation are:
  - local: `http://localhost:3000/api/auth/callback/google`
  - production: `https://<production-origin>/api/auth/callback/google`

## Testing strategy

Follow red-green-refactor:

1. Add Playwright configuration and a failing `/login` E2E test before production implementation. Confirm the failure is the missing route/UI, not test setup.
2. Implement the minimum route and UI to pass.
3. Add the provider and configured-state assertions before completing Auth.js wiring, confirm they fail, then make them pass.
4. Refactor only while the suite remains green.

The E2E suite covers:

- `/login` has an accessible `Welcome back` heading and Google action.
- The existing Header points to `/login` rather than `/auth`.
- Without auth environment variables, the configuration alert appears and submission is disabled.
- With non-secret test environment values, the button is enabled and `/api/auth/providers` exposes only the Google provider with local sign-in/callback URLs.
- Light and dark selections update the root theme and persist after reload; system remains available.
- The auth shell and card fit a narrow mobile viewport without horizontal overflow.

A complete Google consent/callback cannot be automated honestly without real provider credentials. After the user adds them, perform a manual smoke test covering Google consent, redirect to `/`, session persistence, and the authenticated `/login` redirect.

## Verification commands

- `npm test`
- A second Playwright run with non-secret test values supplied through the process environment.
- `npm run lint`
- `npm run build`
- `npm run test:agents`

Install the Playwright Chromium binary locally before its first run when needed; do not commit browser binaries.

## Baseline verification exception

Before implementation, `npm run build` passed, `npm run lint` passed with two pre-existing warnings in agent-roster scripts, and `npm run test:agents` passed 16 of 17 tests. The sole failure was the environment-dependent discovery-collision test reporting both project-specific skill directories and the user's global `~/.agents/skills` source for Devin and Antigravity.

The user explicitly approved treating that exact `test:agents` failure as a pre-existing baseline rather than widening the authentication task into global harness configuration. Final verification must show no additional agent-test failure and must preserve the same 16-pass/1-fail result and collision reason. Any different or additional failure is a regression.

## README setup instructions

Document, without values:

```env
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

Explain that the required Node.js runtime provides this cross-platform way to generate a secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Instruct the reader to copy the command output into `AUTH_SECRET`. Also explain that `.env.local` is ignored and that the Google OAuth client must register the exact callback URL for each environment.

## Acceptance criteria

- `/login` renders in light and dark themes and is responsive and keyboard accessible.
- Google sign-in is implemented through the Auth.js server API, not a client-side imitation.
- A successful real-provider login redirects to `/` and creates a session recognized by `auth()`.
- An authenticated request to `/login` redirects to `/`.
- Missing credentials produce a safe, usable configuration state without exposing or fabricating secrets.
- No Credentials provider, database, global SessionProvider, Proxy, dynamic redirect, or secret file is introduced.
- App E2E tests, lint, and the production build pass. Agent-roster tests introduce no regression beyond the explicitly approved 16-pass/1-fail discovery-collision baseline, and the real-provider smoke test remains pending until credentials are supplied.
