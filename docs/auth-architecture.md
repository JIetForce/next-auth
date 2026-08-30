# Authentication Architecture

## Canonical status

This file is the source of truth for application authentication. Update it together with auth behavior and E2E tests. The implementation is pinned to Next.js 16.3.3, React 19.2.8, and next-auth 5.0.0-beta.32.

The dated designs under `docs/superpowers/specs/` remain decision records. When they differ from the current implementation, this document and the executable tests describe the current contract.

## Invariants

- Google OAuth is the only sign-in provider.
- Auth.js uses encrypted JWT cookie sessions and no database adapter.
- Server Components and the server `auth()` export are the source of session truth.
- There is no global `SessionProvider` or `useSession()` client state.
- Client Components receive only the `Viewer` fields `{ name, email, image }`.
- Every protected page, action, handler, or data boundary checks the Viewer itself.
- Header and layout visibility are user experience, not authorization.
- Provider selection and redirect destinations are server-owned constants.
- Existing-session reads require only a non-empty `AUTH_SECRET`; starting Google sign-in requires all three auth variables.

## Routes and redirects

All destinations are fixed relative paths, pinned at two layers: an explicit `callbacks.redirect` in `src/auth.ts` pins every Auth.js sign-in/sign-out destination to `/`, and application Server Actions never accept a `callbackUrl`/`redirectTo` value in the first place. Together these mean no query parameter, form field, or cookie — including a `callbackUrl` sent directly to the raw `/api/auth/signin/*` or `/api/auth/signout` routes under `src/app/api/auth/[...nextauth]/route.ts` — can change where a sign-in, sign-out, or profile redirect lands. Auth.js's own default `redirect` callback already restricted any such value to the current origin before this pin existed, so a same-origin `callbackUrl` (e.g. `/profile`) was never a cross-origin open redirect; it could only steer the destination within this origin, which the pin now also closes.

| State or action                                       | Result                                                   |
| ----------------------------------------------------- | -------------------------------------------------------- |
| Anonymous `GET /`                                     | `200`; Header shows **Sign in** and no account data      |
| Authenticated `GET /`                                 | `200`; Header shows the Avatar account menu              |
| Anonymous, invalid, or expired session `GET /profile` | Redirect to `/login`; no private profile markup          |
| Authenticated `GET /profile`                          | `200`; render only safe Viewer fields and provider label |
| Anonymous `GET /login`                                | Render the sign-in or safe configuration UI              |
| Authenticated `GET /login`                            | Redirect to `/`                                          |
| Successful Google login                               | Redirect to `/`                                          |
| Authenticated logout form submit                      | Delete the local Auth.js JWT cookie and redirect to `/`  |
| Anonymous direct logout action                        | Redirect to `/`                                          |

Logout ends this application's local session. It does not sign the user out of Google or revoke a copied JWT centrally.

## File ownership

- `src/app/layout.tsx` is the synchronous root layout. It owns HTML, fonts, global styles, theme/toast providers, and root metadata. It does not read cookies or sessions.
- `src/app/(main)/layout.tsx` is the synchronous shell for ordinary application pages. It owns the shared `Header` and page background/text layout without changing URLs.
- `src/app/(main)/page.tsx` owns the `/` page body.
- `src/app/(main)/profile/page.tsx` owns the protected `/profile` Server Page and performs its own Viewer guard.
- `src/app/(auth)/layout.tsx` owns the compact authentication shell and intentionally has no account Header.
- `src/app/(auth)/login/page.tsx` owns `/login`, the existing-session redirect, metadata, and configuration/error presentation.
- `src/app/(auth)/login/actions.ts` owns the fixed Google sign-in Server Action.
- `src/app/(auth)/login/_components/` contains only the Google form and its pending button leaf.
- `src/auth.ts` is the single Auth.js provider/session configuration boundary.
- `src/app/api/auth/[...nextauth]/route.ts` only re-exports the Auth.js `GET` and `POST` handlers.
- `src/lib/auth/environment.ts` owns session-readiness and Google-provider-readiness checks without exposing values.
- `src/lib/auth/types.ts` owns the client-safe `Viewer` DTO.
- `src/lib/auth/session.ts` is the server-only session DAL.
- `src/lib/auth/actions.ts` owns the checked, zero-input logout Server Action.
- `src/components/header.tsx` is the synchronous Server Component shell.
- `src/components/header-account.tsx` is the async session-dependent Server Component slot.
- `src/components/mobile-navigation.tsx`, `src/components/user-menu.tsx`, `src/components/sign-out-button.tsx`, and `src/components/mode-toggle.tsx` are focused Client islands.
- `src/components/user-avatar.tsx` owns Avatar rendering and deterministic fallback initials.
- `e2e/helpers/auth-session.ts` is the test-only synthetic-session seam; it must never be imported by `src/**`.
- `e2e/auth-session.spec.ts` and `e2e/login.spec.ts` are the browser-level auth contracts.

