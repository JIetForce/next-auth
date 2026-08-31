# Audit remediation Phase 1 Task 1 — RateLimit model, expiry indexes, one migration
## Spec
Plan task 1 of `docs/superpowers/plans/2026-08-31-audit-01-security.md`. Answers audit findings 2.1
(storage prerequisite) and 2.9 (expiry indexes). Add a `RateLimit` Prisma model matching Better Auth's
database rate-limit table shape (`node_modules/@better-auth/core/dist/db/get-tables.mjs:33-56`:
`key` string unique, `count` number, `lastRequest` number bigint, implicit `id`), with `@@map("rateLimit")`.
Add `@@index([expiresAt])` to `Session` and `Verification` without removing existing indexes. Cross-check
against `npx @better-auth/cli generate --config src/auth.ts`. Create one migration
`prisma/migrations/<ts>_rate_limit_and_expiry_indexes/migration.sql` via `npx prisma migrate dev` (DIRECT_URL
is set in `.env.local`); if no DB is reachable, generate SQL via `prisma migrate diff` and file `### Blocked`
that it is unapplied. Verify: `npx prisma validate`, `npm run build`, `npx tsc --noEmit`. Developer does NOT
commit. Do not touch the staged audit/plan docs.
## Cycle log

### Cycle 1
- verifier: pass — all 6 commands green (prisma validate, build, tsc, lint 0 errors, test:agents 33/33, check:agents 35 profiles)
- code-reviewer: approved — 0 required
- security-reviewer: approved_with_notes — 0 required (notes: unbounded `key` length → DoS-on-limiter vector for Task 2 to hash/length-bound; no `@@index([lastRequest])` so rate-limit prune will seq-scan — consider in Task 2/7; both in-spec for Task 1)
- quality-reviewer: approved_with_notes — 0 required (notes: `lastRequest BigInt` diverges from DateTime convention — spec-mandated; no createdAt/updatedAt — spec-driven; cosmetic type-column alignment)
- resolved since cycle 0: n/a
- outstanding: none

### Delivery
All verdicts approved/approved_with_notes with zero required changes; verifier passed. Committed (schema + migration only; audit/plan/spec docs excluded per user instruction).
