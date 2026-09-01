# Audit remediation — Phase 4: Infrastructure and tooling

> **For agentic workers:** this repository's operating contract is `AGENTS.md`. The developer does
> **not** commit.

**Goal:** close `docs/audit-2026-08-31.md` §7 and 4.4. The audit's largest tooling gap is that the
`AGENTS.md` review contract runs only on someone's laptop — `.github/` does not exist, so `build`,
`lint`, `tsc` and `test:agents` have never run on a pull request.

**Spec:** `docs/superpowers/specs/2026-08-31-audit-remediation-design.md` — see `## Out of scope` for
why the `deepmerge-ts` advisory is accepted and why major version bumps are not in this phase.

**Architecture:** Pin the runtime, tighten the compiler, make formatting mechanical, add the unit-test
layer the repository has never had, validate the environment at build time rather than at a user's
request, and put all of it behind CI. Each is independent; they are ordered cheapest-first so a
failure late in the phase does not block the rest.

## Global Constraints

- The developer does **not** commit. Task 3 (Prettier) produces a very large diff and ships as its
  own commit, formatting only.
- `npm test` (Playwright E2E) is human-gated. CI must therefore **not** run it — see Task 9.
- `npm test` is reserved for the application's Playwright suite. The roster suite is
  `npm run test:agents` (`node --test`). Do not merge them, and do not let Vitest capture `npm test`.
- Never hand-edit generated agent profiles.

---

## File Structure

| File                                   | Responsibility                           | Action |
| -------------------------------------- | ---------------------------------------- | ------ |
| `package.json`                         | `engines`, dependency bumps, new scripts | Modify |
| `.nvmrc`                               | Pinned Node version                      | Create |
| `tsconfig.json`                        | `ES2022`, `noUncheckedIndexedAccess`     | Modify |
| `.prettierrc`, `.prettierignore`       | Formatting configuration                 | Create |
| `vitest.config.ts`, `src/**/*.test.ts` | Unit-test layer                          | Create |
| `src/env.ts`                           | Validated environment schema             | Create |
| `src/lib/logger.ts`                    | Structured logging                       | Create |
| `e2e/helpers/auth-test-instance.ts`    | Pool teardown                            | Modify |
| `e2e/*.spec.ts`                        | Accessibility assertions                 | Modify |
| `.github/workflows/ci.yml`             | CI                                       | Create |

---

### Task 1: Pin the Node version and take the safe upgrades

Answers 7.1.

**Files:**

- Modify: `package.json`
- Create: `.nvmrc`

- [ ] **Step 1: Establish the target.** `node --version` locally reports v26.7.0 while
      `@types/node` is pinned at `^20`. Neither `engines` nor `.nvmrc` exists, so Vercel picks its own
      default and it may differ from what anyone has tested. Choose the current Node LTS at the time of
      execution — check, do not assume — and record which you chose and why.

- [ ] **Step 2: Add `engines`** to `package.json` and write the same major to `.nvmrc`.

- [ ] **Step 3: Raise `@types/node`** to match. This is the one major bump in scope, because leaving
      it is the actual reported defect.

- [ ] **Step 4: Take the safe minors only** — `lucide-react` 1.37→1.38, `shadcn` 4.19.0→4.19.1,
      `react-hook-form` 7.86→7.87, `zod` 4.4.3→4.5.4. Leave `eslint` 9→10, `typescript` 5.9→7.0 and
      `prisma` 7→8-rc alone; each is its own spec.

- [ ] **Step 5: Verify.** `npm install`, `npm run build`, `npx tsc --noEmit`, `npm run lint`,
      `npm run test:agents`. Report any new type error from the `@types/node` bump rather than
      suppressing it.

---

### Task 2: Tighten the TypeScript configuration

Answers 7.3.

**Files:**

- Modify: `tsconfig.json`, and whatever the new checks flag

- [ ] **Step 1: `target: "ES2017"` → `"ES2022"`.** The current value is a years-old
      `create-next-app` default; with Node pinned by Task 1 and modern browsers, it only costs
      transpilation.

- [ ] **Step 2: Add `noUncheckedIndexedAccess: true`.** Then fix what it surfaces — the audit names
      `src/components/user-avatar.tsx:19` (`words.at(-1)!`) and `:16` (`Array.from(words[0])`), which are
      safe today only because of a `filter(Boolean)` several lines earlier.

- [ ] **Step 3: Fix by narrowing, not by asserting.** Replacing one `!` with another `!` is not this
      task. If a genuine invariant cannot be expressed, leave a comment explaining why the assertion
      holds.

- [ ] **Step 4: Verify.** `npx tsc --noEmit` clean, `npm run build`, `npm run lint`. Report the
      number of errors the flag surfaced and how each was resolved.

---

### Task 3: Prettier

Answers 7.2. **Ships as its own commit, formatting only.**

**Files:**

