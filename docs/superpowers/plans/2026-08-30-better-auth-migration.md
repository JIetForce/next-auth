# Better Auth Migration Implementation Plan (Stages 1–2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Auth.js with Better Auth on a real Postgres database, preserving every existing user-visible behaviour and every consumer of the auth DAL.

**Architecture:** Introduce Prisma against Postgres, then swap the auth library behind two unchanged interfaces: the `Viewer` DTO plus the `getCurrentViewer` / `requireCurrentViewer` exports in `src/lib/auth/session.ts`, and the three exports of `e2e/helpers/auth-session.ts`. Because both surfaces keep their signatures, no page, component, or authorization check changes, and the 501-line `e2e/auth-session.spec.ts` changes only where it names Auth.js HTTP endpoints or the Auth.js cookie.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, Better Auth 1.7.2, Prisma 7.10.0, Postgres 17, Playwright 1.62.1.

**Spec:** `docs/superpowers/specs/2026-08-30-better-auth-email-password-design.md`

**Scope:** Stages 1 and 2 of the spec's six-stage delivery. Email transport, registration, verification, password recovery, and the `docs/auth-architecture.md` rewrite are stages 3–6 and are **out of scope here**. This plan deliberately ships no new user-facing feature, so any behavioural regression it causes is unambiguous.

## Global Constraints

- Exact versions, pinned without a range: `better-auth@1.7.2`, `prisma@7.10.0`, `@prisma/client@7.10.0`, `@prisma/adapter-pg@7.10.0`.
- **Never run `npm install prisma@latest`.** The `prisma` CLI `latest` dist-tag is `8.0.0-rc.12`, a release candidate.
- Prisma 7 generator is `prisma-client` (not `prisma-client-js`); `output` is required; the project is ESM (`"type": "module"`) so `moduleFormat = "esm"`.
- Prisma 7 datasource URLs live in `prisma.config.ts`, never inline in `schema.prisma`.
- Prisma 7 `migrate dev` does not regenerate the client into a custom output directory. Always run `npx prisma generate` after a schema change.
- The Better Auth CLI package is `auth` (`npx auth@latest`). The `@better-auth/cli` package is stale at `1.4.21`; do not use it.
- `nextCookies()` must be the **last** entry in the `plugins` array.
- The `testUtils()` plugin must live in a test-only auth instance, never in `src/auth.ts`.
- `e2e/**` must never be imported from `src/**`.
- `src/lib/auth/types.ts` is not modified by any task in this plan.
- `getCurrentViewer` and `requireCurrentViewer` keep their exact signatures.
- No secret value is printed, echoed, committed, or written into a tracked file.
- Better Auth HTTP endpoints: session is `GET /api/auth/get-session`; sign-out is `POST /api/auth/sign-out`; social sign-in is `POST /api/auth/sign-in/social`. There are no `/api/auth/providers`, `/api/auth/csrf`, or `/api/auth/session` routes — those are Auth.js-only and must be removed wherever tests reference them.
- Session cookie name is `better-auth.session_token` (Auth.js used `authjs.session-token`).
- **Every database verification runs through the same connection string the application uses.** Never confirm
  schema state through a side channel such as `docker exec ... psql`: a side channel can report a healthy
  database that the app never talks to, which is exactly how a migration lands somewhere nobody is looking.
- Postgres is whatever server already runs on the machine. Do **not** add a containerised Postgres beside a
  local one — see the infrastructure note in Task 1.

---

### Task 1: Two Postgres databases and env scaffolding

**Files:**
- Create: `.env.example`
- Modify: `.env.local` (untracked; edit by hand, never commit)

**Interfaces:**
- Consumes: nothing.
- Produces: databases `appdev` and `apptest` on the machine's existing Postgres. Later tasks read `DATABASE_URL` and `DIRECT_URL`.

**Infrastructure decision — Docker is not a requirement of this plan.**

What the plan actually needs is two *separate databases*: one for development whose data survives, and one for tests that `prisma migrate reset` wipes on every run (Task 6). The isolation comes from that reset, not from a container or from `tmpfs`. Any Postgres 17 server provides it — Postgres.app, Homebrew, a container, or a remote server.

