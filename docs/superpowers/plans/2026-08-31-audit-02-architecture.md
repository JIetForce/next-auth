# Audit remediation — Phase 2: Architecture and performance

> **For agentic workers:** this repository's operating contract is `AGENTS.md`, and it supersedes the
> generic `subagent-driven-development` / `executing-plans` skills. The developer does **not** commit.

**Goal:** close `docs/audit-2026-08-31.md` §3 (architecture), §5 (performance), 4.1 (the hard-coded
profile provider) and 2.8 (password policy) — ending with the marketing pages served from a static
shell instead of querying Postgres for an anonymous visitor's session.

**Spec:** `docs/superpowers/specs/2026-08-31-audit-remediation-design.md` — read `## Corrections to
the audit` C2 before Task 6. The audit calls `cacheComponents` a one-line change; it is not.

**Architecture:** The `Viewer` DTO grows the two fields every future authorisation check needs, which
unblocks reading the real provider on `/profile`. Validation collapses to one zod schema used by both
the client resolver and the server action. Error and not-found conventions arrive so a Postgres
outage renders a branded page instead of Next's default. Then, last and behind all of that,
`cacheComponents` moves the session read behind a Suspense boundary and the marketing routes onto the
CDN.

**Tech Stack:** Next.js 16 (Cache Components, `use cache: private`), React 19, Better Auth 1.7.2,
zod 4, Prisma 7.

## Global Constraints

- The developer does **not** commit. The coordinator commits after review approval.
- `npm test` (Playwright E2E) is human-gated; report it un-run.
- Task 6 is last for a reason. Do not reorder — it is a rendering-model change and every earlier task
  is easier to review against a stable rendering model.
- `e2e/auth-session.spec.ts:188` asserts the profile renders only allowlisted viewer fields. Tasks 1
  and 2 widen that allowlist; that test must be read and updated deliberately, not incidentally.
- Keep the `Viewer` allowlist an allowlist. Adding `id` and `emailVerified` is the change; spreading
  `session.user` is not.
- `next dev` rewrites a block into `CLAUDE.md`; commit it with the task rather than reverting it.

---

## File Structure

| File                                                                    | Responsibility                                           | Action |
| ----------------------------------------------------------------------- | -------------------------------------------------------- | ------ |
| `src/lib/auth/types.ts`                                                 | `Viewer` gains `id` and `emailVerified`                  | Modify |
| `src/lib/auth/session.ts`                                               | Project the two new fields; later, `use cache: private`  | Modify |
| `src/app/(main)/profile/page.tsx`                                       | Read the real provider; restructure for Cache Components | Modify |
| `src/lib/auth/schemas.ts`                                               | One schema per form, shared by client and server         | Modify |
| `src/lib/auth/validation.ts`                                            | Superseded                                               | Delete |
| `src/app/(auth)/*/actions.ts`                                           | `safeParse` instead of hand-rolled checks                | Modify |
| `src/auth.ts`                                                           | `minPasswordLength: 8`; `session.cookieCache`            | Modify |
| `src/app/error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx` | Error conventions                                        | Create |
| `next.config.ts`                                                        | `cacheComponents`, `turbopackRustReactCompiler`          | Modify |

---

### Task 1: `Viewer` gains `id` and `emailVerified`

Answers 3.3.

**Files:**

- Modify: `src/lib/auth/types.ts`, `src/lib/auth/session.ts`
- Modify: `e2e/auth-session.spec.ts` (allowlist assertion)

**Interfaces:**

- Produces: `Viewer = Readonly<{ id: string; name: string | null; email: string | null; image: string | null; emailVerified: boolean }>`.
- Consumed by: `user-avatar.tsx`, `user-menu.tsx`, `header-account.tsx`, `profile/page.tsx`.

- [ ] **Step 1: Add the fields to `Viewer`.** `id` is required and non-nullable — a session without a
      user id is not a session. `emailVerified` is a boolean with no null.

- [ ] **Step 2: Project them in `getCurrentViewer`** (`session.ts:18-22`), keeping the existing
      `.trim()` normalisation for `name` and `email` exactly as it is. Add a comment saying why `id` is
      in the DTO — ownership checks (`row.authorId === viewer.id`) are impossible without it, and the
      alternatives are a second database round-trip or comparing by email.

- [ ] **Step 3: Read `e2e/auth-session.spec.ts:188`** ("renders only allowlisted viewer fields") and
      update it for the widened allowlist. If it asserts on rendered output rather than the DTO, it may
      need no change at all — say which it was.

- [ ] **Step 4: Verify.** `npm run build`, `npx tsc --noEmit`, `npm run lint`. TypeScript will point
      at every consumer that needs updating; there should be none, since this is a widening.

---

### Task 2: The profile shows the provider the account actually used

Answers 4.1. Depends on Task 1.

**Files:**

- Modify: `src/app/(main)/profile/page.tsx`
- Possibly create: `src/lib/auth/accounts.ts`

**Interfaces:**

- Consumes: `viewer.id` from Task 1; `prisma` from `@/lib/db`.
- Produces: a provider label derived from `account.providerId`.

