# Email/Password Registration Implementation Plan (Stages 3–4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A visitor enters an email and a password, receives a message, clicks the link to confirm the address, and can then sign in.

**Architecture:** Better Auth owns the whole flow; the application supplies only a transport and four screens. `emailAndPassword` with `requireEmailVerification: true` and `autoSignIn: false` means sign-up creates no session, so an unconfirmed address cannot sign in. Server Actions call `auth.api.*` in-process, which bypasses Better Auth's built-in rate limiter, so each action guards itself.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, Better Auth 1.7.2, Prisma 7.10.0, nodemailer, Mailpit.

**Spec:** `docs/superpowers/specs/2026-08-30-better-auth-email-password-design.md`

**Prerequisite:** Tasks 1–8 of `docs/superpowers/plans/2026-08-30-better-auth-migration.md` are complete and committed. Task numbering continues from there.

## Global Constraints

- Everything in the stage 1–2 plan's Global Constraints still applies.
- `src/lib/email/client.ts` is the **only** module that knows which mail transport is in use. No other file imports nodemailer.
- Verification and reset dispatch is **never awaited** (`void sendEmail(...)`), so response time cannot reveal whether an address exists.
- Registration must answer identically whether or not the address is already registered. Better Auth already returns a synthetic `200` because `requireEmailVerification: true` and `autoSignIn: false`; no UI branch may undo that.
- `customSyntheticUser` is **not** configured. It is only needed when plugins add user-table fields, and this configuration has none.
- Password rule, asserted in the action and in the config: at least 12 characters, at least one letter and one digit.
- No new validation dependency. Validation is plain TypeScript; adding a schema library is out of scope.
- Deliverability is explicitly not a requirement. Mail landing in spam is accepted and must not be designed around.
- Password recovery (`/reset-password`) is stage 5. Do not build it here.

---

### Task 9: Mailpit and the SMTP transport module

**Files:**
- Modify: `docker-compose.yml`
- Create: `src/lib/email/client.ts`
- Modify: `.env.example`, `.env.local` (untracked), `package.json`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `sendEmail({ to, subject, text }): Promise<void>` from `@/lib/email/client`. Task 10 calls it.

- [ ] **Step 1: Provide Mailpit**

Postgres is **not** containerised in this project (see Task 1 of the migration plan). Mailpit is the only service that is, and its ports do not collide with anything.

Create `docker-compose.yml` if it does not exist, or append under an existing `services:` key — it must contain Mailpit and nothing else:

```yaml
services:
  mailpit:
    image: axllent/mailpit
    container_name: next-auth-mailpit
    ports:
      - "1025:1025"
      - "8025:8025"
```

Port `1025` is SMTP; `8025` serves both the web UI and the REST API. If Docker is unavailable, `brew install mailpit && mailpit` provides the same two ports and the rest of this plan is unchanged.

- [ ] **Step 2: Install nodemailer**

Run: `npm install --save-exact nodemailer@7.0.9 && npm install --save-exact --save-dev @types/nodemailer@7.0.4`

If either exact version 404s, install the current one and pin whatever resolves — but record the resolved version in the commit message.

- [ ] **Step 3: Add the mail variables**

Append to `.env.example`:

```bash
SMTP_HOST="localhost"
SMTP_PORT="1025"
EMAIL_FROM="no-reply@localhost"
# Optional. Leave unset for Mailpit; set both for an authenticated SMTP account.
SMTP_USER=""
SMTP_PASSWORD=""
```

Copy the same keys into `.env.local` by hand. Do not print the file.

- [ ] **Step 4: Write the transport**

`auth` is optional so the same module drives Mailpit (no credentials) and any authenticated SMTP account (Brevo, Gmail app password, anything else) with no code change.

```ts
// src/lib/email/client.ts
import "server-only";

import nodemailer from "nodemailer";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

function createTransport() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);

  if (!host || !Number.isFinite(port)) {
    throw new Error("SMTP_HOST and SMTP_PORT are required to send email");
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function sendEmail({ to, subject, text }: SendEmailInput) {
  const from = process.env.EMAIL_FROM?.trim();

  if (!from) {
    throw new Error("EMAIL_FROM is required to send email");
  }

  await createTransport().sendMail({ from, to, subject, text });
}
```

