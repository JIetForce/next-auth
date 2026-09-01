# Audit remediation Phase 1 Task 6 — Register Google provider only when configured

## Spec

Plan task 6 of `docs/superpowers/plans/2026-08-31-audit-01-security.md`. Answers audit finding 2.7
(Google provider registered unconditionally).

**Files:**

- Modify: `src/auth.ts`

**What changes:**

1. Make the Google provider conditional. `socialProviders` currently always registers Google with
   `?? ""`, so a direct call with empty keys reaches Google with an empty `client_id` instead of
   failing legibly. Build the `socialProviders` object from `isGoogleAuthConfigured()` — spread in
   `google` only when it returns true. Keep `isGoogleAuthConfigured()` as the single source of that
   truth; do not duplicate the check.
2. The Server Action `login/actions.ts:12` already redirects to `/login?error=configuration` when
   unconfigured; that path must be unchanged. With Task 3's `disabledPaths` also covering
   `/sign-in/social`, there is now no way to reach an unconfigured provider at all — state that in
   `### Concerns` so the reviewers see the two tasks interlock.

**What must not change:**

- `sendEmail` stays un-awaited.
- `disabledPaths`, `rateLimit`, `baseURL`, `trustedOrigins`, `emailAndPassword`, `emailVerification`,
  `account`, `plugins` stay as-is.
- `isGoogleAuthConfigured()` in `environment.ts` stays as the single source of truth.
- Do NOT touch files under `.claude/`, `.codex/`, `.cursor/`, `.devin/`, `.agent/`, `agents/` generated
  profiles, or staged docs under `docs/`.

**How verified:** `npm run build` and `npx tsc --noEmit` with `GOOGLE_CLIENT_ID` unset, and again
with it set. Both must build. `npm test` (E2E) is not agent-runnable — report as un-run. Developer
does NOT commit.

## Cycle log

### Cycle 1

- verifier: pass — tsc/build/lint/test:agents 33/33/check:agents 35 profiles; npm test (E2E) not agent-runnable
- code-reviewer: approved — 0 required (notes: empty-object branch type-checks fine; disabledPaths interlock sound; sendEmail un-awaited preserved)
- security-reviewer: approved — 0 required (notes: accountLinking.trustedProviders still lists "google" regardless — harmless dead config when unconfigured; three independent defense layers now in place)
- quality-reviewer: approved_with_notes — 0 required (notes: `!` assertions are the only `!` in src/\*_/_.ts — other call sites use early-return guards; a guarded destructure would avoid silent coupling if isGoogleAuthConfigured's checks change; style matches trustedOrigins/baseURL convention)
- resolved since cycle 0: n/a
- outstanding: none