- [ ] **Step 1: Replace the hard-coded `<dd>Google</dd>`** (`profile/page.tsx:63-68`). Since email +
      password was added, most accounts are created that way and every one of them is currently told it
      signed in with Google.

- [ ] **Step 2: Read the accounts** for `viewer.id` via Prisma, in a small `server-only` helper so
      the page stays a view. A user can have more than one account row — `accountLinking` is enabled with
      `trustedProviders: ["google"]` (`src/auth.ts:66-72`) — so the correct rendering is **all** linked
      providers, not the first. Map `providerId` to a label: `credential` → "Email and password",
      `google` → "Google", anything else → the raw `providerId` rather than a guess.

- [ ] **Step 3: Handle the empty case.** Render "Not available" rather than throwing if no account
      row exists; the page must not 500 on an unusual account.

- [ ] **Step 4: Update the e2e expectation.** `e2e/auth-session.spec.ts` covers the profile; a
      credentials-created user must now see "Email and password". Add that assertion — the audit's point
      is that the existing test checks for the _absence_ of extra fields and so never caught wrong static
      text.

- [ ] **Step 5: Verify.** `npm run build`, `npx tsc --noEmit`, `npm run lint`. E2E is human-gated.

---

### Task 3: One validation schema, and the password policy

Answers 3.4 and 2.8. Spec decision D2.

**Files:**

- Modify: `src/lib/auth/schemas.ts`
- Delete: `src/lib/auth/validation.ts`
- Modify: all four `src/app/(auth)/*/actions.ts`
- Modify: `src/auth.ts`

**Interfaces:**

- Produces: one exported schema per form, used by `zodResolver` on the client and `safeParse` on the
  server. No validation rule may exist in two places when this task is done.

- [ ] **Step 1: Write one password schema.** Per D2: `min(8)`, and **delete both regexes**. NIST
      SP 800-63B advises against composition rules — they predictably produce `password1`. One message:
      "Use at least 8 characters." The rule currently lives in three places (`schemas.ts:16-28`,
      `schemas.ts:52-65`, `validation.ts:10`); after this step it lives in one.

- [ ] **Step 2: Normalise email in the schema, not the action.** The audit notes `registerSchema`
      does not lowercase while the action does (`register/actions.ts:27-29`) — a live divergence. Put
      `.trim().toLowerCase()` in the schema via a zod transform so client and server agree.

- [ ] **Step 3: Fold the password-confirmation rule in.** It is currently in `schemas.ts:31`,
      `register/actions.ts:38` and `reset-password/actions.ts:60`. One `.refine` on the schema; the
      actions stop checking it.

- [ ] **Step 4: Rewrite the four actions to `safeParse`.** Replace `isValidEmail`
      (`register/actions.ts:17-19`) and `isValidPassword`. **The error shape must not change** — each
      action still returns its existing uniform reply, and a validation failure must not leak which field
      failed where the current code does not. Read each action's current messages and preserve them.

- [ ] **Step 5: Delete `src/lib/auth/validation.ts`** and confirm nothing imports it:

```bash
grep -rn "auth/validation" src e2e
```

- [ ] **Step 6: Set `minPasswordLength: 8`** in `src/auth.ts:15`, so Better Auth's own check agrees
      with the schema. Leave `maxPasswordLength: 128`.

- [ ] **Step 7: Verify.** `npm run build`, `npx tsc --noEmit`, `npm run lint`, plus the grep from
      Step 5 returning nothing. Note in `### Concerns` that existing users' shorter passwords keep
      working — the rule applies at registration and reset only.

---

### Task 4: Cache the session in a signed cookie

Answers 3.2 and 5.2.

**Files:**

- Modify: `src/auth.ts`

- [ ] **Step 1: Add `session.cookieCache`.** The default is `enabled: false`, so every
      `auth.api.getSession` is a `SELECT`; React's `cache()` in `session.ts:12` dedupes within one render
      but not across requests.

```ts
  session: {
    // Without this every getSession() is a SELECT. The trade is that a revoked
    // session stays usable for up to maxAge — see docs/auth-architecture.md.
    cookieCache: { enabled: true, maxAge: 300 },
  },
```

- [ ] **Step 2: Record the trade-off where it will be found.** Add the note to `### Concerns` so
      phase 3's rewrite of `docs/auth-architecture.md` picks it up. This matters specifically because the
      audit found the current document asserting the _opposite_ of the truth about session revocation.

- [ ] **Step 3: Verify.** `npm run build`, `npx tsc --noEmit`. The behavioural check — that sign-out
      still takes effect immediately, since Better Auth clears the cache cookie on sign-out — is E2E and
      human-gated. Say so; do not claim it passes.

---

### Task 5: App Router error and not-found conventions

Answers 3.5.

**Files:**

