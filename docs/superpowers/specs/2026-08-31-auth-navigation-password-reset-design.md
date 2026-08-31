# Auth route split, shared shell, and password reset

## Status

This is the next step of the auth work described in `docs/superpowers/specs/2026-08-30-better-auth-email-password-design.md`. It implements the remaining route structure and the stage-5 password recovery flow. The current code still renders `login`, `register`, and `verify-email` as tabs inside one `AuthCard`; this design replaces that with dedicated routes and adds `/reset-password`.

It builds directly on the completed work in `docs/superpowers/plans/2026-08-30-better-auth-registration.md` (stages 3–4). The password minimum is kept at 6 characters because `2026-08-31-reduce-min-password-length` intentionally changed it from 12 to 6; we do not re-litigate that decision here.

## Goals

- Replace the tabbed `AuthCard` with three dedicated routes:
  - `/login` — credentials sign-in and Google sign-in.
  - `/register` — email/password registration and Google sign-in.
  - `/verify-email` — "check your inbox" notice and resend-verification form.
- Keep the existing left-side showcase (project description, metrics, testimonial) identical across all auth routes. Only the right-hand form card changes.
- Add a self-service password reset flow:
  - `/reset-password` with no token shows an email request form.
  - `/reset-password?token=...` shows a form to set a new password.
- Update `auth.ts` to enable `sendResetPassword` with the same non-awaited email pattern used for `sendVerificationEmail`.
- Update E2E tests so they navigate to the new routes and no longer click tabs.
- Add an E2E test that registers, verifies, signs out, requests a reset, opens the captured reset link, sets a new password, and signs in with it.

## Non-goals

- No changes to the password minimum length, which remains 6. Updating it to 12 is a separate decision.
- No new email template files. `sendResetPassword` inlines the message, matching the existing `sendVerificationEmail` style.
- No new OAuth providers, 2FA, passkeys, organizations, or profile editing.
- No changes to the email transport (`src/lib/email/client.ts`) or the database schema.
- No changes to the `/api/auth/[...all]/route.ts` handler or the session boundary (`src/lib/auth/session.ts`, `Viewer` DTO).

## Fixed decisions

- **Shared shell.** The left column and ambient background move into `(auth)/layout.tsx` and `(auth)/_components/auth-showcase.tsx`. Each `(auth)` page renders only the right-hand card.
- **Card shell.** A shared server component `src/app/(auth)/_components/auth-card-shell.tsx` provides the card, badge, title, description, and footer terms. Pages pass the form-specific content as children.
- **Route names.** Password reset uses `/reset-password` for both the request view and the token view, with the token passed as a query parameter. This matches how Better Auth's `requestPasswordResetCallback` redirects (`callbackURL` + `?token=...`). This intentionally differs from the `2026-08-30-better-auth-email-password-design.md` sketch of `/reset-password/[token]`, which does not match the redirect behavior.
- **Better Auth server actions.** All auth calls go through Next.js Server Actions that call `auth.api.*` in-process:
  - `registerAction` uses `auth.api.signUpEmail` and then `redirect("/verify-email")`.
  - `signInWithCredentials` uses `auth.api.signInEmail`.
  - `resendVerificationAction` uses `auth.api.sendVerificationEmail`.
  - `requestPasswordResetAction` uses `auth.api.requestPasswordReset` with `redirectTo: "/reset-password"`.
  - `resetPasswordAction` uses `auth.api.resetPassword`.
- **Email transport pattern.** `sendResetPassword` in `auth.ts` must be non-blocking and must swallow transport errors, exactly like `sendVerificationEmail`, so response time does not leak whether an address exists.
- **Uniform responses.** `requestPasswordResetAction` always returns the same success message regardless of whether the address is registered or not, so the flow cannot be used to enumerate accounts.
- **Rate limiting.** `requestPasswordResetAction` uses `consumeRateLimit` for IP and email, matching the resend and registration actions.
- **Token validation.** Better Auth's `requestPasswordResetCallback` endpoint validates the token before the user reaches the `/reset-password?token=...` page. The `resetPasswordAction` validates the password rule and calls `auth.api.resetPassword`; invalid/expired tokens produce a generic error.
- **Session redirects.** All `/login`, `/register`, `/verify-email`, and `/reset-password` pages redirect to `/` when `getCurrentViewer()` returns a user.
- **Legacy query handling.** `/login?verify=true` (from the tab era) redirects to `/verify-email` so existing links and bookmarks do not break. `/login?error=...` continues to render the login form with the relevant error.

## Route and file structure

```text
src/app/(auth)/
  layout.tsx                                  # header + main grid + AuthShowcase on left
  _components/
    auth-showcase.tsx                         # left column content (server)
    auth-card-shell.tsx                       # shared right card wrapper (server)
  login/
    page.tsx                                  # /login
    actions.ts                                # signInWithCredentials, signInWithGoogle
    _components/
      credentials-form.tsx                    # email + password
      google-sign-in-form.tsx                 # Google form wrapper
      google-sign-in-button.tsx               # button
  register/
    page.tsx                                  # /register (no longer redirects)
    actions.ts                                # registerAction
    _components/
      register-form.tsx                       # registration form
  verify-email/
    page.tsx                                  # /verify-email (no longer redirects)
    actions.ts                                # resendVerificationAction
    _components/
      resend-form.tsx                         # resend email form
  reset-password/
    page.tsx                                  # /reset-password or /reset-password?token=...
    actions.ts                                # requestPasswordResetAction, resetPasswordAction
    _components/
      forgot-password-form.tsx                # email request form
      reset-password-form.tsx                 # new password form
src/auth.ts                                   # add sendResetPassword + reset options
src/lib/auth/schemas.ts                       # add forgot + reset schemas

e2e/
  login.spec.ts                               # remove tab expectations, add forgot link test
  registration.spec.ts                        # use /register, expect /verify-email
  reset-password.spec.ts                      # new flow
```

