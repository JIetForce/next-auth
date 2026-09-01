# Authentication Architecture

## Canonical status

This document is the source of truth for application authentication. Every architectural statement, invariant, and operational rule in this document is cited to `file:line` in live code. A change to those files is a change to this document. When dated designs under `docs/superpowers/specs/` differ from this document, this file and the executable test suite describe the current contract.

The implementation is pinned to:
- Next.js 16.3.3 ([package.json:29](file:///Users/ruslan/repos/AI/anty/next-auth/package.json#L29))
- React 19.2.8 ([package.json:33](file:///Users/ruslan/repos/AI/anty/next-auth/package.json#L33))
- Better Auth 1.7.2 ([package.json:25](file:///Users/ruslan/repos/AI/anty/next-auth/package.json#L25))
- Prisma 7.10.0 ([package.json:23](file:///Users/ruslan/repos/AI/anty/next-auth/package.json#L23))

---

## Core Architecture and Stack

The authentication system is built on **Better Auth 1.7.2** ([package.json:25](file:///Users/ruslan/repos/AI/anty/next-auth/package.json#L25)) integrated with **Prisma 7.10.0** ([package.json:23](file:///Users/ruslan/repos/AI/anty/next-auth/package.json#L23)) over **PostgreSQL** ([prisma/schema.prisma:10](file:///Users/ruslan/repos/AI/anty/next-auth/prisma/schema.prisma#L10)):

1. **Database Adapter:** Better Auth is configured in [src/auth.ts:41-136](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L41-L136) using `prismaAdapter(prisma, { provider: "postgresql" })` ([src/auth.ts:44](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L44)). Database access uses the singleton Prisma client in [src/lib/db.ts:31](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/db.ts#L31), backed by connection pooling via `pg.Pool` and `@vercel/functions` `attachDatabasePool` ([src/lib/db.ts:25-26](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/db.ts#L25-L26)).
2. **Database-Backed Sessions:** Sessions are stored as individual records in the `session` table ([prisma/schema.prisma:28-43](file:///Users/ruslan/repos/AI/anty/next-auth/prisma/schema.prisma#L28-L43)). This application does not use stateless encrypted JWT cookies, does not run Auth.js / NextAuth, and does not operate without a database adapter.
3. **API Route Handler:** Better Auth is mounted at `src/app/api/auth/[...all]/route.ts` ([src/app/api/auth/[...all]/route.ts:6](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/api/auth/%5B...all%5D/route.ts#L6)) using `toNextJsHandler(auth)`. The obsolete NextAuth path `[...nextauth]` is not used.
4. **Base URL and Origins:** The public application URL is resolved through `getPublicBaseUrl()` ([src/lib/auth/environment.ts:33-50](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/environment.ts#L33-L50)), which prioritizes explicit `BETTER_AUTH_URL`, then Vercel production/preview variables, falling back to `http://localhost:3000`. Better Auth's `trustedOrigins` ([src/auth.ts:22-25](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L22-L25)) registers both the primary origin and dynamic preview origins for CSRF validation.
5. **Next.js Cookie Bridge:** The `nextCookies()` plugin is registered as the final plugin in [src/auth.ts:135](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L135) to manage cookie setting and flushing in Next.js Server Actions and Route Handlers.

---

## Invariants

- **Dual Authentication Providers:** Users can authenticate via Credentials (email and password) or Google OAuth ([src/auth.ts:32-39,72-97](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L32-L39)).
- **Database Sessions in PostgreSQL:** Sessions exist as database rows in `session` ([prisma/schema.prisma:28-43](file:///Users/ruslan/repos/AI/anty/next-auth/prisma/schema.prisma#L28-L43)), with foreign key cascade deletion on user removal ([prisma/schema.prisma:37](file:///Users/ruslan/repos/AI/anty/next-auth/prisma/schema.prisma#L37)).
- **Account Linking Requires Verified Local Email:** Google OAuth accounts link automatically to existing users only when `requireLocalEmailVerified: true` is satisfied ([src/auth.ts:128-132](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L128-L132)), preventing account takeover via unverified email pre-registration.
- **Server Actions as Exclusive Mutation Ingress:** Better Auth's raw credential HTTP endpoints are disabled with 404 via `disabledPaths` ([src/auth.ts:52-60](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L52-L60)). All mutation flows must enter through Server Actions.
- **Direct Client SDK Calls Prohibited:** Direct browser calls via `better-auth/client` will 404 until a path is intentionally unblocked from `disabledPaths`.
- **Server/Client Separation & Minimal `Viewer` DTO:** Client Components receive only the minimal, typed `Viewer` DTO (`{ id, name, email, image, emailVerified }`, [src/lib/auth/types.ts:1-7](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/types.ts#L1-L7)). Raw Better Auth session records, user rows, and tokens never enter the client module graph ([src/lib/auth/session.ts:22-31](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L22-L31)).
- **No Global Client Session State:** There is no global `SessionProvider`, `useSession()`, or client-side auth polling. The server Data Access Layer (`getCurrentViewer`, `requireCurrentViewer`) is the sole session source of truth ([src/lib/auth/session.ts:14-44](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L14-L44)).
- **Cache Components Integration:** The session DAL functions use `"use cache: private"` ([src/lib/auth/session.ts:15,39](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L15)), providing per-browser caching under Next.js Cache Components (`cacheComponents: true`, [next.config.ts:18](file:///Users/ruslan/repos/AI/anty/next-auth/next.config.ts#L18)).
- **Uniform Anti-Enumeration Responses:** Registration ([src/app/(auth)/register/actions.ts:14-16,68](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/actions.ts#L14-L16)), login ([src/app/(auth)/login/actions.ts:68-71](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L68-L71)), password reset ([src/app/(auth)/reset-password/actions.ts:18-20,55](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L18-L20)), and verification resend ([src/app/(auth)/verify-email/actions.ts:13-15,49](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/verify-email/actions.ts#L13-L15)) return identical responses regardless of whether the account exists or the operation succeeded.
- **Asynchronous Unawaited Email Dispatch:** Transactional emails in auth hooks are invoked without `await` (`void sendEmail(...)`, [src/auth.ts:83,111](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L83)) with catch blocks so transport failures do not crash processes or create timing side channels.
- **Central Session Revocation:** Password reset immediately revokes all active database sessions for the user (`revokeSessionsOnPasswordReset: true`, [src/auth.ts:79](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L79)).
- **Cookie Cache Propagation Window:** `session.cookieCache` with `maxAge: 300` ([src/auth.ts:101](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L101)) trades immediate revocation enforcement for reduced database queries: revoked sessions take up to 5 minutes to expire from browser caches.
- **Two-Tiered Rate Limiting:** Server Actions enforce atomic, serialized database limits with key prefix `action:` ([src/lib/auth/rate-limit.ts:30-84](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/rate-limit.ts#L30-L84)); link-following endpoints are protected by Better Auth's database router limiter ([src/auth.ts:61-71](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L61-L71)).
- **Self-Guarding Data Boundaries:** Every protected page (e.g. [src/app/(main)/profile/page.tsx:33](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28main%29/profile/page.tsx#L33)) and mutation calls `requireCurrentViewer()`. Header account menu visibility is UX presentation, not authorization.
- **E2E Isolation Guard:** Test database reset is strictly refused unless `TEST_DATABASE_URL` contains `"apptest"` ([e2e/global-setup.ts:21-25](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/global-setup.ts#L21-L25)). Tests seed real PostgreSQL database sessions via `testUtils()` ([e2e/helpers/auth-test-instance.ts:20-23](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/auth-test-instance.ts#L20-L23)).

---

## Providers and Account Linking

### Credentials Provider (Email & Password)
- **Configuration:** Configured under `emailAndPassword` in [src/auth.ts:72-97](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L72-L97).
- **Email Verification Mandate:** `requireEmailVerification: true` ([src/auth.ts:74](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L74)) and `autoSignIn: false` ([src/auth.ts:75](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L75)). Users cannot sign in until their email address is confirmed.
- **Password Length Rules:** Minimum length is 8 characters (`MIN_PASSWORD_LENGTH = 8`, [src/lib/auth/schemas.ts:10](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/schemas.ts#L10), [src/auth.ts:76](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L76)); maximum length is 128 characters ([src/auth.ts:77](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L77)).
- **Reset Token Expiry:** Password reset tokens expire after 3,600 seconds (1 hour) ([src/auth.ts:78](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L78)).
- **Session Revocation on Reset:** `revokeSessionsOnPasswordReset: true` ([src/auth.ts:79](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L79)) purges all existing database sessions when a user resets their password.

### Google OAuth Provider
- **Conditional Registration:** Google OAuth is registered in [src/auth.ts:32-39](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L32-L39) only when `isGoogleAuthConfigured()` evaluates to `true` ([src/lib/auth/environment.ts:16-23](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/environment.ts#L16-L23)), which requires both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- **Graceful Degradation:** When Google credentials are unconfigured, `socialProviders` is empty (`{}`). The login page renders an informative status alert ([src/app/(auth)/login/page.tsx:71-83](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/page.tsx#L71-L83)), the Google button is rendered in a disabled state, and attempting to initiate OAuth redirects safely to `/login?error=configuration` ([src/app/(auth)/login/actions.ts:14-16](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L14-L16)).

### Account Linking
- **Configuration:** Managed under `account.accountLinking` ([src/auth.ts:127-133](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L127-L133)).
- **Trusted Providers:** Restricted exclusively to Google (`trustedProviders: ["google"]`, [src/auth.ts:130](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L130)).
- **Local Verification Requirement:** `requireLocalEmailVerified: true` ([src/auth.ts:131](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L131)). If a user signs up with email and password but does not verify their email, a subsequent Google sign-in with the same email will refuse to link to that account, preventing account takeover by third parties who register victim email addresses.
- **Database Model:** Linked accounts reside in the `account` table ([prisma/schema.prisma:45-65](file:///Users/ruslan/repos/AI/anty/next-auth/prisma/schema.prisma#L45-L65)) with a unique constraint on `[issuer, accountId]` ([prisma/schema.prisma:62](file:///Users/ruslan/repos/AI/anty/next-auth/prisma/schema.prisma#L62)).
- **Profile Presentation:** Active provider types are queried via `getLinkedAccountProviderLabels(viewer.id)` ([src/lib/auth/accounts.ts:17-30](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/accounts.ts#L17-L30)) and displayed on `/profile` ([src/app/(main)/profile/page.tsx:37-39](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28main%29/profile/page.tsx#L37-L39)).

---

## Route Surface and the `disabledPaths` Security Invariant

The Better Auth API handler is mounted in Next.js via:
```ts
// src/app/api/auth/[...all]/route.ts:6
export const { GET, POST } = toNextJsHandler(auth);
```

### The `disabledPaths` Invariant
Better Auth provides default REST HTTP routes for credential authentication. In this application, all credential flows must execute through Next.js Server Actions. Better Auth's raw credential HTTP endpoints are disabled in [src/auth.ts:52-60](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L52-L60):

```ts
// src/auth.ts:52-60
disabledPaths: [
  "/sign-in/email",
  "/sign-up/email",
  "/sign-in/social",
  "/request-password-reset",
  "/reset-password",
  "/send-verification-email",
  "/sign-out",
],
```

### Rationale and Security Architecture
1. **Rate Limiting Bypass Prevention:** Better Auth's built-in rate limiter executes exclusively inside the router's `onRequest` hook (`node_modules/better-auth/dist/api/index.mjs:168`), which only processes traffic hitting `auth.handler` via `/api/auth/[...all]`. Server Actions call `auth.api.*` directly (e.g. `auth.api.signInEmail`), bypassing `onRequest`. If the raw HTTP endpoints remained open, an attacker could bypass Server Action per-action rate limiters by targeting the raw HTTP endpoints. Disabling these endpoints leaves Server Actions as the single door.
2. **Client SDK Behavior:** Direct calls from the browser via the `better-auth/client` SDK to any disabled route return an HTTP `404 Not Found`. Client-side authentication logic must invoke the application's Server Actions.
3. **Allowed Link-Following Endpoints:** Only endpoints visited directly by users via link navigation remain open:
   - `GET /callback/*` (Google OAuth redirect callback)
   - `GET /verify-email` (Emailed email verification link)
   - `GET /reset-password/*` (Emailed password reset link, which redirects to `/reset-password?token=...`)
4. **Router Rate Limiting:** The allowed link-following endpoints are protected at the router level with database-backed rate limiting ([src/auth.ts:61-71](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L61-L71)): 20 requests/minute on OAuth callbacks, and 20 requests/hour on email verification and password reset token redemption.

---

## Authentication Flows

```
                                  AUTHENTICATION FLOW ARCHITECTURE

       [ Browser / Client ]
                │
                ├───────────────────────────────────────┬───────────────────────────────────────┐
                ▼                                       ▼                                       ▼
        [ Link Navigation ]                      [ Server Actions ]                     [ HTTP Disabled ]
     GET /api/auth/callback/google             POST via form submission             POST /api/auth/sign-in/*
     GET /api/auth/verify-email               (Next.js Origin Validation)          POST /api/auth/sign-up/*
     GET /api/auth/reset-password/:token                │                           (Returns 404 via
                │                                       ▼                           disabledPaths)
                │                             [ Rate Limiting: Action ]
                │                             Key: action:<action>:<ip|email>
                │                             Table: rateLimit (SELECT FOR UPDATE)
                │                                       │
                ▼                                       ▼
     [ Rate Limiting: Router ]                 [ Better Auth Internal API ]
     Better Auth onRequest hook                auth.api.signInEmail
     Table: rateLimit                          auth.api.signUpEmail
                │                              auth.api.requestPasswordReset
                │                              auth.api.resetPassword
                │                              auth.api.signOut
                │                                       │
                └───────────────────┬───────────────────┘
                                    ▼
                         [ PostgreSQL Database ]
                         User / Session / Account
                         Verification / RateLimit
```

### 1. Registration (`/register`)
- **Page & UI:** [src/app/(auth)/register/page.tsx](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/page.tsx) and [src/app/(auth)/register/_components/register-form.tsx](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/_components/register-form.tsx). If an authenticated session exists, the page immediately redirects to `/` ([src/app/(auth)/register/page.tsx:28-29](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/page.tsx#L28-L29)).
- **Server Action:** `registerAction` in [src/app/(auth)/register/actions.ts:18-72](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/actions.ts#L18-L72).
- **Validation:** Validated against `registerSchema` ([src/lib/auth/schemas.ts:25-37](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/schemas.ts#L25-L37)). Requires non-empty name, valid email, minimum 8-character password, and exact password confirmation match.
- **Rate Limits:** 10 attempts/hour per IP (`register:ip:${ip}`), 3 attempts/hour per email (`register:email:${email}`) ([src/app/(auth)/register/actions.ts:24,59](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/actions.ts#L24)).
- **Execution:** Calls `auth.api.signUpEmail({ body: { name, email, password, callbackURL: "/login" } })` ([src/app/(auth)/register/actions.ts:64-66](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/actions.ts#L64-L66)). Better Auth creates the user row with `emailVerified: false` and invokes `sendVerificationEmail` ([src/auth.ts:106-124](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L106-L124)).
- **Anti-Enumeration:** If sign-up fails (e.g., duplicate email), a uniform generic error is returned: `"Could not complete sign-up. Check your details and try again."` ([src/app/(auth)/register/actions.ts:14-16,68](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/actions.ts#L14-L16)).
- **Redirect:** On success, redirects to `/verify-email` ([src/app/(auth)/register/actions.ts:71](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/actions.ts#L71)).

### 2. Email Verification (`/verify-email`)
- **Page & UI:** [src/app/(auth)/verify-email/page.tsx](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/verify-email/page.tsx) and [src/app/(auth)/verify-email/_components/resend-form.tsx](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/verify-email/_components/resend-form.tsx).
- **Token Redemption:** The user opens the emailed link pointing to `GET /api/auth/verify-email?token=...`. Better Auth validates the token against the `verification` table ([prisma/schema.prisma:67-78](file:///Users/ruslan/repos/AI/anty/next-auth/prisma/schema.prisma#L67-L78)), sets `User.emailVerified = true`, and redirects to `callbackURL: "/login"` ([src/auth.ts:105](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L105)).
- **Resend Action:** `resendVerificationAction` in [src/app/(auth)/verify-email/actions.ts:17-50](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/verify-email/actions.ts#L17-L50).
- **Rate Limits:** 10 requests/hour per IP (`resend:ip:${ip}`), 3 requests/hour per email (`resend:email:${email}`) ([src/app/(auth)/verify-email/actions.ts:23,37](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/verify-email/actions.ts#L23)).
- **Anti-Enumeration:** Swallows failures and always returns: `"If that address needs confirming, a new message is on its way."` ([src/app/(auth)/verify-email/actions.ts:13-15,49](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/verify-email/actions.ts#L13-L15)).

### 3. Sign In (`/login`)
- **Page & UI:** [src/app/(auth)/login/page.tsx](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/page.tsx). Authenticated users are redirected to `/` ([src/app/(auth)/login/page.tsx:47-48](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/page.tsx#L47-L48)).
- **Credentials Action:** `signInWithCredentials` in [src/app/(auth)/login/actions.ts:38-75](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L38-L75).
- **Rate Limits:** 20 attempts/15 min per IP (`signin:ip:${ip}`), 5 attempts/15 min per email (`signin:email:${email}`) ([src/app/(auth)/login/actions.ts:44,59](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L44)).
- **Execution:** Calls `auth.api.signInEmail({ body: { email, password } })` ([src/app/(auth)/login/actions.ts:64](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L64)). Creates a new record in `session` ([prisma/schema.prisma:28-43](file:///Users/ruslan/repos/AI/anty/next-auth/prisma/schema.prisma#L28-L43)) and sets signed session cookies.
- **Anti-Enumeration:** Incorrect password, non-existent user, and unverified email all return a single identical error: `"Could not sign in. Check your details, and confirm your email if you have not yet."` ([src/app/(auth)/login/actions.ts:68-71](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L68-L71)).
- **Redirect:** On success, redirects to `/` ([src/app/(auth)/login/actions.ts:74](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L74)).
- **Google OAuth Action:** `signInWithGoogle` in [src/app/(auth)/login/actions.ts:13-34](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L13-L34). Calls `auth.api.signInSocial({ body: { provider: "google", callbackURL: "/" } })` ([src/app/(auth)/login/actions.ts:21-23](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L21-L23)) and redirects the browser to Google's consent screen.

### 4. Password Reset (`/reset-password`)
- **Page & UI:** [src/app/(auth)/reset-password/page.tsx](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/page.tsx). Renders `ForgotPasswordForm` when no `token` query param is present; renders `ResetPasswordForm` when `token` is supplied ([src/app/(auth)/reset-password/page.tsx:34-71](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/page.tsx#L34-L71)).
- **Request Action:** `requestPasswordResetAction` in [src/app/(auth)/reset-password/actions.ts:22-56](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L22-L56).
- **Request Rate Limits:** 10 requests/hour per IP (`request-reset:ip:${ip}`), 3 requests/hour per email (`request-reset:email:${email}`) ([src/app/(auth)/reset-password/actions.ts:27,42](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L27)).
- **Anti-Enumeration:** Calls `auth.api.requestPasswordReset({ body: { email, redirectTo: "/reset-password" } })` ([src/app/(auth)/reset-password/actions.ts:48-50](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L48-L50)), swallows errors, and always returns: `"If that address is registered, a reset link is on its way."` ([src/app/(auth)/reset-password/actions.ts:18-20,55](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L18-L20)).
- **Email Delivery:** Better Auth generates a reset token in the `verification` table and triggers `sendResetPassword` ([src/auth.ts:80-96](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L80-L96)) without `await`.
- **Reset Execution Action:** `resetPasswordAction` in [src/app/(auth)/reset-password/actions.ts:64-99](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L64-L99).
- **Reset Rate Limit:** Rate-limited strictly by IP (10 requests/hour via `reset-password:ip:${ip}`, [src/app/(auth)/reset-password/actions.ts:72-74](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L72-L74)). The token is never used as a rate-limit key.
- **Execution & Revocation:** Calls `auth.api.resetPassword({ body: { newPassword: password, token } })` ([src/app/(auth)/reset-password/actions.ts:93](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L93)). Updates the password hash in the `account` table, purges all active user sessions from `session` via `revokeSessionsOnPasswordReset: true` ([src/auth.ts:79](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L79)), and redirects to `/login` ([src/app/(auth)/reset-password/actions.ts:98](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L98)).

### 5. Sign Out
- **Server Action:** `signOutAction` in [src/lib/auth/actions.ts:10-17](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/actions.ts#L10-L17).
- **Trigger:** Submitted via POST forms from `UserMenu` ([src/components/user-menu.tsx:64](file:///Users/ruslan/repos/AI/anty/next-auth/src/components/user-menu.tsx#L64)) and `ProfilePage` ([src/app/(main)/profile/page.tsx:83-85](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28main%29/profile/page.tsx#L83-L85)). No GET logouts are permitted.
- **Execution:** Reads headers and invokes `auth.api.signOut({ headers: await headers() })` ([src/lib/auth/actions.ts:14](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/actions.ts#L14)). Deletes the current session row in PostgreSQL and clears session cookies.
- **Redirect:** Redirects to `/` ([src/lib/auth/actions.ts:16](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/actions.ts#L16)).

---

## Transactional Email Dispatch

Transactional email delivery is handled through [src/lib/email/client.ts](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts):

1. **Test & Development Capture:** If `EMAIL_CAPTURE_FILE` is configured ([src/lib/email/client.ts:41-46](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L41-L46)), messages are appended as JSON lines to a local file (e.g. `.next/mail.log`, [e2e/global-setup.ts:10](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/global-setup.ts#L10)) without initiating SMTP connections. E2E tests poll this file via [e2e/helpers/mail.ts:33-52](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/mail.ts#L33-L52).
2. **Production SMTP Delivery:** When `EMAIL_CAPTURE_FILE` is unset, `createTransport()` ([src/lib/email/client.ts:20-38](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L20-L38)) constructs a Nodemailer transport using `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD`. Port 465 forces implicit TLS (`secure: true`); port 587 uses STARTTLS ([src/lib/email/client.ts:35](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L35)). Outgoing messages require `EMAIL_FROM` ([src/lib/email/client.ts:48-52](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L48-L52)).
3. **Non-Blocking Security Invariant:** To prevent response timing differences from revealing whether an email exists, `sendResetPassword` ([src/auth.ts:80-96](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L80-L96)) and `sendVerificationEmail` ([src/auth.ts:106-124](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L106-L124)) dispatch emails via `void sendEmail(...)` without awaiting completion. Unhandled promise rejections are prevented via explicit `.catch(...)` logging blocks ([src/auth.ts:93-95,121-123](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L93-L95)).

---

## Rate Limiting Architecture

Rate limiting implements multi-layered defence in depth:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RATE LIMITING ARCHITECTURE                      │
├───────────────────────────────────┬────────────────────────────────────┤
│       Server Action Limiter       │     Better Auth Router Limiter     │
├───────────────────────────────────┼────────────────────────────────────┤
│ Entry: Next.js Server Actions     │ Entry: /api/auth/[...all] routes   │
│ Scope: Credentials & mutations    │ Scope: Link-following endpoints   │
│ Method: consumeRateLimit()        │ Method: onRequestRateLimit() hook  │
│ Table: rateLimit                  │ Table: rateLimit                   │
│ Key Prefix: action:<key>          │ Key Prefix: none (internal)        │
│ Concurrency: SELECT FOR UPDATE    │ Concurrency: Better Auth internal  │
│ Failure Mode: Fails closed        │ Failure Mode: Fails closed         │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 1. The Server Action Limiter (`consumeRateLimit`)
- **Module:** [src/lib/auth/rate-limit.ts:30-84](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/rate-limit.ts#L30-L84).
- **Storage:** Persisted in PostgreSQL via Prisma using the `rateLimit` model ([prisma/schema.prisma:80-88](file:///Users/ruslan/repos/AI/anty/next-auth/prisma/schema.prisma#L80-L88)).
- **Namespace Isolation:** All action keys are prefixed with `action:` ([src/lib/auth/rate-limit.ts:35](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/rate-limit.ts#L35)) to avoid collision with Better Auth router keys in the same table.
- **Concurrency & Atomicity:** Execution runs inside `prisma.$transaction` using an explicit `SELECT ... FOR UPDATE` row lock ([src/lib/auth/rate-limit.ts:41-43](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/rate-limit.ts#L41-L43)). Concurrent requests for the same key serialize on the row lock, preventing race conditions.
- **Fail Closed Design:** If database communication fails, `consumeRateLimit` catches the error, logs it, and returns `false` ([src/lib/auth/rate-limit.ts:78-83](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/rate-limit.ts#L78-L83)).
- **Client IP Resolution:** [src/lib/auth/client-ip.ts:25-31](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/client-ip.ts#L25-L31) extracts client IP by reading `x-real-ip` first, falling back to the first entry in `x-forwarded-for`, and defaulting to `"unknown"`. It intentionally avoids `@vercel/functions` `ipAddress()` due to Next.js `HeadersAdapter` proxy incompatibility.

### 2. Configured Action Limits
- `signin:ip:${ip}`: 20 requests per 15 minutes ([src/app/(auth)/login/actions.ts:44](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L44))
- `signin:email:${email}`: 5 requests per 15 minutes ([src/app/(auth)/login/actions.ts:59](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/login/actions.ts#L59))
- `register:ip:${ip}`: 10 requests per 1 hour ([src/app/(auth)/register/actions.ts:24](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/actions.ts#L24))
- `register:email:${email}`: 3 requests per 1 hour ([src/app/(auth)/register/actions.ts:59](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/register/actions.ts#L59))
- `request-reset:ip:${ip}`: 10 requests per 1 hour ([src/app/(auth)/reset-password/actions.ts:27](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L27))
- `request-reset:email:${email}`: 3 requests per 1 hour ([src/app/(auth)/reset-password/actions.ts:42](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L42))
- `reset-password:ip:${ip}`: 10 requests per 1 hour ([src/app/(auth)/reset-password/actions.ts:72-74](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/reset-password/actions.ts#L72-L74))
- `resend:ip:${ip}`: 10 requests per 1 hour ([src/app/(auth)/verify-email/actions.ts:23](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/verify-email/actions.ts#L23))
- `resend:email:${email}`: 3 requests per 1 hour ([src/app/(auth)/verify-email/actions.ts:37](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28auth%29/verify-email/actions.ts#L37))

### 3. Database Maintenance Cron
Unchecked rate-limit records would grow indefinitely. The maintenance route `GET /api/cron/cleanup` ([src/app/api/cron/cleanup/route.ts:1-53](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/api/cron/cleanup/route.ts#L1-L53)) requires `Authorization: Bearer <CRON_SECRET>` ([src/app/api/cron/cleanup/route.ts:28](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/api/cron/cleanup/route.ts#L28)) and deletes expired sessions, expired verifications, and rate limit rows older than 1 hour ([src/app/api/cron/cleanup/route.ts:35-41](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/api/cron/cleanup/route.ts#L35-L41)).

---

## Session Revocation and Cookie Cache Trade-off

### Correction of Legacy Documentation
Previous versions of this documentation asserted that this application used stateless encrypted JWT cookie sessions without a database adapter and had no central session revocation mechanism. That claim was incorrect:
1. **Sessions are PostgreSQL rows:** Every session is an explicit record in the `session` table ([prisma/schema.prisma:28-43](file:///Users/ruslan/repos/AI/anty/next-auth/prisma/schema.prisma#L28-L43)).
2. **Revocation is natively supported:** Deleting a row from `session` terminates that session immediately in the database.
3. **Password reset auto-revocation:** Better Auth's `revokeSessionsOnPasswordReset: true` ([src/auth.ts:79](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L79)) automatically deletes all session rows for a user upon password reset.

### The Cookie Cache Performance Trade-off
To prevent every request and page render from executing a synchronous database `SELECT` against the `session` table, Better Auth's session cookie cache is enabled:

```ts
// src/auth.ts:98-102
session: {
  cookieCache: { enabled: true, maxAge: 300 },
},
```

- **Benefit:** Valid session state is cached in a signed cookie for up to 300 seconds (5 minutes), drastically reducing database traffic on authenticated routes.
- **Architectural Trade-off:** Revoking a session (via database deletion or password reset) takes effect across client browsers with a **propagation delay of up to 5 minutes** (`maxAge: 300`). Until the cookie cache expires or the browser is closed, the client cookie validates successfully without hitting PostgreSQL. This window is an intentional performance design decision.

---

## Session and Authorization Boundary (DAL and `Viewer` DTO)

### The `Viewer` Data Transfer Object
Client components and templates never interact with the raw Better Auth session object. All identity data is projected into the immutable `Viewer` DTO:

```ts
// src/lib/auth/types.ts:1-7
export type Viewer = Readonly<{
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: boolean;
}>;
```

`Viewer.id` is included solely for server-side ownership verification (e.g. `resource.userId === viewer.id`) without requiring extra database queries ([src/lib/auth/session.ts:23-26](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L23-L26)).

### Server-Only Data Access Layer (`src/lib/auth/session.ts`)
- **Enforcement:** Enforces `import "server-only"` ([src/lib/auth/session.ts:2](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L2)).
- **`getCurrentViewer()`:** Marked with `"use cache: private"` ([src/lib/auth/session.ts:15](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L15)) for per-browser caching under Cache Components. Verifies configuration via `isAuthSessionConfigured()` ([src/lib/auth/session.ts:17](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L17)), retrieves session through `auth.api.getSession({ headers: await headers() })` ([src/lib/auth/session.ts:19](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L19)), and maps properties into the `Viewer` DTO ([src/lib/auth/session.ts:22-31](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L22-L31)).
- **`requireCurrentViewer()`:** Also marked with `"use cache: private"` ([src/lib/auth/session.ts:39](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L39)). Calls `getCurrentViewer()`; if `null`, executes a fixed Next.js `redirect("/login")` ([src/lib/auth/session.ts:42](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/session.ts#L42)).

### Header and Profile UI Boundaries
- **Streaming Header Shell:** `Header` ([src/components/header.tsx:18-61](file:///Users/ruslan/repos/AI/anty/next-auth/src/components/header.tsx#L18-L61)) renders navigation and brand synchronously. The account slot `HeaderAccount` is wrapped in a `<Suspense>` boundary with a `<Skeleton className="h-8 w-20" />` fallback ([src/components/header.tsx:49-53](file:///Users/ruslan/repos/AI/anty/next-auth/src/components/header.tsx#L49-L53)).
- **`HeaderAccount`:** Async Server Component ([src/components/header-account.tsx:5-13](file:///Users/ruslan/repos/AI/anty/next-auth/src/components/header-account.tsx#L5-L13)) that evaluates `getCurrentViewer()`. Renders `SignInLink` for unauthenticated visitors or `UserMenu` ([src/components/user-menu.tsx:38-72](file:///Users/ruslan/repos/AI/anty/next-auth/src/components/user-menu.tsx#L38-L72)) for authenticated users.
- **Avatar Rendering:** `UserAvatar` ([src/components/user-avatar.tsx:36-55](file:///Users/ruslan/repos/AI/anty/next-auth/src/components/user-avatar.tsx#L36-L55)) displays the remote image with `referrerPolicy="no-referrer"` and decorative `alt=""` ([src/components/user-avatar.tsx:48-49](file:///Users/ruslan/repos/AI/anty/next-auth/src/components/user-avatar.tsx#L48-L49)), falling back to deterministic initials generated by `getViewerInitials` ([src/components/user-avatar.tsx:22-34](file:///Users/ruslan/repos/AI/anty/next-auth/src/components/user-avatar.tsx#L22-L34)).
- **Protected Profile Page:** [src/app/(main)/profile/page.tsx](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28main%29/profile/page.tsx) guards execution via `await requireCurrentViewer()` ([src/app/(main)/profile/page.tsx:33](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28main%29/profile/page.tsx#L33)). It displays name, email, and linked providers ([src/app/(main)/profile/page.tsx:37-39](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28main%29/profile/page.tsx#L37-L39)), sets `robots: { index: false, follow: false }` ([src/app/(main)/profile/page.tsx:20-23](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28main%29/profile/page.tsx#L20-L23)), and exports `instant = false` ([src/app/(main)/profile/page.tsx:30](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/%28main%29/profile/page.tsx#L30)) while the page-level session read awaits refactoring behind a Suspense boundary.

---

## File Ownership

| File Path | Responsibility |
| --- | --- |
| `src/auth.ts` | Single Better Auth instance, Prisma adapter configuration, provider definitions, hooks, `disabledPaths`, router rate limits, and cookie plugins. |
| `src/app/api/auth/[...all]/route.ts` | Re-exports Better Auth HTTP `GET` and `POST` handlers via `toNextJsHandler(auth)`. |
| `src/app/api/cron/cleanup/route.ts` | Authenticated maintenance endpoint pruning expired sessions, verification tokens, and stale rate limit rows. |
| `src/lib/db.ts` | Prisma client singleton with connection pooling (`pg.Pool`) and serverless suspension management (`attachDatabasePool`). |
| `src/lib/auth/types.ts` | Client-safe immutable `Viewer` DTO interface. |
| `src/lib/auth/session.ts` | Server-only Data Access Layer: `getCurrentViewer` and `requireCurrentViewer` with `"use cache: private"`. |
| `src/lib/auth/environment.ts` | Auth readiness validation (`isAuthSessionConfigured`, `isGoogleAuthConfigured`) and `getPublicBaseUrl()`. |
| `src/lib/auth/rate-limit.ts` | Atomic, transactional database rate limiter for Server Actions (`consumeRateLimit`). |
| `src/lib/auth/client-ip.ts` | Safe client IP extraction handling proxy chains and avoiding Next.js `HeadersAdapter` bugs. |
| `src/lib/auth/schemas.ts` | Zod validation schemas and shared constraints (`MIN_PASSWORD_LENGTH = 8`). |
| `src/lib/auth/accounts.ts` | Queries user linked account providers (`getLinkedAccountProviderLabels`). |
| `src/lib/auth/actions.ts` | Server Action for user logout (`signOutAction`). |
| `src/lib/email/client.ts` | Transactional email dispatcher supporting Nodemailer SMTP and local file capture. |
| `src/app/(auth)/layout.tsx` | Visual layout shell for authentication views with shared ambient background. |
| `src/app/(auth)/login/actions.ts` | Server Actions for credentials login and Google OAuth initiation. |
| `src/app/(auth)/login/page.tsx` | Login route: existing session redirects, configuration warnings, credentials and OAuth forms. |
| `src/app/(auth)/register/actions.ts` | Server Action for user account registration. |
| `src/app/(auth)/register/page.tsx` | Registration route. |
| `src/app/(auth)/verify-email/actions.ts` | Server Action for resending email confirmation links. |
| `src/app/(auth)/verify-email/page.tsx` | Verification instructions and resend view. |
| `src/app/(auth)/reset-password/actions.ts` | Server Actions for requesting password reset and submitting new passwords. |
| `src/app/(auth)/reset-password/page.tsx` | Password recovery request and token submission view. |
| `src/app/(main)/profile/page.tsx` | Authenticated profile view guarded by `requireCurrentViewer()`. |
| `src/components/header.tsx` | Header component with Suspense boundary around `HeaderAccount`. |
| `src/components/header-account.tsx` | Async component resolving `getCurrentViewer()` to render `SignInLink` or `UserMenu`. |
| `src/components/user-menu.tsx` | Client dropdown menu providing profile link and POST logout action. |
| `src/components/user-avatar.tsx` | Avatar display with deterministic initials fallback. |
| `prisma/schema.prisma` | PostgreSQL schema defining `User`, `Session`, `Account`, `Verification`, and `RateLimit`. |
| `prisma.config.ts` | Prisma CLI migration configuration using unpooled `DIRECT_URL` / `DATABASE_URL_UNPOOLED`. |
| `next.config.ts` | Cache Components configuration (`cacheComponents: true`) and response security headers. |
| `e2e/global-setup.ts` | Playwright global setup with test database name validation (`apptest`) and migration reset. |
| `e2e/helpers/auth-test-instance.ts` | Standalone Better Auth instance with `testUtils()` plugin for seeding test fixtures. |
| `e2e/helpers/auth-session.ts` | E2E helper (`addAuthenticatedSession`) seeding real database users, accounts, and session cookies. |
| `e2e/helpers/mail.ts` | E2E email helper polling `.next/mail.log` to extract verification and password reset links. |

---

## Testing Seam

### Local PostgreSQL and Real Database Sessions
E2E testing uses Playwright against a live local PostgreSQL instance. Auth tests do not mock session cookies or synthesize artificial tokens.

1. **Test-Database Guard:** [e2e/global-setup.ts:21-25](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/global-setup.ts#L21-L25) verifies that `TEST_DATABASE_URL` contains the substring `"apptest"` before executing `prisma migrate reset --force` ([e2e/global-setup.ts:27-34](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/global-setup.ts#L27-L34)). Any invocation targeting a production or development database is aborted immediately.
2. **Dedicated Test Instance:** [e2e/helpers/auth-test-instance.ts:20-23](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/auth-test-instance.ts#L20-L23) initializes a dedicated `testAuth` instance using `prismaAdapter` on `TEST_DATABASE_URL` with Better Auth's `testUtils()` plugin ([e2e/helpers/auth-test-instance.ts:4,22](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/auth-test-instance.ts#L4)).
3. **Session Seeding Helper:** `addAuthenticatedSession` ([e2e/helpers/auth-session.ts:91-105](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/auth-session.ts#L91-L105)) seeds a user via `ctx.test.createUser` and `saveUser` ([e2e/helpers/auth-session.ts:34-43](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/auth-session.ts#L34-L43)), ensures a credential account exists ([e2e/helpers/auth-session.ts:65-83](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/auth-session.ts#L65-L83)), generates valid signed session cookies via `ctx.test.getCookies` ([e2e/helpers/auth-session.ts:99-102](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/auth-session.ts#L99-L102)), and installs them into Playwright's `BrowserContext` ([e2e/helpers/auth-session.ts:104](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/auth-session.ts#L104)).
4. **Obsolete Auth.js Test Seams Removed:** Legacy patterns involving `next-auth/jwt` JWE encryption, `AUTH_SECRET` cookie signing, and synthetic `authjs.session-token` cookies have been eliminated.
5. **Captured Email Verification:** In E2E tests, emails are routed to `.next/mail.log` via `EMAIL_CAPTURE_FILE` ([src/lib/email/client.ts:41-46](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L41-L46), [e2e/global-setup.ts:10](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/global-setup.ts#L10)). Tests poll this file using `readLatestMessageTo` ([e2e/helpers/mail.ts:33-52](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/mail.ts#L33-L52)) to extract activation and reset URLs ([e2e/helpers/mail.ts:54-58](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/helpers/mail.ts#L54-L58)) without needing mock email servers.

---

## Threat Model and Prohibited Patterns

### Security Posture & Threat Mitigation
- **Brute Force & Rate Limit Evasion:** Disabled raw HTTP endpoints prevent attackers from targeting unthrottled API endpoints. Server Actions enforce atomic, serialized database rate limiting per IP and per identifier.
- **Account Enumeration:** Registration, login, password reset, and verification resend return identical responses for existing, non-existing, valid, and invalid accounts. Asynchronous, unawaited email dispatch eliminates response timing leaks.
- **Pre-Registration Account Takeover:** Account linking requires local email verification before an OAuth identity can attach to an existing user record (`requireLocalEmailVerified: true`, [src/auth.ts:131](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L131)).
- **Credential & Secret Exposure:** The `Viewer` DTO allowlist ensures tokens, session IDs, and password hashes are never serialized into HTML payloads or client bundles.
- **Clickjacking & Injection:** HTTP response headers declared in [next.config.ts:27-51](file:///Users/ruslan/repos/AI/anty/next-auth/next.config.ts#L27-L51) enforce `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a strict base Content Security Policy (`frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`).

### Prohibited Patterns
Do not introduce:
- Raw Better Auth session records, user database objects, or spread parameters (`...session.user`) across the Server/Client boundary.
- Global `SessionProvider`, `useSession()`, or client-side session polling.
- Direct browser calls using `better-auth/client` to credential routes while `disabledPaths` is active.
- Enabling HTTP mutation paths in `disabledPaths` without adding router-level rate limiting and CSRF protections.
- GET-based logout links, client router transitions for logout, or unauthenticated logout mutations.
- Synchronous or awaited `sendEmail` calls inside auth hooks or Server Actions.
- Non-uniform error messages on login, register, password reset, or verification actions that distinguish registered from unregistered accounts.
- Modifying `TEST_DATABASE_URL` validation to allow database names without `"apptest"`.
- Synthesizing mock JWT cookies in tests instead of seeding real database sessions through `testUtils()`.

---

## Environment Configuration and Secret Rotation

### Current Environment Variables

| Variable | Required In | Purpose | Defined / Used At |
| --- | --- | --- | --- |
| `BETTER_AUTH_SECRET` | Production, Dev, E2E | Cryptographic secret used by Better Auth to sign session cookies and tokens. | [src/lib/auth/environment.ts:11](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/environment.ts#L11), [e2e/global-setup.ts:13](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/global-setup.ts#L13) |
| `BETTER_AUTH_URL` | Optional (Production, Dev) | Public canonical base URL. If unset, inferred from Vercel deployment variables or defaults to `http://localhost:3000`. | [src/lib/auth/environment.ts:34](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/environment.ts#L34) |
| `GOOGLE_CLIENT_ID` | Production (Optional in Dev) | Google OAuth 2.0 client identifier. | [src/auth.ts:35](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L35), [src/lib/auth/environment.ts:5](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/environment.ts#L5) |
| `GOOGLE_CLIENT_SECRET` | Production (Optional in Dev) | Google OAuth 2.0 client secret. | [src/auth.ts:36](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L36), [src/lib/auth/environment.ts:6](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/environment.ts#L6) |
| `DATABASE_URL` | Production, Dev | Pooled PostgreSQL connection string used at runtime by Prisma. | [src/lib/db.ts:15](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/db.ts#L15), [src/lib/auth/environment.ts:12](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/auth/environment.ts#L12) |
| `DIRECT_URL` / `DATABASE_URL_UNPOOLED` | Production, Dev | Direct unpooled PostgreSQL connection string used for Prisma migrations. | [prisma.config.ts:10-12](file:///Users/ruslan/repos/AI/anty/next-auth/prisma.config.ts#L10-L12) |
| `SMTP_HOST` | Production (when emailing) | SMTP server hostname. | [src/lib/email/client.ts:21](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L21) |
| `SMTP_PORT` | Production (when emailing) | SMTP server port (`465` for TLS, `587` for STARTTLS). | [src/lib/email/client.ts:22,35](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L22) |
| `SMTP_USER` | Production (when emailing) | SMTP authentication username. | [src/lib/email/client.ts:28](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L28) |
| `SMTP_PASSWORD` | Production (when emailing) | SMTP authentication password. | [src/lib/email/client.ts:29](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L29) |
| `EMAIL_FROM` | Production (when emailing) | Default `From:` sender header for transactional emails. | [src/lib/email/client.ts:48](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L48) |
| `EMAIL_CAPTURE_FILE` | Local Dev, E2E | File path for logging outgoing emails instead of dispatching via SMTP. | [src/lib/email/client.ts:41](file:///Users/ruslan/repos/AI/anty/next-auth/src/lib/email/client.ts#L41), [e2e/global-setup.ts:10](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/global-setup.ts#L10) |
| `CRON_SECRET` | Production | Bearer token secret protecting the `GET /api/cron/cleanup` endpoint. | [src/app/api/cron/cleanup/route.ts:17,28](file:///Users/ruslan/repos/AI/anty/next-auth/src/app/api/cron/cleanup/route.ts#L17) |
| `NEXT_DEV_ALLOWED_ORIGIN` | Local Dev (optional) | Extra origin allowed for accessing the dev server from local network devices. | [next.config.ts:3,10](file:///Users/ruslan/repos/AI/anty/next-auth/next.config.ts#L3) |
| `TEST_DATABASE_URL` | E2E | Local PostgreSQL connection string for testing; must contain `"apptest"`. | [e2e/global-setup.ts:6-8,21](file:///Users/ruslan/repos/AI/anty/next-auth/e2e/global-setup.ts#L6-L8) |

### Obsolete Environment Variables
The following environment variables from the previous Auth.js stack are obsolete and must not be used:
- `AUTH_SECRET`: Superseded by `BETTER_AUTH_SECRET`.
- `AUTH_GOOGLE_ID`: Superseded by `GOOGLE_CLIENT_ID`.
- `AUTH_GOOGLE_SECRET`: Superseded by `GOOGLE_CLIENT_SECRET`.
- `AUTH_TRUST_HOST`: Obsolete. Better Auth performs origin verification via `baseURL` and `trustedOrigins` ([src/auth.ts:22-25,42-43](file:///Users/ruslan/repos/AI/anty/next-auth/src/auth.ts#L22-L25)).

### Secret Rotation Procedures
When rotating `BETTER_AUTH_SECRET`:
1. Update `BETTER_AUTH_SECRET` in environment settings and redeploy/restart the application.
2. Existing session cookies signed with the old secret will fail cryptographic verification. Better Auth treats them as invalid, clearing them without emitting legacy `jose` errors such as `no matching decryption secret`.
3. Affected users are redirected to `/login` to sign in again. There is no manual sign-out confirmation page to visit.