**Do not run a containerised Postgres beside a local one.** A container publishing `*:5432` and a local server bound to `127.0.0.1:5432` and `[::1]:5432` both start successfully, but `localhost` resolves to the specific binds first. Every connection then reaches the local server while `docker compose ps` reports the container healthy, and migrations land in a database nobody inspects.

If a previous run of this task already created `docker-compose.yml`, remove it (`docker compose down` first). Nothing in this project needs a container: Postgres is the machine's own server, and the registration plan's mail transport is a file in tests and the owner's Gmail in delivery.

- [ ] **Step 1: Confirm which Postgres answers on this machine**

Run: `lsof -nP -iTCP:5432 -sTCP:LISTEN`
Expected: exactly one process family listening. If a container and a local server both appear, stop the container's Postgres before continuing — see the infrastructure note above.

Run: `psql -h localhost -U postgres -c 'select version();'`
Expected: a Postgres 17 banner. If the major version is below 17, upgrade or point at a different server before continuing.

- [ ] **Step 2: Create the two databases**

```bash
psql -h localhost -U postgres -c 'CREATE DATABASE appdev;'
psql -h localhost -U postgres -c 'CREATE DATABASE apptest;'
```

`apptest` is wiped by `prisma migrate reset` on every E2E run, so it must never hold anything worth keeping. `appdev` is yours.

- [ ] **Step 3: Write the tracked env template**

```bash
# .env.example — safe to commit; contains no real values
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appdev"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/appdev"
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

`DIRECT_URL` equals `DATABASE_URL` locally. They diverge only on Supabase, where `DATABASE_URL` is the pooled connection and `DIRECT_URL` is the direct one that migrations require. Adjust the user and password to match the local server; Postgres.app commonly uses your own username with no password.

- [ ] **Step 4: Update the untracked local env by hand**

Add the six variables above to `.env.local` with real values. Reuse the existing `AUTH_SECRET` value as `BETTER_AUTH_SECRET`, and `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. Keep the old `AUTH_*` names for now; Task 8 removes them. Do not print the file's contents.

Verify the string the application will actually use:

Run: `psql "$(grep '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d '\"')" -c 'select current_database();'`
Expected: `appdev`. This is the only check that proves the app's connection string reaches the intended database.

- [ ] **Step 5: Commit**

```bash
git add .env.example
git commit -m "chore: add env template and the appdev/apptest databases"
```

---

### Task 2: Prisma 7.10 wired with a server-only client singleton

**Files:**
- Create: `prisma.config.ts`
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- Consumes: `DATABASE_URL` and `DIRECT_URL` from Task 1.
- Produces: `import { prisma } from "@/lib/db"` — a `PrismaClient` singleton. Task 3 passes it to `prismaAdapter`.

- [ ] **Step 1: Install the pinned versions**

Run: `npm install --save-exact @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 && npm install --save-exact --save-dev prisma@7.10.0 dotenv`

`dotenv` is a direct devDependency because `prisma.config.ts` loads the environment itself; see Step 3.

- [ ] **Step 2: Verify the pins landed exactly**

Run: `node -e "const p=require('./package.json');console.log(p.dependencies['@prisma/client'],p.dependencies['@prisma/adapter-pg'],p.devDependencies.prisma)"`
Expected: `7.10.0 7.10.0 7.10.0` — three bare versions with no `^` or `~`. If any shows `8.0.0-rc.12`, the wrong tag was installed; reinstall with the exact version.

- [ ] **Step 3: Write the Prisma config**

Two Prisma 7 details that older examples get wrong:

- **`datasource.directUrl` does not exist in Prisma 7.** The published type in `@prisma/config@7.10.0` is
  `{ url?: string; shadowDatabaseUrl?: string }`; writing `directUrl` fails to compile with `TS2353`. Only the
  CLI reads this block, and the CLI runs migrations, so it takes the **direct** connection. The runtime client
  in `src/lib/db.ts` separately reads the pooled `DATABASE_URL`. Locally the two strings are identical; on
  Supabase they differ.
