# Audit remediation Phase 1 Task 3 — close HTTP credential surface, configure Better Auth limiter
## Spec
Plan task 3 of `docs/superpowers/plans/2026-08-31-audit-01-security.md`. Answers audit finding 2.1.
Read spec C1 first — this task is where the audit's own proposal is deliberately not followed.

**Files:**
- Modify: `src/auth.ts`
- Modify: `e2e/auth-session.spec.ts` (AMENDMENT — see below)

**What changes:**
1. Add `disabledPaths` to the `betterAuth({...})` options in `src/auth.ts`:
   ```ts
   disabledPaths: [
     "/sign-in/email",
     "/sign-up/email",
     "/sign-in/social",
     "/forget-password",
     "/reset-password",
     "/send-verification-email",
     "/sign-out",
   ],
   ```
   With the comment from the plan explaining why (every credential flow goes through a Server Action
   calling auth.api.* directly; Better Auth's rate limiter runs only in the router's onRequest hook,
   so an HTTP caller would bypass both the limiter below AND the per-action limits; disabling leaves
   the Server Action as the only door; paths kept open are the ones the browser reaches by following
   an emailed or redirected link, not by script).

2. Add `rateLimit` as defence in depth over what remains open:
   ```ts
   rateLimit: {
     enabled: true,   // on in development too, so E2E exercises it
     storage: "database",
     window: 60,
     max: 100,
     customRules: {
       "/callback/*": { window: 60, max: 20 },
       "/verify-email": { window: 3600, max: 20 },
       "/reset-password/*": { window: 3600, max: 20 },
     },
   },
   ```

3. **E2E amendment (resolved with user):** The pre-flight grep (Step 1) found two E2E tests calling
   HTTP endpoints that `disabledPaths` would 404. The user decided: rewrite or delete them as
   appropriate. Specifically:
   - `e2e/auth-session.spec.ts:74` "signs out through the raw endpoint" — POST /api/auth/sign-out.
     This test's unique purpose was exercising the raw HTTP endpoint, which is being disabled.
     Sign-out via the UI button is already covered by tests at lines 221, 245, 272. DELETE this test
     as no longer needed; add a comment at its former location noting it was removed because
     /sign-out is now in disabledPaths and sign-out is covered by the button-click tests below.
   - `e2e/auth-session.spec.ts:90` "returns a Google URL and ignores a caller-supplied destination" —
     POST /api/auth/sign-in/social. Rewrite to exercise `signInWithGoogle` via the login page's
     Google sign-in button (click it, expect a redirect to accounts.google.com). The action hardcodes
     `callbackURL: "/"` and never accepts a caller-supplied destination, so the "ignores a
     caller-supplied destination" assertion is inherently enforced and the 403-rejection assertion is
     no longer applicable — remove those with a comment explaining why. Keep the
     `test.skip(!googleConfigured, ...)` guard.

**What must not change:**
- `sendEmail` must stay un-awaited in `src/auth.ts`. Do not "fix" the missing `await`.
- The `socialProviders.google` config, `account.accountLinking`, `emailAndPassword`, `emailVerification`
  blocks — do not change them (Task 6 makes Google conditional; not this task).
- `nextCookies()` must stay last in plugins.
- Do NOT touch files under `.claude/`, `.codex/`, `.cursor/`, `.devin/`, `.agent/`, `agents/` generated
  profiles, or the staged docs under `docs/`.
- Other E2E tests in `auth-session.spec.ts` must keep passing unchanged.

**How verified:** `npm run build`, `npx tsc --noEmit`, `npm run lint`. THEN runtime check (REQUIRED —
learned from Task 2 defect): start dev server, curl a disabled path (`POST /api/auth/sign-in/email`)
→ expect 404; curl an open path (`GET /api/auth/verify-email?token=not-a-real-token`) → expect NOT 404
(a 4xx from token validation is correct). Paste real status codes. `npm test` (full E2E) is not
agent-runnable — report as un-run. Developer does NOT commit.
## Cycle log

### Cycle 1
- verifier: pass — tsc/build/lint/test:agents 33/33/check:agents 35 profiles; RUNTIME: sign-in/email 404, verify-email 401 (not 404), sign-out 404 — all as expected
- code-reviewer: approved — 0 required
- security-reviewer: rejected — 1 required: `/forget-password` in disabledPaths is the wrong path; actual Better Auth endpoint is `/request-password-reset` (`node_modules/better-auth/dist/api/routes/password.mjs:21`). `/forget-password` matches nothing (exact-string includes), so `POST /api/auth/request-password-reset` stays open, bypassing the Server Action's per-email rate limit. Fix: replace `/forget-password` with `/request-password-reset` in `src/auth.ts:22`.
- quality-reviewer: approved_with_notes — 0 required (notes: node_modules line citation in comment will go stale; customRules lack per-rule rationale comments; trailing inline comment style divergence)
- resolved since cycle 0: n/a
- outstanding: 1 required — replace `/forget-password` with `/request-password-reset` in src/auth.ts disabledPaths

### Cycle 2
- verifier: pass — tsc/build/lint/test:agents 33/33/check:agents 35 profiles; RUNTIME: request-password-reset 404, sign-in/email 404, verify-email 401 (not 404) — all correct
- code-reviewer: approved — 0 required (confirmed all 7 disabledPaths map to real Better Auth endpoints via createAuthEndpoint grep)
- security-reviewer: approved_with_notes — 0 required (notes: /change-password and other session-gated POSTs remain HTTP-reachable but require authenticated session — outside anonymous-surface closure; not exploitable by this threat model)
- quality-reviewer: approved — 0 required (notes: docs/spec/plan still reference /forget-password — stale artefacts, not runtime code)
- resolved since cycle 1: 1 (the /forget-password → /request-password-reset fix)
- outstanding: none

### Delivery
All verdicts approved/approved_with_notes with zero required changes; verifier passed with runtime evidence. Committed (src/auth.ts + e2e/auth-session.spec.ts only; audit/plan/spec docs excluded per user instruction).