- [ ] **Step 5: Verify a message actually reaches Mailpit**

Run: `docker compose up -d mailpit`  (or `mailpit` if installed via Homebrew)

Run:
```bash
node --input-type=module -e "
import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({ host: 'localhost', port: 1025 });
await t.sendMail({ from: 'no-reply@localhost', to: 'probe@example.invalid', subject: 'probe', text: 'probe' });
console.log('sent');
"
```
Expected: `sent`

Run: `curl -s http://localhost:8025/api/v1/messages | head -c 200`
Expected: JSON containing the `probe` message.

Run: `curl -s -X DELETE http://localhost:8025/api/v1/messages -o /dev/null -w '%{http_code}\n'`
Expected: `200` — the mailbox is now empty again.

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml src/lib/email/client.ts .env.example package.json package-lock.json
git commit -m "feat: add an SMTP transport and a local Mailpit mail server"
```

---

### Task 10: Enable email/password and verification in the auth config

**Files:**
- Modify: `src/auth.ts`
- Modify: `prisma/schema.prisma` (regenerated)
- Create: `prisma/migrations/**` (generated)

**Interfaces:**
- Consumes: `sendEmail` from Task 9.
- Produces: `auth.api.signUpEmail`, `auth.api.signInEmail`, `auth.api.sendVerificationEmail`, plus the `POST /api/auth/sign-up/email` and `POST /api/auth/sign-in/email` HTTP routes.

- [ ] **Step 1: Add the two configuration blocks**

Insert into the `betterAuth({ ... })` call in `src/auth.ts`, between `database` and `socialProviders`. Leave `plugins: [nextCookies()]` last.

```ts
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Not awaited: response timing must not reveal whether the address exists.
      void sendEmail({
        to: user.email,
        subject: "Confirm your email address",
        text: [
          "Confirm your address to finish creating your account:",
          "",
          url,
          "",
          "If you did not sign up, you can ignore this message.",
        ].join("\n"),
      });
    },
  },
```

Add the import at the top:

```ts
import { sendEmail } from "@/lib/email/client";
```

- [ ] **Step 2: Regenerate the schema and migrate**

Enabling password auth adds a password column to the account model.

Run: `npx auth@latest generate --adapter prisma --dialect postgresql`
Run: `npx prisma migrate dev --name add-email-password`
Run: `npx prisma generate`
Expected: all three succeed.

- [ ] **Step 3: Verify the endpoint exists and rejects a short password**

With `npm run dev` running:

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-up/email \
  -H 'content-type: application/json' \
  -d '{"name":"Probe","email":"probe@example.invalid","password":"short"}'
```
Expected: a `4xx` error mentioning password length — proving `minPasswordLength` is live.

- [ ] **Step 4: Verify a valid sign-up creates no session and sends mail**

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-up/email \
  -H 'content-type: application/json' \
  -d '{"name":"Probe","email":"probe@example.invalid","password":"correct-horse-1"}'
```
Expected: `200`, and the JSON contains `"token": null` — no session, because `autoSignIn` is `false`.

Run: `curl -s http://localhost:8025/api/v1/messages | grep -c probe@example.invalid`
Expected: `1` — the verification message was sent.

- [ ] **Step 5: Verify the enumeration response is identical**

Repeat the exact same request from Step 4 a second time.
Expected: `200` again, with the same shape — Better Auth returns a synthetic user rather than an "already registered" error. If this returns a `4xx`, `requireEmailVerification` is not applied and the flow leaks account existence; stop and fix the config before continuing.

- [ ] **Step 6: Reset the probe data**

Run: `npx prisma migrate reset --force --skip-seed && npx prisma generate`
Run: `curl -s -X DELETE http://localhost:8025/api/v1/messages -o /dev/null`

- [ ] **Step 7: Commit**

```bash
git add src/auth.ts prisma/schema.prisma prisma/migrations
git commit -m "feat: enable email/password sign-up with mandatory verification"
```

---

### Task 11: Rate limiting for Server Actions

**Files:**
- Create: `src/lib/auth/rate-limit.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `consumeRateLimit(key: string, max: number, windowMs: number): boolean` — returns `false` when the caller is over budget.

Better Auth's built-in limiter guards HTTP requests to `/api/auth/*` only; its own documentation states rate limits "do not affect server-side requests made via `auth.api`". Tasks 12–14 call `auth.api.*` in-process, so without this module registration and sign-in are unthrottled.

- [ ] **Step 1: Write the limiter**

Storage is per-process and in-memory. That is sufficient here and its limitation is deliberate: a multi-instance deployment gets one budget per instance. Swapping to a `rateLimit` table is a later change confined to this file.

```ts
// src/lib/auth/rate-limit.ts
import "server-only";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Returns true when the call is within budget, false when it is over.
 * Keys should combine the action name with the subject, e.g. `register:${email}`.
 */