- **`import "dotenv/config"` loads `.env`, which this project does not have.** Next.js reads `.env.local`
  itself, but the Prisma CLI is a separate process with no knowledge of that convention, so the path is given
  explicitly. The `dotenv.config` call must run before `prisma/config` is imported.

```ts
// prisma.config.ts
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
```

- [ ] **Step 4: Write the schema shell**

The datasource block carries only `provider`; the URL comes from `prisma.config.ts`. Task 3 appends the generated auth models below this.

```prisma
// prisma/schema.prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "esm"
}

datasource db {
  provider = "postgresql"
}
```

- [ ] **Step 5: Ignore the generated client**

Append to `.gitignore`:

```gitignore

# prisma generated client
/src/generated/
```

- [ ] **Step 6: Generate the client and verify it lands in the custom output**

Run: `npx prisma generate`
Expected: success, and `src/generated/prisma/client.ts` exists.

Run: `test -f src/generated/prisma/client.ts && echo OK`
Expected: `OK`

- [ ] **Step 7: Write the server-only singleton**

The `globalThis` guard exists because Next.js hot reload re-evaluates modules; without it, every reload opens a new pool and the database runs out of connections.

```ts
// src/lib/db.ts
import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create the Prisma client");
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 8: Verify the singleton type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add prisma.config.ts prisma/schema.prisma src/lib/db.ts .gitignore package.json package-lock.json
git commit -m "feat: wire Prisma 7.10 with a server-only client singleton"
```

---

### Task 3: Better Auth configured and its schema migrated

**Files:**
- Modify (full replacement): `src/auth.ts`
- Modify: `prisma/schema.prisma` (the CLI appends models)
- Create: `prisma/migrations/**` (generated)

**Interfaces:**
- Consumes: `prisma` from Task 2.
- Produces: `import { auth } from "@/auth"` — a Better Auth instance exposing `auth.handler`, `auth.api.getSession`, `auth.api.signOut`, `auth.api.signInSocial`, and `auth.$context`.

**Note:** this task configures Google only. `emailAndPassword` belongs to stages 4–5 and must not be added here.

- [ ] **Step 1: Install Better Auth pinned**

Run: `npm install --save-exact better-auth@1.7.2`

- [ ] **Step 2: Replace the auth configuration**

`redirect` pinning no longer lives in a callback: Better Auth takes destinations as explicit arguments at each call site, and Task 5 passes fixed compile-time constants. The security property is preserved by never accepting a destination from request input.

```ts
// src/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: true,
    },
  },
  // nextCookies must stay last so it can flush cookies set by earlier plugins.
  plugins: [nextCookies()],
});
```

- [ ] **Step 3: Generate the auth models into the Prisma schema**

Run: `npx auth@latest generate --adapter prisma --dialect postgresql`
Expected: `prisma/schema.prisma` now also contains `User`, `Session`, `Account`, and `Verification` models. The CLI writes the schema but does **not** touch the database.

- [ ] **Step 4: Verify the four models exist**

Run: `grep -c '^model ' prisma/schema.prisma`
Expected: `4`

- [ ] **Step 5: Create and apply the first migration**

Run: `npx prisma migrate dev --name add-better-auth`
Expected: a new directory under `prisma/migrations/` and "Your database is now in sync with your schema."

- [ ] **Step 6: Regenerate the client**

Prisma 7 does not do this as part of `migrate dev` when `output` is customised.

Run: `npx prisma generate`
Expected: success.

- [ ] **Step 7: Verify the tables landed**

Run through the application's own connection string, never a side channel:

```bash
psql "$(grep '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d '"')" -c '\dt'
```

Expected: tables for user, session, account, and verification are listed. If they are absent while `migrate dev` reported success, the CLI and the application are pointed at different servers — resolve that before continuing rather than copying the schema across by hand.

- [ ] **Step 8: Commit**

```bash
git add src/auth.ts prisma/schema.prisma prisma/migrations package.json package-lock.json
git commit -m "feat: configure Better Auth with the Prisma adapter and migrate its schema"
```