## Session and authorization boundary

`isAuthSessionConfigured()` checks only whether `AUTH_SECRET` is non-empty. This allows an existing JWT session to be decoded even if Google client credentials are temporarily unavailable. `isGoogleAuthConfigured()` additionally requires non-empty `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`; it controls whether a new Google sign-in can begin.

`getCurrentViewer()` is a module-level React `cache(async () => ...)` function in the server-only DAL. The cache only deduplicates work during a React render pass; it is not a persistent or cross-request user cache. Without session readiness it returns `null` without calling Auth.js. Otherwise it calls server-side `auth()` and constructs a fresh object from exactly `session.user.name`, `session.user.email`, and `session.user.image`. It never spreads `session.user` or returns the raw Session.

`requireCurrentViewer()` reuses that projection and performs the fixed `redirect("/login")` when no Viewer exists. Unexpected Auth.js or runtime errors are not converted silently into anonymous state; they propagate to the normal Next.js error boundary.

Protected pages and mutations invoke this boundary directly. A layout check, hidden menu, or client-side condition must never be the only access check.

## Header and profile boundaries

`Header` renders the brand, public desktop navigation, and the theme control synchronously. Only `HeaderAccount` is placed behind a local Suspense boundary. Its official shadcn `Skeleton` fallback reserves the account-control area and does not pretend that the visitor is anonymous while session work is pending.

`HeaderAccount` renders either a real `/login` link or `UserMenu`. The full Auth.js Session never enters the client module graph. The controlled mobile Sheet receives public navigation links only and closes after pointer or keyboard link activation.

`UserMenu` uses Base UI `render` composition so there is one native Button trigger, a real anchor-backed Profile menu item, and a real submit-button Logout menu item. Interactive elements are not nested. The same account slot remains available at desktop and mobile widths.

`UserAvatar` uses the installed Base UI Avatar primitives. It always renders a fallback, conditionally renders the provider image with an empty decorative alt and `referrerPolicy="no-referrer"`, and never proxies the image through `next/image`. Initials prefer name words, then the email local-part, and finally `U`.

The profile page calls `requireCurrentViewer()` before rendering. It exposes only avatar, name, email, and the static provider value `Google`; nullable name or email uses `Not provided`. It does not render subject IDs, expiry, tokens, provider payloads, or a serialized Session. Its metadata is `noindex, nofollow`.

## Logout contract

Both logout controls submit an HTML form to `signOutAction()`, so the mutation is POST-backed and receives Next.js Server Action origin checks. The action accepts no provider, identity, callback, or destination input. It checks `getCurrentViewer()` itself, redirects an anonymous call to `/`, and otherwise invokes `signOut({ redirectTo: "/" })` exactly once. Auth.js owns cookie deletion and the authenticated redirect; the action adds no second redirect.

Do not replace logout with a GET link, a client router transition, or `next-auth/react`.

## Testing seam

`e2e/helpers/auth-session.ts` uses the pinned `next-auth/jwt` `encode()` API to create a five-minute local Auth.js JWE. It uses the local HTTP cookie name and salt `authjs.session-token`, an ephemeral test-only `AUTH_SECRET` shared with the Playwright child server, synthetic identity data, and browser-context-only storage. The cookie is HttpOnly, SameSite=Lax, and non-Secure only because the test origin is local HTTP.

The helper never prints or persists the secret, cookie, or token. Tests do not use real credentials, a Credentials provider, a production test route, or saved `storageState`. Playwright artifacts are routed to ignored `.next/playwright`.

The fixture-contract test against `/api/auth/session` must pass before authenticated behavior failures are interpreted. This seam is intentionally coupled to next-auth 5.0.0-beta.32; revalidate and update the helper contract before upgrading Auth.js.

Run both modes:

- with all auth variables explicitly unset, for anonymous/configuration behavior;
- with a generated ephemeral secret plus non-provider `e2e-not-*` sentinels, for synthetic authenticated behavior.

Synthetic tests prove local cookie/session integration, application projection, authorization, redirects, and logout. They do not prove Google consent, MFA, OIDC callback/token exchange, real profile mapping, production hosts, HTTPS cookie prefixes, or restart persistence.

## Threat model and prohibited patterns

