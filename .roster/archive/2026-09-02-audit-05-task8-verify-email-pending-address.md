# Audit remediation Phase 5 — UI, accessibility, SEO and content (Task 8: /verify-email remembers the pending address)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-05-ui-content.md` — Task 8.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md` (decision D6).

Task 8 answers the last row of §6 in audit.

What changes:
- In `src/app/(auth)/register/actions.ts`:
  - Set a short-lived cookie `pending_verification_email` before redirecting to `/verify-email`:
    `httpOnly: true`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`, `maxAge: 30 * 60` (30 mins), `path: "/verify-email"`.
- In `src/app/(auth)/verify-email/page.tsx`:
  - Read `pending_verification_email` from `cookies()` (defaulting to empty string if absent).
  - Pass `defaultEmail` to `<ResendForm />`.
- In `src/app/(auth)/verify-email/_components/resend-form.tsx`:
  - Accept optional `defaultEmail?: string` prop and set as default value in `useForm({ defaultValues: { email: defaultEmail ?? "" } })`. Field remains editable.
- Resend action reply (`verify-email/actions.ts`) remains unchanged with uniform anti-enumeration messaging.

What must not change:
- Resend action uniform response behavior (`verify-email/actions.ts:11-13`).
- Page must continue to work normally with an empty form when no cookie is present.
- Never use a query parameter for email address on redirect (avoids browser history/log leaks).

How it is verified:
- `npm run build` succeeds.
- `npx tsc --noEmit`
- `npm run lint` with 0 warnings.
- `npm run test:unit`
- `npm run test:agents`
- `npm run check:agents`
- `npm run format:check`
- Unit test verifying cookie setting in `registerAction` and prefill handling in `verify-email`.
- Playwright E2E (`npm test`) is human-gated — report un-run.

Security-relevant paths touched:
`src/app/(auth)/register/actions.ts`, `src/app/(auth)/verify-email/page.tsx`, `src/app/(auth)/verify-email/_components/resend-form.tsx`

Out of scope (already decided):
- HTML email templates (Task 9).

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/unit(85/85)/agents/check:agents/format:check all green; cookie security flags and prefill behavior verified; npm test not run (human-gated)
- coordinator-run suite: none
- reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved, verifier passed. Committed.