---

### Task 4: Auth route handler moved to the Better Auth catch-all

**Files:**
- Create: `src/app/api/auth/[...all]/route.ts`
- Delete: `src/app/api/auth/[...nextauth]/route.ts`

**Interfaces:**
- Consumes: `auth` from Task 3.
- Produces: the live HTTP surface at `/api/auth/*`, including `GET /api/auth/get-session`.

- [ ] **Step 1: Create the new handler**

```ts
// src/app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 2: Delete the Auth.js route**

```bash
git rm -r 'src/app/api/auth/[...nextauth]'
```

- [ ] **Step 3: Verify the endpoint answers**

Start the dev server in one shell (`npm run dev`), then in another:

Run: `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/auth/get-session`
Expected: `200`

Run: `curl -s http://localhost:3000/api/auth/get-session`
Expected: `null` — anonymous, no session.

Run: `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/auth/session`
Expected: `404` — the Auth.js path is gone, confirming the old route gave way.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/api/auth/[...all]/route.ts'
git commit -m "feat: serve auth from the Better Auth catch-all route"
```

---

### Task 5: DAL, environment, and actions rewritten behind unchanged exports

**Files:**
- Modify: `src/lib/auth/session.ts`
- Modify: `src/lib/auth/environment.ts`
- Modify: `src/lib/auth/actions.ts`
- Modify: `src/app/(auth)/login/actions.ts`

**Interfaces:**
- Consumes: `auth` from Task 3.
- Produces: unchanged public signatures — `getCurrentViewer(): Promise<Viewer | null>`, `requireCurrentViewer(): Promise<Viewer>`, `signOutAction(): Promise<void>`, `signInWithGoogle(): Promise<void>`. No consumer of these is edited by this plan.

- [ ] **Step 1: Rewrite the session DAL**

Only the internals change. The `cache()` wrapper, the field-by-field projection, and the `redirect("/login")` all stay.

```ts
// src/lib/auth/session.ts
import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAuthSessionConfigured } from "@/lib/auth/environment";
import type { Viewer } from "@/lib/auth/types";

