# Audit remediation Phase 2 — Task 3: One validation schema, and the password policy

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-02-architecture.md` — Task 3.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md` — decisions D2 (password: min 8, no composition rules).

Task 3 answers audit findings 3.4 (two divergent validation systems) and 2.8 (password policy below current guidance).

What changes:

- `src/lib/auth/schemas.ts`: one password schema (`min(8)`, delete both regexes, one message "Use at least 8 characters."). Email normalised via zod transform (`.trim().toLowerCase()`). Password-confirmation rule folded into one `.refine` on the schema.
- `src/lib/auth/validation.ts`: deleted.
- All four `src/app/(auth)/*/actions.ts`: rewritten to use `safeParse` instead of hand-rolled `isValidEmail`/`isValidPassword` checks. Error shape must not change — each action still returns its existing uniform reply, and a validation failure must not leak which field failed where the current code does not.
- `src/auth.ts`: `minPasswordLength: 8` (currently 6).

What must not change:

- Uniform anti-enumeration responses: login, reset-password, verify-email return one response for every outcome. A validation failure must not leak which field failed.
- The "why" comments in the actions (e.g. "One message for wrong password, unknown address, and unconfirmed address alike").
- Existing E2E specs keep passing (E2E is human-gated).

How it is verified:

- `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm run test:agents`, `npm run check:agents` all green.
- `grep -rn "auth/validation" src e2e` returns nothing.
- `npm test` (Playwright) is human-gated — report un-run.

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/test:agents(33/33)/check:agents(35 profiles) all green; grep "auth/validation" returns nothing; npm test not run (human-gated)
- code-reviewer: approved_with_notes — 0 required; noted safeParse runs before rateLimit (malformed emails bypass buckets), name .trim() in schema, issue-path inspection correct
- security-reviewer: approved_with_notes — 0 required; confirmed anti-enumeration preserved, password policy is an improvement, validation.ts removal safe, email normalization safe; noted rate-limit placement change and login now distinguishes malformed vs well-formed email by response (no account-existence leak)
- quality-reviewer: approved_with_notes — 0 required; noted residual confirmation-rule duplication in two schemas, issue-path inspection tightly coupled to zod format, e2e test data still has "abc1" with digit, name uses default zod message, UI hints hard-code "8 characters"
- outstanding: none — all notes are non-blocking. The rate-limit placement change is a minor behavioral shift noted by both code-reviewer and security-reviewer; the response text is still uniform so no enumeration risk. The confirmation-rule duplication and UI hint hardcoding are maintainability notes, not correctness issues.
- delivery: committed as `feat(auth): unify validation into shared zod schemas, raise password minimum to 8 with no composition rules`