- Create: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`
- Create: `src/app/(main)/loading.tsx`, `src/app/(auth)/loading.tsx`

**Interfaces:**

- Produces: branded error and 404 pages, and a logged error rather than a silent one.

- [ ] **Step 1: Read the conventions first** —
      `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md` and
      `not-found.md`. Next 16 differs from older versions; do not write these from memory.

- [ ] **Step 2: `error.tsx`** — a client component taking `{ error, reset }`, rendering the Siftloom
      visual language (reuse `sl-bg-grid` / `sl-ambient-glow-top`, as `profile/page.tsx:32-33` does) with
      a "Try again" button wired to `reset`. Log via `useEffect`. **Show `error.digest`, never
      `error.message`** — the message can carry database details.

- [ ] **Step 3: `global-error.tsx`** — must render its own `<html>` and `<body>`; it replaces the
      root layout. Keep it minimal and dependency-free, since it renders when the layout itself failed.

- [ ] **Step 4: `not-found.tsx`** — branded 404 with a link home.

- [ ] **Step 5: `loading.tsx` for both route groups**, reusing `Skeleton` as `header.tsx:50` does.

- [ ] **Step 6: The practical case this exists for.** `session.ts:15` deliberately lets Better Auth
      errors propagate — that is documented and correct, but until now nothing caught them, so a Postgres
      outage gave the user Next's default page and logged nothing. Confirm by reading that the boundary
      now covers `getCurrentViewer`'s throw path, and note it in `### Test results`.

- [ ] **Step 7: Verify.** `npm run build`, `npx tsc --noEmit`, `npm run lint`. Check the 404 renders:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/definitely-not-a-route
```

---

### Task 6: Cache Components — the static shell

Answers 3.1 and 5.1. **Read spec C2 before starting.** This is the highest-risk task in the phase.

**Files:**

- Modify: `next.config.ts`, `src/lib/auth/session.ts`, `src/app/(main)/profile/page.tsx`

**Interfaces:**

- Produces: `/`, `/features`, `/pricing` prerendered as static; the account slot streamed.

- [ ] **Step 1: Read both guides.** `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`
      and `authentication-with-cache-components.md`. They are the specification for this task.

- [ ] **Step 2: Record the baseline.** Run `npm run build` and copy the route table into your report
      **before** changing anything, so the after-state is comparable. Today every route except
      `/_not-found` is `ƒ`.

- [ ] **Step 3: Enable the flag.** `cacheComponents: true` in `next.config.ts`.

- [ ] **Step 4: Opt `/profile` out so the app builds.** `export const instant = false` in
      `src/app/(main)/profile/page.tsx`. It calls `requireCurrentViewer()` in the page body with no
      Suspense boundary above it, which is a **build error** under Cache Components, not an insight.

- [ ] **Step 5: Convert `getCurrentViewer` to `"use cache: private"`.** This is the directive that
      may read `cookies()` and `headers()`; a plain `use cache` may not. The result stays in the viewer's
      browser and never on the server. Keep React's `cache()` wrapper or remove it deliberately — say
      which you did and why.

- [ ] **Step 6: Restructure `/profile`** so the session read sits behind a `<Suspense>` boundary,
      then remove its `instant = false`. If that turns out to require restructuring the page more than
      this task should, leave `instant = false` in place, say so in `### Concerns`, and move on — the
      marketing routes are the prize, and `/profile` being dynamic is correct behaviour anyway.

- [ ] **Step 7: Prove it worked.** Run `npm run build` and paste the route table.
      **The acceptance criterion is that `/`, `/features` and `/pricing` print as `○` (static), not `ƒ`.**
      If they do not, this task is not done — report it rather than reporting the flag as landed. The
      header's existing Suspense boundary (`header.tsx:49-53`) is what should make this work.

- [ ] **Step 8: Verify.** `npm run build`, `npx tsc --noEmit`, `npm run lint`, and check the dev
      overlay for validation insights on the three marketing routes. E2E is human-gated and matters
      more than usual here.

---

### Task 7: React Compiler through Turbopack instead of Babel

Answers 5.3.

**Files:**

- Modify: `next.config.ts`, `package.json`

- [ ] **Step 1: Read** `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopackRustReactCompiler.md`
      and confirm the option name and placement against the installed version, not against this plan.

- [ ] **Step 2: Enable the Rust port.** Keep `reactCompiler: true`; add
      `experimental: { turbopackRustReactCompiler: true }`.

- [ ] **Step 3: Remove `babel-plugin-react-compiler`** from `devDependencies` — the Babel pass leaves
      the build with it. Run `npm install` so the lockfile updates.

- [ ] **Step 4: Verify, with numbers.** `npm run build` before and after, reporting both wall-clock
      times. Then confirm memoization still happens — if the compiler silently stopped running, the build
      still succeeds and the app is just slower, which is exactly the failure this task could hide.
      Check the build output for React Compiler activity and say what you saw. `npx tsc --noEmit`,
      `npm run lint`.

---

## Phase exit

- [ ] `npm run build && npx tsc --noEmit && npm run lint && npm run test:agents && npm run check:agents` — all green.
- [ ] The build route table shows `/`, `/features`, `/pricing` as static. Paste it into the ledger.
- [ ] Ask the human to run `npm test` and report the result. This phase changes the session read
      path, the validation of every form, and the rendering model — E2E is the only end-to-end
      coverage of any of it.
- [ ] Coordinator commits, appends the delivery line to `.roster/ledger.md`, archives it.