export const getCurrentViewer = cache(async (): Promise<Viewer | null> => {
  if (!isAuthSessionConfigured()) return null;

  const session = await auth.api.getSession({ headers: await headers() });
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

- [ ] **Step 2: Rewrite the readiness checks**

Session reads now need a database as well as a secret, so `isAuthSessionConfigured` gains a `DATABASE_URL` check. The split between session readiness and Google readiness is preserved.

```ts
// src/lib/auth/environment.ts
import "server-only";

const googleProviderEnvironmentKeys = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

export function isAuthSessionConfigured() {
  return (
    Boolean(process.env.BETTER_AUTH_SECRET?.trim()) &&
    Boolean(process.env.DATABASE_URL?.trim())
  );
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

- [ ] **Step 3: Rewrite the logout action**

Auth.js's `signOut` performed the redirect itself; Better Auth's does not. The action therefore issues the redirect explicitly. `redirect()` throws a control-flow signal, so it must sit outside any `try` block that could swallow it.

```ts
// src/lib/auth/actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCurrentViewer } from "@/lib/auth/session";

export async function signOutAction(): Promise<void> {
  const viewer = await getCurrentViewer();
  if (!viewer) redirect("/");

  await auth.api.signOut({ headers: await headers() });

  redirect("/");
}
```

- [ ] **Step 4: Rewrite the Google sign-in action**

`signInSocial` returns the provider URL rather than redirecting. `callbackURL` is the fixed compile-time constant `"/"`, never a value from the request.

```ts
// src/app/(auth)/login/actions.ts
"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isGoogleAuthConfigured } from "@/lib/auth/environment";

export async function signInWithGoogle() {
  if (!isGoogleAuthConfigured()) {
    redirect("/login?error=configuration");
  }

  let providerUrl: string | undefined;

  try {
    const result = await auth.api.signInSocial({
      body: { provider: "google", callbackURL: "/" },
    });
    providerUrl = result.url;
  } catch {
    redirect("/login?error=oauth");
  }

  if (!providerUrl) {
    redirect("/login?error=oauth");
  }

  redirect(providerUrl);
}
```

- [ ] **Step 5: Verify nothing else referenced the old names**

Run: `grep -rn "AUTH_GOOGLE_\|from \"next-auth\|from 'next-auth" src/`
Expected: no output.

- [ ] **Step 6: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth src/app/'(auth)'/login/actions.ts
git commit -m "feat: move the auth DAL and actions onto Better Auth"
```

---

### Task 6: E2E seam rebuilt on the testUtils plugin

**Files:**
- Create: `e2e/helpers/auth-test-instance.ts`
- Create: `e2e/global-setup.ts`
- Modify (full replacement): `e2e/helpers/auth-session.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: `auth` configuration shape from Task 3.
- Produces: the same three exports the current helper has, so `e2e/auth-session.spec.ts` needs no import change — `E2E_VIEWER`, `addAuthenticatedSession(context, viewer?)`, `addTamperedSession(context)`.

- [ ] **Step 1: Create the test-only auth instance**

`testUtils()` must not appear in `src/auth.ts`. Conditionally spreading it into the production config breaks TypeScript's inference of `ctx.test`, so it gets its own instance pointed at the same database.

```ts
// e2e/helpers/auth-test-instance.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { testUtils } from "better-auth/plugins";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for authenticated E2E tests");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

export const testAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  plugins: [testUtils()],
});
```

- [ ] **Step 2: Replace the seam, preserving all three exports**

Two details an implementer will otherwise get wrong:

1. `test.createUser()` builds an **in-memory** object and does not write to the database. `test.saveUser()` persists it. Calling `getCookies()` for an unsaved user mints a session pointing at a row that does not exist.
2. `playwright.config.ts` sets `fullyParallel: true`, so several workers call this helper with the same fixed `E2E_VIEWER.email` at once. A plain create races on the unique-email constraint. The helper therefore reuses an existing row when it finds one, and treats a lost insert race as a reuse.

```ts
// e2e/helpers/auth-session.ts
import type { BrowserContext } from "@playwright/test";

import type { Viewer } from "@/lib/auth/types";
import { testAuth } from "./auth-test-instance";

const sessionCookieName = "better-auth.session_token";

export const E2E_VIEWER = {
  name: "E2E User",
  email: "e2e-user@example.invalid",
  image: null,
} as const;

async function findOrCreateUser(viewer: Viewer) {
  const ctx = await testAuth.$context;
  const email = viewer.email ?? E2E_VIEWER.email;

  const existing = await ctx.internalAdapter.findUserByEmail(email);
  if (existing?.user) return existing.user;

  const user = ctx.test.createUser({
    email,
    name: viewer.name ?? "",
    image: viewer.image ?? undefined,
    emailVerified: true,
  });

  try {
    await ctx.test.saveUser(user);
    return user;
  } catch {
    // Another worker inserted the same address first; reuse its row.
    const raced = await ctx.internalAdapter.findUserByEmail(email);
    if (!raced?.user) throw new Error(`Could not seed E2E user ${email}`);
    return raced.user;
  }
}

/**
 * Seeds a real database-backed Better Auth session and installs its cookie.
 * Defaults to E2E_VIEWER; pass a `viewer` override to exercise other identity
 * shapes (e.g. UserAvatar's fallback-initials branches) without a second
 * helper. Never logs or persists the secret, cookie, or token.
 */
