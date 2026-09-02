# Audit remediation Phase 5 — UI, accessibility, SEO and content (Task 9: HTML email templates)

## Spec

Plan: `docs/superpowers/plans/2026-08-31-audit-05-ui-content.md` — Task 9.
Design spec: `docs/superpowers/specs/2026-08-31-audit-remediation-design.md` (decision D3).

Task 9 answers the react-email row of 7.2.

What changes:
- Install `@react-email/components` as dependency.
- Create react-email templates:
  - `src/lib/email/templates/verify-email.tsx`: verification email template with Siftloom branding, clear confirmation CTA button/link, and plaintext fallback copy.
  - `src/lib/email/templates/reset-password.tsx`: password reset template with Siftloom branding, reset CTA button/link, security note, and plaintext fallback copy.
- In `src/lib/email/client.ts`:
  - Extend `SendEmailInput` with optional `html?: string`.
  - Pass `html` to nodemailer transport / `captureEmail` JSON logging without breaking `text` part or capture format.
- In `src/auth.ts`:
  - Render HTML templates for verification and password reset emails inside the un-awaited async path (`void (async () => { ... })().catch(...)`), preserving anti-enumeration timing invariants.
  - Always send both HTML and plain-text versions (`text` remains intact).

What must not change:
- Un-awaited asynchronous dispatch timing in `src/auth.ts` (`sendResetPassword`, `sendVerificationEmail`) so response timing cannot reveal whether an address exists.
- Email transport (nodemailer, SMTP, and `EMAIL_CAPTURE_FILE` formatting) remains intact per D3.
- Plain-text part must remain intact so spam scoring and E2E capture parsing (`e2e/helpers/mail.ts`) continue working.

How it is verified:
- `npm run build` succeeds.
- `npx tsc --noEmit`
- `npm run lint` with 0 warnings.
- `npm run test:unit`
- `npm run test:agents`
- `npm run check:agents`
- `npm run format:check`
- Unit test verifying email templates render HTML with valid links and both `text` and `html` are passed to `sendEmail`.
- Playwright E2E (`npm test`) is human-gated — report un-run.

Security-relevant paths touched:
`src/auth.ts`, `src/lib/email/client.ts`, `package.json`

Out of scope (already decided):
- Transport change (stay on nodemailer / SMTP per D3).

## Cycle log

### Cycle 1

- verifier: pass — build/tsc/lint/unit(98/98)/agents/check:agents/format:check all green; email template rendering and anti-enumeration timing verified; npm test not run (human-gated)
- coordinator-run suite: none
- reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery

All verdicts approved, verifier passed. Committed.
