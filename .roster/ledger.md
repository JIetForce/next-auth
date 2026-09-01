# Audit remediation Phase 2 — Task 4: Cache the session in a signed cookie

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-02-architecture.md` — Task 4.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 4 answers audit findings 3.2 and 5.2: Session SELECT on every request.

What changes:

- `src/auth.ts`: add `session.cookieCache: { enabled: true, maxAge: 300 }` so `auth.api.getSession` reads from a signed cookie instead of hitting Postgres on every request. React's `cache()` in `session.ts` dedupes within one render but not across requests.

What must not change:

- The trade-off (a revoked session stays usable for up to maxAge) must be recorded in `### Concerns` so Phase 3's rewrite of `docs/auth-architecture.md` picks it up.
- Sign-out must still take effect immediately (Better Auth clears the cache cookie on sign-out) — this is E2E and human-gated.

How it is verified:

- `npm run build`, `npx tsc --noEmit` green.
- `npm test` (Playwright) is human-gated — the behavioural check (sign-out still immediate) is E2E.

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/test:agents(33/33)/check:agents(35 profiles) all green; npm test not run (human-gated)
- code-reviewer: approved_with_notes — 0 required; confirmed config shape correct for Better Auth 1.7.2, maxAge in seconds, sign-out stays immediate, placement sensible; noted stale doc pointer (Phase 3 covers), runtime boundary with ReadonlyRequestCookiesError in Server Components (E2E will confirm)
- security-reviewer: approved_with_notes — 0 required; confirmed HMAC-SHA256 signed cookie (not encrypted — base64 payload decodes to JSON), maxAge 300 acceptable, sensitive endpoints use disableCookieCache, no session-fixation/hijacking risk, cache tied to session_token
- quality-reviewer: approved_with_notes — 0 required; noted comment shorthand "getSession()" vs actual call, stale doc link (Phase 3 covers)
- outstanding: none — all notes are non-blocking. The stale doc pointer is explicitly Phase 3's job. The "signed not encrypted" note from security-reviewer is informational — the spec does not require encryption, and the cookie contains the user's own data.
- delivery: committed as `feat(auth): enable signed cookie session cache to eliminate per-request Postgres SELECT`