- Create: `.prettierrc`, `.prettierignore`
- Modify: `package.json`; then every formatted file

- [ ] **Step 1: Install and configure.** The prevailing style is semicolons and double quotes; the
      unformatted outliers are the files `shadcn add` generated (`src/lib/utils.ts`,
      `src/components/providers.tsx` have no semicolons). Match the majority.

- [ ] **Step 2: Ignore what must not be reformatted** — `src/generated/**` (Prisma output),
      `.next/**`, `node_modules/**`, `package-lock.json`, and every generated agent profile under
      `.claude/`, `.codex/`, `.cursor/`, `.devin/`, `.agent/`. Reformatting a generated profile makes
      `npm run check:agents` fail.

- [ ] **Step 3: Add `format` and `format:check` scripts.**

- [ ] **Step 4: Run it once across the repository.**

- [ ] **Step 5: Verify — carefully.** `npm run build`, `npx tsc --noEmit`, `npm run lint`,
      `npm run test:agents`, **`npm run check:agents`** (this is the one that catches a reformatted
      profile), and `git diff --stat` to show the size. Confirm the diff is formatting only: no line
      should change meaning.

---

### Task 4: Vitest and the first unit tests

Answers 7.2.

**Files:**

- Create: `vitest.config.ts`, test files beside their subjects
- Modify: `package.json`

**Interfaces:**

- Produces: `npm run test:unit`. Must not collide with `npm test` (Playwright) or `npm run test:agents`.

- [ ] **Step 1: Configure Vitest** to collect from `src/**/*.test.ts(x)` only. Exclude `e2e/` and
      `tests/` explicitly — `tests/` is the roster suite and runs under `node --test`.

- [ ] **Step 2: Test `getViewerInitials`** (`src/components/user-avatar.tsx:22`). Four fallback
      branches and none is covered: multi-word name, single-word name, email local part when the name is
      absent, and the `"U"` fallback when both are. Include a multi-byte name — the function uses
      `Array.from` for code points specifically, and a test that only uses ASCII would not notice if that
      regressed.

- [ ] **Step 3: Test `consumeRateLimit`** (phase 1, Task 2) against a mocked Prisma client: within
      budget, over budget, window expiry resets the count, and **a database error returns `false`**
      (fails closed). That last one is the security-relevant branch.

- [ ] **Step 4: Test the zod schemas** (phase 2, Task 3): the 8-character minimum, that no
      composition rule is enforced, that email is lowercased and trimmed by the schema itself, and that
      mismatched confirmations fail on the right path.

- [ ] **Step 5: Test `getClientIp`** (phase 1): `x-real-ip` wins; `x-forwarded-for` takes the first
      entry, not the last; `"unknown"` when neither is present.

- [ ] **Step 6: Verify.** `npm run test:unit` green, and the other two suites unaffected:
      `npm run test:agents`, `npm run build`. Paste the pass counts.

---

### Task 5: Validate the environment at build time

Answers 7.2, and reinforces 2.6.

**Files:**

- Create: `src/env.ts`
- Modify: `src/lib/auth/environment.ts`, `next.config.ts`

- [ ] **Step 1: Add `@t3-oss/env-nextjs`** and define the schema: `DATABASE_URL`,
      `BETTER_AUTH_SECRET`, optional `BETTER_AUTH_URL`, optional `GOOGLE_CLIENT_ID` /
      `GOOGLE_CLIENT_SECRET`, the SMTP set, `CRON_SECRET`, `NEXT_DEV_ALLOWED_ORIGIN`,
      `EMAIL_CAPTURE_FILE`. The current approach is `Boolean(process.env.X?.trim())` at request time
      (`src/lib/auth/environment.ts:9-23`), which turns a typo in a variable name into a user-visible
      failure instead of a build failure.

- [ ] **Step 2: Keep the optionality real.** `isGoogleAuthConfigured()` exists because Google is
      genuinely optional; the schema must not make the build fail without it. Model it as optional and
      keep the helper, now reading from the validated object.

- [ ] **Step 3: Do not break E2E.** `playwright.config.ts:9-22` deliberately withholds the database
      URL from a child process, and `EMAIL_CAPTURE_FILE` is a test-only variable. Read that comment
      before touching anything it describes; if strict validation would break that arrangement, say so in
      `### Blocked` rather than working around it.

- [ ] **Step 4: Verify.** `npm run build` with a complete environment, and again with
      `BETTER_AUTH_SECRET` unset — the second must fail at build with a legible message naming the
      variable. Paste both outcomes.

---

### Task 6: Structured logging

Answers 7.2.

**Files:**

- Create: `src/lib/logger.ts`
- Modify: `src/auth.ts`, `src/lib/auth/rate-limit.ts`, `src/app/api/cron/cleanup/route.ts`, `src/app/error.tsx`