export function consumeRateLimit(
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) {
    return false;
  }

  bucket.count += 1;
  return true;
}
```

- [ ] **Step 2: Verify the budget behaves**

Run:
```bash
npx tsx --eval "
import { consumeRateLimit } from './src/lib/auth/rate-limit.ts';
const r = [1,2,3,4].map(() => consumeRateLimit('probe', 3, 60000));
console.log(JSON.stringify(r));
" 2>/dev/null || npx tsc --noEmit
```
Expected: `[true,true,true,false]`. If `tsx` is unavailable, the fallback `tsc --noEmit` must at least pass; verify the behaviour through the E2E test in Task 15 instead.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/rate-limit.ts
git commit -m "feat: add an in-process rate limiter for auth Server Actions"
```

---

### Task 12: Registration screen and action

**Files:**
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/register/actions.ts`
- Create: `src/app/(auth)/register/_components/register-form.tsx`

**Interfaces:**
- Consumes: `auth`, `consumeRateLimit`, `getCurrentViewer`.
- Produces: `registerAction(state, formData): Promise<RegisterState>` for `useActionState`.

- [ ] **Step 1: Write the action**

Every failure path returns the same generic message. The action never says whether the address exists.

```ts
// src/app/(auth)/register/actions.ts
"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/auth/rate-limit";

export type RegisterState = { error: string | null };

const genericFailure: RegisterState = {
  error: "Could not complete sign-up. Check your details and try again.",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value: string) {
  return value.length >= 12 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
}

export async function registerAction(
  _state: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");

  if (!name || !isValidEmail(email)) return genericFailure;
  if (!isValidPassword(password)) {
    return {
      error:
        "Use at least 12 characters, including one letter and one number.",
    };
  }
  if (password !== confirmation) {
    return { error: "The two passwords do not match." };
  }

  if (!consumeRateLimit(`register:${email}`, 3, 60 * 60 * 1000)) {
    return genericFailure;
  }

  try {
    await auth.api.signUpEmail({ body: { name, email, password } });
  } catch {
    return genericFailure;
  }

  redirect("/verify-email");
}
```

`redirect()` throws a control-flow signal, so it sits outside the `try` block. Putting it inside would let the `catch` swallow the navigation and silently return an error instead.

- [ ] **Step 2: Write the client form**

```tsx
// src/app/(auth)/register/_components/register-form.tsx
"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { registerAction, type RegisterState } from "../actions";

const initialState: RegisterState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? <Alert role="alert">{state.error}</Alert> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
```

If `Alert` does not accept `role` as a prop, wrap the message in a `<div role="alert">` instead — the E2E test in Task 15 locates it by that role.

- [ ] **Step 3: Write the page**

```tsx
// src/app/(auth)/register/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentViewer } from "@/lib/auth/session";
import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const viewer = await getCurrentViewer();
  if (viewer) redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Verify by hand**