Removed: `src/app/(auth)/login/_components/auth-card.tsx` (the tabbed card).

## Component design

### `AuthShowcase`

- Identical to the left column currently in `src/app/(auth)/login/page.tsx`.
- Moved to `src/app/(auth)/_components/auth-showcase.tsx`.
- Server component, no props.

### `AuthCardShell`

- Server component in `src/app/(auth)/_components/auth-card-shell.tsx`.
- Props: `badge`, `title`, `description`, `children`.
- Renders `Card`, `CardHeader` (badge, title, description), `CardContent` (`children`), `CardFooter` (terms/privacy links).
- No state, no tabs.

### Pages

Each page is an async Server Component that:

1. Calls `getCurrentViewer()` and redirects to `/` if the user is signed in.
2. Computes `configured = isGoogleAuthConfigured()` if it shows the Google button.
3. Handles route-specific `searchParams` (e.g. `error` on `/login`, `token` on `/reset-password`, `verify` legacy on `/login`).
4. Renders `AuthCardShell` with the appropriate form and links.

### Login page

- Badge: "Single Sign-On" with `Lock`.
- Title: "Welcome back".
- Description: "Sign in with your email or Google account to continue."
- Content:
  - Configuration and OAuth error alerts when `searchParams.error` is present.
  - `CredentialsForm`.
  - "Forgot your password?" link to `/reset-password`.
  - Separator "Secure Access".
  - `GoogleSignInForm`.
  - Security badges (TLS / OAuth).
  - "Don't have an account? Create one" link to `/register`.

### Register page

- Badge: "Get Started" with `Sparkles`.
- Title: "Create an account".
- Description: "Enter your details to create a new Agent Roster account."
- Content:
  - `RegisterForm`.
  - Separator "Or continue with".
  - `GoogleSignInForm`.
  - Security badges (TLS / Email Verification).
  - "Already have an account? Sign in" link to `/login`.

### Verify-email page

- Badge: "Email Confirmation" with `MailCheck`.
- Title: "Confirm your email".
- Description: "We sent a verification link to your email. Open it to finish creating your account."
- Content:
  - "Verification link sent" info box.
  - `ResendForm`.
  - Security badge (Secure Verification).
  - "Already confirmed? Sign in" link to `/login`.

### Reset-password page

- No token:
  - Badge: "Password Recovery" with `KeyRound`.
  - Title: "Reset your password".
  - Description: "Enter your email and we'll send you a reset link."
  - `ForgotPasswordForm`.
  - "Remember your password? Sign in" link to `/login`.
- With token:
  - Badge: "New password" with `Lock`.
  - Title: "Set a new password".
  - Description: "Enter a new password below."
  - `ResetPasswordForm` (new password, confirm, hidden token).
  - Security badge (Secure Reset).
  - "Back to sign in" link to `/login`.

## Server actions

### `requestPasswordResetAction`

```ts
"use server";

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
```

### `resetPasswordAction`

```ts
"use server";

import { auth } from "@/auth";

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

Both actions are in `src/app/(auth)/reset-password/actions.ts`.

## `auth.ts` changes

Add to `emailAndPassword`:

```ts
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  autoSignIn: false,
  minPasswordLength: 6,
  maxPasswordLength: 128,
  resetPasswordTokenExpiresIn: 3600,
  revokeSessionsOnPasswordReset: true,
  sendResetPassword: async ({ user, url, token }) => {
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

`nextCookies()` must stay last in `plugins`.

## Redirect and state matrix

| State or action                                                             | Result                                             |
| --------------------------------------------------------------------------- | -------------------------------------------------- |
| Anonymous `GET /login`, `/register`, `/verify-email`, `/reset-password`     | Renders the route's form                           |
| Authenticated `GET /login`, `/register`, `/verify-email`, `/reset-password` | Redirect to `/`                                    |
| Anonymous `GET /`                                                           | `200`; header shows Sign in                        |
| Anonymous `GET /profile`                                                    | Redirect to `/login`                               |
| Registration submitted                                                      | Redirect to `/verify-email`; no session            |
| Sign-in before verification                                                 | Refused; prompt to verify with resend control      |
| `/login?verify=true`                                                        | Redirect to `/verify-email`                        |
| `/login?error=...`                                                          | Render login form with the matching alert          |
| Reset link clicked                                                          | `/reset-password?token=...` after token validation |
| Reset submitted successfully                                                | Redirect to `/login`                               |

## Security properties

- **Enumeration resistance.** `requestPasswordResetAction` returns the same message and HTTP status whether the address is registered or not. The UI never distinguishes the two.
- **Rate limiting.** `requestPasswordResetAction` is rate-limited per IP and per email.
- **Token lifetime.** `resetPasswordTokenExpiresIn: 3600` means reset links expire after one hour.
- **Session revocation.** `revokeSessionsOnPasswordReset: true` invalidates all other sessions when the password is changed.
- **Timing safety.** `sendResetPassword` does not await `sendEmail`, exactly like `sendVerificationEmail`, so a transport failure does not reveal whether the address exists.
- **Origin check.** Better Auth's `requestPasswordReset` uses `originCheck` on `redirectTo`, so the callback URL must match the application origin.

## Verification

- `npm run build` must pass.
- `npm run lint` must pass.
- `npm run test` (Playwright E2E) must pass, including:
  - `e2e/login.spec.ts` (heading, Google button, theme toggle, client-side validation, no horizontal overflow).
  - `e2e/registration.spec.ts` (register, verify, sign in, validation errors, duplicate address).
  - `e2e/reset-password.spec.ts` (forgot link, reset, sign in with new password).
