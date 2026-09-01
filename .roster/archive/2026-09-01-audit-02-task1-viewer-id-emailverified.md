# Audit remediation Phase 2 — architecture & performance (Task 1: Viewer gains id and emailVerified)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-02-architecture.md` — Task 1.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md`.

Task 1 answers audit finding 3.3: `Viewer` carries no `id` or `emailVerified`.

What changes:

- `src/lib/auth/types.ts`: `Viewer` gains required `id: string` and `emailVerified: boolean`.
- `src/lib/auth/session.ts`: `getCurrentViewer` projects the two new fields, keeping existing `.trim()` normalisation for name/email. Add a comment explaining why `id` is in the DTO (ownership checks need it; alternatives are a second DB round-trip or comparing by email).
- `e2e/auth-session.spec.ts` / `e2e/helpers/auth-session.ts`: the allowlist assertion at :188 checks rendered output, not the DTO, so it needs no change for Task 1 alone. BUT adding required fields to `Viewer` breaks `E2E_VIEWER` (used as a `Viewer`-typed default in the helper) and the `toMatchObject(E2E_VIEWER)` assertion at :111. The helper must be adjusted so display defaults (name/email/image) stay separate from DB-derived fields (id/emailVerified).

What must not change:

- The `Viewer` allowlist stays an allowlist — no spreading `session.user`.
- Existing `.trim()` normalisation for name/email stays exactly as is.
- Uniform anti-enumeration responses, server/client separation, roster tooling green.
- Existing E2E specs keep passing (E2E is human-gated; report un-run).

How it is verified:

- `npm run build`, `npx tsc --noEmit`, `npm run lint` all green.
- `npm run test:agents && npm run check:agents` green.
- `npm test` (Playwright) is human-gated — report un-run.

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/test:agents(33/33)/check:agents(35 profiles) all green; npm test not run (human-gated)
- code-reviewer: approved_with_notes — 0 required; noted id/emailVerified reach client leaves via full Viewer DTO, future split may be warranted
- security-reviewer: changes_requested — 3 required (ClientViewer type, project display-only fields in header-account, change UserMenu/UserAvatar/getViewerInitials to accept ClientViewer)
- quality-reviewer: approved_with_notes — 0 required; noted comment uses `authorId` but repo convention is `userId`; auth-architecture.md now stale (Phase 3 covers it)
- resolved since cycle 0: n/a (first cycle)
- outstanding: none — coordinator overruled security-reviewer's ClientViewer request as out of scope for Task 1 (id/emailVerified are the user's own non-sensitive data already exposed by Better Auth's /api/auth/get-session; the plan explicitly widens Viewer and lists these components as consumers; a ClientViewer split is a separate architectural decision). quality-reviewer's authorId→userId note is non-blocking and the wording comes from the plan itself.
- delivery: committed as `feat(auth): widen Viewer DTO with id and emailVerified for server-side ownership checks`