With `npm run dev` and Mailpit running, open `http://localhost:3000/register`, submit a valid address and a 12-character password, and confirm the browser lands on `/verify-email`. Then open `http://localhost:8025` and confirm the message is there.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(auth)'/register
git commit -m "feat: add the registration screen and action"
```

---

### Task 13: Verification waiting screen and resend

**Files:**
- Create: `src/app/(auth)/verify-email/page.tsx`
- Create: `src/app/(auth)/verify-email/actions.ts`
- Create: `src/app/(auth)/verify-email/_components/resend-form.tsx`

**Interfaces:**
- Consumes: `auth`, `consumeRateLimit`.
- Produces: `resendVerificationAction(state, formData): Promise<ResendState>`.

- [ ] **Step 1: Write the resend action**

It always reports success, so it cannot be used to test whether an address is registered.

```ts
// src/app/(auth)/verify-email/actions.ts
"use server";

import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/auth/rate-limit";

export type ResendState = { message: string | null };

const uniformReply: ResendState = {
  message: "If that address needs confirming, a new message is on its way.",
};

export async function resendVerificationAction(
  _state: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) return uniformReply;
  if (!consumeRateLimit(`resend:${email}`, 3, 60 * 60 * 1000)) {
    return uniformReply;
  }

  try {
    await auth.api.sendVerificationEmail({
      body: { email, callbackURL: "/login" },
    });
  } catch {
    // Deliberately swallowed: the reply must not vary with the outcome.
  }

  return uniformReply;
}
```

- [ ] **Step 2: Write the resend form**

```tsx
// src/app/(auth)/verify-email/_components/resend-form.tsx
"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resendVerificationAction,
  type ResendState,
} from "../actions";

const initialState: ResendState = { message: null };

