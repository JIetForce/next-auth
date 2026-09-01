# Audit remediation Phase 1 Task 5 — Base URL and trusted origins for production

## Spec

Plan task 5 of `docs/superpowers/plans/2026-08-31-audit-01-security.md`. Answers audit finding 2.6
(`BETTER_AUTH_URL` / no `trustedOrigins`). Read spec C-corrections before starting.

**Files:**

- Modify: `src/auth.ts`, `src/lib/auth/environment.ts`, `.env.example`

**What changes:**

1. Add `getPublicBaseUrl()` to `src/lib/auth/environment.ts`, resolving in order:
   `BETTER_AUTH_URL` when set (explicit wins, so a custom domain keeps working) →
   `https://${VERCEL_PROJECT_PRODUCTION_URL}` → `https://${VERCEL_URL}` (preview deployments) →
   `http://localhost:3000`. Comment why the order is that way.
2. Pass `baseURL: getPublicBaseUrl()` in `src/auth.ts`, and set `trustedOrigins` explicitly to the
   resolved base URL plus, when `VERCEL_ENV === "preview"`, the preview host. Note in a comment that
   CSRF protection on the endpoints that stay open derives from this, so it is not cosmetic.
3. Document it in `.env.example`: the current line `BETTER_AUTH_URL="http://localhost:3000"` is a
   deployment trap — copied into Vercel it produces `redirect_uri=http://localhost:3000/...` on every
   OAuth request. Add a comment above it saying: local development only; in production either leave it
   unset so it derives from `VERCEL_PROJECT_PRODUCTION_URL`, or set it to the real public origin.

**What must not change:**

- `sendEmail` stays un-awaited in `src/auth.ts`.
- The `disabledPaths` and `rateLimit` config from Task 3 stay as-is.
- The `isAuthSessionConfigured` / `isGoogleAuthConfigured` helpers in `environment.ts` stay.
- Do NOT touch files under `.claude/`, `.codex/`, `.cursor/`, `.devin/`, `.agent/`, `agents/` generated
  profiles, or staged docs under `docs/`.
- `server-only` import stays at the top of `environment.ts`.

**How verified:** `npm run build`, `npx tsc --noEmit`. The plan's node CLI import check cannot run
against TypeScript directly — verify by reading the code instead; phase 4 adds Vitest. `npm test` (E2E)
is not agent-runnable — report as un-run. Developer does NOT commit.

## Cycle log

### Cycle 1

- verifier: pass — tsc/build/lint/test:agents 33/33/check:agents 35 profiles; npm test (E2E) not agent-runnable
- code-reviewer: approved_with_notes — 0 required (notes: trustedOrigins duplicates Better Auth's auto-added baseURL origin — harmless; VERCEL_PROJECT_PRODUCTION_URL present on preview too so tier 3 effectively unreachable on real Vercel — intentional per plan; new URL throws on schemeless BETTER_AUTH_URL — operator fail-closed)
- security-reviewer: approved_with_notes — 0 required (notes: new URL throws on malformed BETTER_AUTH_URL — operator-controlled fail-closed; https:// prefix assumes bare Vercel hostname — platform-guaranteed; VERCEL_URL trust safe — platform-injected not client-derived; no secrets introduced)
- quality-reviewer: approved_with_notes — 0 required (notes: comment for VERCEL_PROJECT_PRODUCTION_URL could cross-reference auth.ts trustedOrigins coupling; getPublicBaseUrl is file's first value-returning env helper — reasonable shape)
- resolved since cycle 0: n/a
- outstanding: none