export async function addAuthenticatedSession(
  context: BrowserContext,
  viewer: Viewer = E2E_VIEWER,
) {
  const ctx = await testAuth.$context;
  const user = await findOrCreateUser(viewer);

  const cookies = await ctx.test.getCookies({
    userId: user.id,
    domain: "localhost",
  });

  await context.addCookies(cookies);
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

- [ ] **Step 3: Write the global setup that resets the test database**

`prisma migrate reset` **drops every table it can reach**. `prisma.config.ts` loads `.env.local`, whose
`DIRECT_URL` points at `appdev` — so a reset that inherits the ambient environment would wipe the development
database on every test run. The test URL is therefore forced into the child environment. `dotenv` does not
override variables that are already set, so the explicit values win.

```ts
// e2e/global-setup.ts
import { execSync } from "node:child_process";

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/apptest";

export default function globalSetup() {
  if (!/apptest/.test(TEST_DATABASE_URL)) {
    throw new Error(
      `Refusing to reset ${TEST_DATABASE_URL}: the E2E database name must contain "apptest"`,
    );
  }

  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: TEST_DATABASE_URL,
    },
  });
}
```

The name guard is deliberate. A reset pointed at the wrong database is silent and unrecoverable, so the cheapest
possible assertion sits in front of it.

- [ ] **Step 4: Point Playwright at the test database**

Replace the `webServerAuthEnvironment` block and add `globalSetup`. The env is shared by the Playwright process (which runs the helper) and the child Next server, so both talk to the same database and sign cookies with the same secret.

The test URL is imported from `global-setup` rather than read from `DATABASE_URL`. Falling back to `DATABASE_URL` would silently point the suite — and its `migrate reset` — at the development database. Override it with `TEST_DATABASE_URL`, never with `DATABASE_URL`.

```ts
// playwright.config.ts — replace the const and add two config keys
import { TEST_DATABASE_URL } from "./e2e/global-setup";

const webServerAuthEnvironment = {
  DATABASE_URL: TEST_DATABASE_URL,
  DIRECT_URL: TEST_DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
};
```

Then inside `defineConfig({ ... })` add, as siblings of `testDir`:

```ts
  globalSetup: "./e2e/global-setup.ts",
```

and leave `webServer.env: webServerAuthEnvironment` as it already is.

- [ ] **Step 5: Verify the seam produces a real session**

Run: `npx playwright test e2e/auth-session.spec.ts -g "session" --reporter=list`
Expected: the endpoint-dependent tests still fail at this point — Task 7 fixes those. What must **not** appear is any error about a missing `ctx.test`, an unsaved user, or a unique-constraint violation. If `ctx.test` is undefined, `testUtils()` was added to the wrong instance.

- [ ] **Step 6: Commit**

```bash
git add e2e/helpers e2e/global-setup.ts playwright.config.ts
git commit -m "test: rebuild the E2E auth seam on the Better Auth testUtils plugin"
```

---

### Task 7: E2E specs adapted to Better Auth endpoints

**Files:**
- Modify: `e2e/auth-session.spec.ts`
- Modify: `e2e/login.spec.ts`

**Interfaces:**
- Consumes: the unchanged three exports from Task 6.
- Produces: a green suite that asserts the same behaviour against Better Auth's HTTP surface.

Only the places that name Auth.js internals change. Every behavioural assertion — redirects, header state, profile fields, logout — stays exactly as written.

- [ ] **Step 1: Rename the cookie constant**

`e2e/auth-session.spec.ts:10`:

```ts
const sessionCookieName = "better-auth.session_token";
```

- [ ] **Step 2: Repoint every session probe**

In `e2e/auth-session.spec.ts`, at lines 183, 292, 322, 347, and 395, replace `"/api/auth/session"` with `"/api/auth/get-session"`. The surrounding assertions are unchanged: an authenticated probe still matches `E2E_VIEWER`, and an anonymous probe still returns `null`.

- [ ] **Step 3: Replace the raw sign-out test**

Better Auth has no `/api/auth/csrf` endpoint and no GET sign-out confirmation page. Replace the block at roughly lines 109–135 with a direct POST, and delete the `page.goto("/api/auth/signout")` case at roughly line 411 outright — it asserts an Auth.js-only page that no longer exists.

```ts
test("signs out through the raw endpoint", async ({ context, page }) => {
  await addAuthenticatedSession(context);

  const response = await page.request.post("/api/auth/sign-out");
  expect(response.ok()).toBe(true);

  expect(
    (await context.cookies()).find(
      (cookie) => cookie.name === sessionCookieName,
    ),
  ).toBeUndefined();
});
```

- [ ] **Step 4: Replace the raw social sign-in test**

The block at roughly lines 147–165 posts to `/api/auth/signin/google` and inspects the `authjs.callback-url` cookie. Better Auth exposes `POST /api/auth/sign-in/social` and sets no such cookie. Replace it with an assertion that the endpoint hands back a Google URL and never echoes a caller-supplied destination.

```ts
test("returns a Google URL and ignores a caller-supplied destination", async ({
  request,
}) => {
  test.skip(
    !googleConfigured,
    "The full Google auth environment is required to exercise sign-in/social",
  );

  const response = await request.post("/api/auth/sign-in/social", {
    data: { provider: "google", callbackURL: "https://evil.example/pwned" },
  });

  const body = await response.json();
  expect(body.url).toContain("accounts.google.com");
  expect(body.url).not.toContain("evil.example");
});
```

If `googleConfigured` is not already defined in this file, copy its definition from `e2e/login.spec.ts`.

- [ ] **Step 5: Delete the Auth.js provider-listing test**

`e2e/login.spec.ts` lines 90–107 assert the shape of `/api/auth/providers`, an Auth.js-only endpoint with no Better Auth equivalent. Delete the whole `test("exposes only the configured Google provider", ...)` block. The behaviour it guarded — that only Google is offered — is already covered by the login page rendering tests and by Step 4 above.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all tests pass. If the run cannot reach the database, confirm the `apptest` database exists and that `TEST_DATABASE_URL` (or the default in `e2e/global-setup.ts`) names it.

- [ ] **Step 7: Commit**

```bash
git add e2e/auth-session.spec.ts e2e/login.spec.ts
git commit -m "test: adapt E2E contracts to Better Auth endpoints"
```

---

### Task 8: Auth.js removed and the suite proven green

**Files:**
- Modify: `package.json`
- Modify: `.env.local` (untracked; edit by hand)
- Modify: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: a tree with no `next-auth` dependency and a passing verification run.

- [ ] **Step 1: Uninstall Auth.js**

Run: `npm uninstall next-auth`

- [ ] **Step 2: Prove no residue remains**

Run: `grep -rn "next-auth\|authjs\|AUTH_GOOGLE_\|AUTH_SECRET" src/ e2e/ package.json`
Expected: no output. Any hit is a missed reference and must be fixed before continuing.

- [ ] **Step 3: Drop the stale variables from the untracked env**

Remove `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` from `.env.local`. The `BETTER_AUTH_*` and `GOOGLE_*` names added in Task 1 replace them. Do not print the file.

- [ ] **Step 4: Update the README setup section**

In `README.md`, replace the three `AUTH_*` variables in the "Google authentication" block with the six names from `.env.example`, and add one line above them stating that a local Postgres 17 with an `appdev` and an `apptest` database is required. Leave the rest of the section alone; the full documentation rewrite is stage 6.

- [ ] **Step 5: Run the whole verification set**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npm run lint`
Expected: clean.

Run: `npm test`
Expected: all Playwright tests pass.

Run: `npm run test:agents`
Expected: pass — this proves the agent-roster suite was not disturbed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json README.md
git commit -m "chore: remove next-auth and document the Better Auth setup"
```

---

## Manual steps this plan cannot perform

Flag these to the human rather than attempting them:

- Rotating the previously disclosed Google client secret in Google Cloud.
- Creating the Supabase project and copying its pooled and direct connection strings into deployment configuration.
- Confirming the Google callback URL `http://localhost:3000/api/auth/callback/google` is still registered. Better Auth uses the same path as Auth.js did, so no change is expected — but it must be confirmed, not assumed.

## Definition of done

- `next-auth` appears nowhere in `package.json`, `src/`, or `e2e/`.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, and `npm run test:agents` all pass.
- `/profile`, the Header account slot, every redirect, and logout behave exactly as before, with **no edits** to `src/app/(main)/profile/page.tsx`, `src/components/header-account.tsx`, `src/components/user-menu.tsx`, or `src/lib/auth/types.ts`.
- Google sign-in completes against the real provider and lands on `/`.
- Sessions are rows in the `session` table; deleting a row ends that session immediately.