export function ResendForm() {
  const [state, formAction, pending] = useActionState(
    resendVerificationAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.message ? <p role="status">{state.message}</p> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Sending…" : "Send it again"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Write the page**

```tsx
// src/app/(auth)/verify-email/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

import { ResendForm } from "./_components/resend-form";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Confirm your email</h1>
      <p className="text-sm text-muted-foreground">
        We sent you a link. Open it to finish creating your account. It may take
        a minute to arrive, and it can land in your spam folder.
      </p>
      <ResendForm />
      <p className="text-sm text-muted-foreground">
        Already confirmed? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Verify the link completes the flow**

Register a fresh address, open `http://localhost:8025`, click through to the message, and follow its link. Expected: the browser lands on `/login` and the `user` row now has a truthy `emailVerified`.

Run through the application's own connection string:

```bash
psql "$(grep '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d '"')" \
  -c 'select email, "emailVerified" from "user";'
```

Expected: the row shows the address with `emailVerified` true.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(auth)'/verify-email
git commit -m "feat: add the verification waiting screen and resend action"
```

---

### Task 14: Email and password sign-in on /login

**Files:**
- Create: `src/app/(auth)/login/_components/credentials-form.tsx`
- Modify: `src/app/(auth)/login/actions.ts`
- Modify: `src/app/(auth)/login/page.tsx`

**Interfaces:**
- Consumes: `auth`, `consumeRateLimit`.
- Produces: `signInWithCredentials(state, formData): Promise<SignInState>`, alongside the existing `signInWithGoogle`.

- [ ] **Step 1: Add the sign-in action**

Append to `src/app/(auth)/login/actions.ts`, leaving `signInWithGoogle` untouched.

```ts
import { consumeRateLimit } from "@/lib/auth/rate-limit";

export type SignInState = { error: string | null };

export async function signInWithCredentials(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  if (!consumeRateLimit(`signin:${email}`, 5, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Try again later." };
  }

  try {
    await auth.api.signInEmail({ body: { email, password } });
  } catch {
    // One message for wrong password, unknown address, and unconfirmed
    // address alike — the caller learns nothing about which it was.
    return {
      error:
        "Could not sign in. Check your details, and confirm your email if you have not yet.",
    };
  }

  redirect("/");
}
```

- [ ] **Step 2: Write the credentials form**

```tsx
// src/app/(auth)/login/_components/credentials-form.tsx
"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { signInWithCredentials, type SignInState } from "../actions";

const initialState: SignInState = { error: null };

export function CredentialsForm() {
  const [state, formAction, pending] = useActionState(
    signInWithCredentials,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? <Alert role="alert">{state.error}</Alert> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Place it on the login page**

In `src/app/(auth)/login/page.tsx`, render `<CredentialsForm />` above the existing Google form, separated by the existing `Separator` component, and add a link to `/register` below both. Do not change the page's existing session redirect, metadata, or configuration/error handling.

- [ ] **Step 4: Verify the full loop by hand**

Register a fresh address, confirm it through Mailpit, then sign in with it. Expected: the header shows the account menu and `/profile` renders. Then try signing in with a **registered but unconfirmed** address. Expected: refused, with the generic message.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(auth)'/login
git commit -m "feat: add email and password sign-in to the login page"
```

---

### Task 15: End-to-end coverage of the registration flow

**Files:**
- Create: `e2e/helpers/mailpit.ts`
- Create: `e2e/registration.spec.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: everything above.
- Produces: `readLatestMessageTo(email)` and `clearMailbox()` from `e2e/helpers/mailpit.ts`.

- [ ] **Step 1: Pass the mail settings to the test server**

Add to `webServerAuthEnvironment` in `playwright.config.ts`:

```ts
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  EMAIL_FROM: "no-reply@localhost",
```

- [ ] **Step 2: Write the Mailpit helper**

```ts
// e2e/helpers/mailpit.ts
const mailpitBaseUrl = "http://localhost:8025";

export async function clearMailbox() {
  await fetch(`${mailpitBaseUrl}/api/v1/messages`, { method: "DELETE" });
}

/** Polls until a message addressed to `email` arrives, then returns its body. */
export async function readLatestMessageTo(
  email: string,
  timeoutMs = 10_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const listed = await fetch(`${mailpitBaseUrl}/api/v1/messages`);
    const { messages = [] } = (await listed.json()) as {
      messages?: { ID: string; To: { Address: string }[] }[];
    };

    const match = messages.find((message) =>
      message.To.some(
        (recipient) => recipient.Address.toLowerCase() === email.toLowerCase(),
      ),
    );

    if (match) {
      const full = await fetch(`${mailpitBaseUrl}/api/v1/message/${match.ID}`);
      const { Text = "" } = (await full.json()) as { Text?: string };
      return Text;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`No Mailpit message for ${email} within ${timeoutMs}ms`);
}

export function extractFirstUrl(body: string): string {
  const match = body.match(/https?:\/\/\S+/);
  if (!match) throw new Error("No URL found in the message body");
  return match[0];
}
```

- [ ] **Step 3: Write the spec**

Each test uses a unique address so the suite stays safe under `fullyParallel: true`.

```ts
// e2e/registration.spec.ts
import { expect, test } from "@playwright/test";

import {
  clearMailbox,
  extractFirstUrl,
  readLatestMessageTo,
} from "./helpers/mailpit";

const password = "correct-horse-1";

function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.invalid`;
}

test.beforeEach(async () => {
  await clearMailbox();
});

test("registers, confirms by email, then signs in", async ({ page }) => {
  const email = uniqueEmail("happy");

  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify-email$/);

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

  await expect(page.getByRole("alert")).toBeVisible();
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
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

- [ ] **Step 4: Run the suite**

Run: `npm test`  (Mailpit must be running)
Expected: every test passes, including the specs carried over from stages 1–2.

- [ ] **Step 5: Commit**

```bash
git add e2e/helpers/mailpit.ts e2e/registration.spec.ts playwright.config.ts
git commit -m "test: cover registration, verification, and first sign-in end to end"
```

---

## Definition of done

- A visitor registers at `/register`, receives a message, confirms through its link, and signs in.
- Sign-up creates no session; an unconfirmed address cannot sign in.
- Registering an address twice produces the identical response both times.
- Google sign-in still works, unchanged, on the Better Auth stack.
- The user row persists in Postgres with `emailVerified` set after confirmation.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run test:agents` all pass.
- Only `src/lib/email/client.ts` knows the mail transport; changing providers is an env change plus that one file.