- [ ] **Step 1: Add `pino`** and a small server-only wrapper. Per spec, no vendor and no account;
      OpenTelemetry is a separate decision.

- [ ] **Step 2: Replace the `console.error` calls.** Today the only telemetry is two of them
      (`src/auth.ts:33` and `:56`), so a verification email that never sends is invisible. Convert those,
      plus the rate limiter's database-error path and the cleanup route's counts.

- [ ] **Step 3: Never log a credential.** No password, no token, no reset URL, and no email address
      in a context that would defeat the uniform anti-enumeration replies. Log the _event_, not the
      subject.

- [ ] **Step 4: Verify.** `npm run build`, `npx tsc --noEmit`, `npm run lint`. Then grep your own
      diff for accidental subject logging and report the result.

---

### Task 7: Destroy the E2E Prisma pool

Answers 4.4.

**Files:**

- Modify: `e2e/helpers/auth-test-instance.ts`, and the global teardown

- [ ] **Step 1: The defect.** `e2e/helpers/auth-test-instance.ts:16-18` creates a `PrismaClient` with
      its own pool at module scope and never destroys it, so Playwright hangs after a run. Production
      code gets this right (`src/lib/db.ts:25-26`, `attachDatabasePool`).

- [ ] **Step 2: Add a teardown** that calls `$disconnect()`, wired through Playwright's
      `globalTeardown` (add it to `playwright.config.ts` if absent).

- [ ] **Step 3: Verify.** This one genuinely needs the human: ask them to run `npm test` and report
      whether the process exits on its own. Do not claim it fixed without that.

---

### Task 8: Accessibility assertions in the E2E suite

Answers 7.2, and gives phase 5 a regression net.

**Files:**

- Modify: `e2e/*.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Add `@axe-core/playwright`.** Playwright is already installed; this is one import and
      a few lines per spec.

- [ ] **Step 2: Assert on the public pages** — `/`, `/features`, `/pricing` — and on `/login`. These
      are the pages phase 5 fixes, and this is what stops them regressing.

- [ ] **Step 3: Fail on serious and critical violations only**, at first. A suite that fails on
      every minor advisory gets disabled within a week. Record the initial violation count in your report:
      it is the baseline phase 5 works against.

- [ ] **Step 4: Verify.** Human-gated. Ask for `npm test` and report the violation counts they see.

---

### Task 9: CI

Answers 7.2. The audit calls this the largest tooling gap.

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: One workflow, on pull request and on push to `main`.** Node from `.nvmrc`,
      `npm ci`, then: `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm run test:unit`,
      `npm run test:agents`, `npm run check:agents`, `npm run validate:agents`, `npm run format:check`.

- [ ] **Step 2: `npm run build` needs `prisma generate`**, which the `build` script already runs, but
      it also needs a `DATABASE_URL` present for the client to generate. Provide a dummy value in the
      workflow environment — generation does not connect. Verify that assumption; if generation does
      connect, add a Postgres service container and say so.

- [ ] **Step 3: Do not run `npm test` in CI.** Playwright here needs a real Postgres, migrations, and
      SMTP capture. Getting that right is its own task; a flaky E2E job that everyone learns to ignore is
      worse than none. Leave a comment in the workflow saying exactly that, so the omission reads as a
      decision.

- [ ] **Step 4: Add `npm audit --audit-level=high` as a non-blocking step.** It will report the three
      `deepmerge-ts` highs. That is the accepted, dev-only advisory (spec `## Out of scope`), and this
      step is how a patch upstream gets noticed.

- [ ] **Step 5: Verify.** Run every workflow step locally in order and paste the results. If `gh` is
      available and the repository has a remote, say whether the workflow file parses (`gh workflow view`
      or `act --list`); if not, say it is unverified until the first push.

---

### Task 10: Record the accepted advisory

Answers 7.1.

**Files:**

- Modify: `README.md` (a short "Known advisories" section)

- [ ] **Step 1: Write it down.** `deepmerge-ts <8.0.0` (GHSA-ggr8-5vv4-36mx, stack exhaustion,
      3 × high) reaches the tree only as `prisma` → `@prisma/config` → `deepmerge-ts`. It is a dev-time
      CLI dependency and never enters the runtime bundle. The available fix is a downgrade to
      `prisma@6.12.0`, which is a functional regression. The decision is to accept and monitor; Task 9's
      audit step is the monitor.

- [ ] **Step 2: Verify.** Re-run `npm audit` and confirm the advisory count and path still match what
      you wrote. If they have changed since the audit was written, write what is true now.

---

## Phase exit

- [ ] `npm run build && npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:agents && npm run check:agents && npm run format:check` — all green.
- [ ] Ask the human to run `npm test` and confirm the Playwright process now exits on its own (Task 7).
- [ ] Coordinator commits — Task 3's formatting pass as its own commit, separate from the rest —
      appends the delivery line to `.roster/ledger.md`, and archives it.