The pinned `callbacks.redirect` in `src/auth.ts`, together with the fixed relative destinations in application Server Actions, prevents a same-origin `callbackUrl`/`redirectTo` value — query parameter, form field, or the `authjs.callback-url` cookie — from steering a callback or logout destination anywhere other than `/`, including when the raw `/api/auth/signin/*` and `/api/auth/signout` routes are hit directly rather than through the app's own UI. Auth.js's built-in redirect handling already clamped any such value to the current origin, so this was never a cross-origin open redirect; the pin closes the narrower same-origin destination-steering gap. The Viewer allowlist limits accidental disclosure across the Server/Client boundary. Profile and Server Action checks prevent Header visibility from becoming authorization. A corrupt or expired cookie fails closed. POST Server Actions provide framework origin checking, while authorization remains explicit inside each action. Direct provider image loading avoids server-side image fetching and sends no referrer.

JWT cookie deletion cannot revoke an already copied token, and this no-database architecture has no central session revocation. Any future requirement for immediate revocation requires a new approved design.

Do not introduce:

- raw Session objects or spread `session.user` values in client props;
- global `SessionProvider`, `useSession()`, polling, or cross-tab synchronization without a new requirement;
- GET logout, client-only authorization, or browser-controlled callback/provider/redirect values;
- test auth routes, test providers, a Credentials provider, production test switches, or persisted authenticated `storageState`;
- real credentials, real cookies, or token values in source, tests, documentation, artifacts, URLs, or logs;
- Proxy as the sole authorization boundary;
- persistent caching of session-specific Viewer data;
- profile rendering of IDs, JWT subjects, expiry, tokens, or provider payloads.

## Environment setup

The server requires these variable names:

- `AUTH_SECRET` for JWT/state encryption and existing-session reads;
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` to start Google OAuth.

Keep values in ignored local/deployment environment configuration. Never prefix them with `NEXT_PUBLIC_`, paste them into tracked files, or print them. Generate a high-entropy Auth.js secret with the operator command documented in `README.md`.

### AUTH_SECRET stability and rotation recovery

`AUTH_SECRET` is the encryption key for JWT sessions and must remain stable across application restarts, deployments, and replicas. Rotating it intentionally invalidates every existing JWT session. A browser that still sends a cookie encrypted with the previous secret fails closed and can produce `JWTSessionError: no matching decryption secret` until that stale cookie is removed.

Do not restore the previous secret to recover an old session. Visit `/api/auth/signout` and confirm the built-in **Sign out** form, which performs the cleanup through POST, or clear the site's cookies in the browser. Then return to `/login` and authenticate again. The GET visit only renders Auth.js's confirmation page; it is not a custom GET logout or cleanup endpoint.

Register the exact Google callback URI for each host:

- local: `http://localhost:3000/api/auth/callback/google`;
- production: `https://your-domain.example/api/auth/callback/google`.

The previously disclosed Google client secret must be rotated in Google Cloud before any real-provider verification. Update the ignored local environment without sharing its value and restart the application.

### Production host trust (`AUTH_TRUST_HOST`)

Auth.js v5 fails closed with `UntrustedHost` unless it trusts the request's host. `trustHost` is inferred automatically only when `NODE_ENV !== "production"`, or when `AUTH_URL`, `AUTH_TRUST_HOST`, `VERCEL`, or `CF_PAGES` is set (`node_modules/@auth/core/lib/utils/env.js`). A production deployment behind a reverse proxy or load balancer — one that is not Vercel or Cloudflare Pages — must therefore set `AUTH_TRUST_HOST=true` (or `AUTH_URL` to the externally visible origin) so Auth.js trusts the `Host`/`X-Forwarded-*` headers the proxy forwards. A missing `AUTH_TRUST_HOST` in that setup is a common cause of an OAuth callback failing with `UntrustedHost`.

## Real Google smoke

After rotating the disclosed client secret, verify manually with the real deployment configuration:

1. Start at `/login`, choose Google, and complete consent/MFA as required.
2. Confirm the exact registered callback completes and redirects to `/`.
3. Confirm the returned Header is authenticated and the Avatar menu shows the real mapped name/email, Profile link, and Logout action.
4. Open `/profile` and confirm only the documented safe fields appear.
5. Submit logout and confirm the local session cookie is removed, `/` renders the anonymous Header, and `/profile` is denied again.
6. On production HTTPS, confirm the expected secure cookie naming/flags and host behavior.
7. Restart the application and confirm the JWT session behavior expected for a stable deployment secret.

Do not report the real callback as verified based on synthetic E2E. Whenever authentication behavior changes, update this document and the corresponding E2E route, projection, redirect, and logout contracts in the same change.
