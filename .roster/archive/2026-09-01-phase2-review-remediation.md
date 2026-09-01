# Post-Phase-2 code review remediation (rate-limit ordering, provider deduplication, password constant, error ARIA)

## Spec

### What changes

1. **IP rate limit before schema validation in Server Actions:**
   - `src/app/(auth)/login/actions.ts`: consume IP rate limit (`signin:ip:${ip}`) before `signInSchema.safeParse`. If valid, consume email rate limit (`signin:email:${email}`).
   - `src/app/(auth)/register/actions.ts`: consume IP rate limit (`register:ip:${ip}`) before `registerSchema.safeParse`. If valid, consume email rate limit (`register:email:${email}`).
   - `src/app/(auth)/reset-password/actions.ts`:
     - in `requestPasswordResetAction`: consume IP rate limit (`request-reset:ip:${ip}`) before `forgotPasswordSchema.safeParse`. If valid, consume email rate limit.
     - in `resetPasswordAction`: consume IP rate limit (`reset-password:ip:${ip}`) before token / schema validation.
   - `src/app/(auth)/verify-email/actions.ts`: consume IP rate limit (`resend-verification:ip:${ip}`) before `resendSchema.safeParse`.

2. **Deduplicate provider labels in accounts helper:**
   - `src/lib/auth/accounts.ts`: deduplicate `accounts.map((a) => a.providerId)` using `new Set` before sorting and label mapping.

3. **Single password length constant:**
   - `src/lib/auth/schemas.ts`: export `MIN_PASSWORD_LENGTH = 8` and use in `passwordField`.
   - `src/auth.ts`: import and use `MIN_PASSWORD_LENGTH` for `minPasswordLength`.
   - `src/app/(auth)/register/_components/register-form.tsx` and `src/app/(auth)/reset-password/_components/reset-password-form.tsx`: reference `MIN_PASSWORD_LENGTH` in placeholder / hint text.

4. **Accessibility on route error boundary:**
   - `src/app/error.tsx`: add `role="alert"` and `aria-live="assertive"` to the error container.

### What must not change

- Uniform anti-enumeration responses across all Server Actions (responses must not vary by account existence or input validity).
- Rate limit keys, windows, and thresholds.
- `server-only` imports and Server/Client separation.
- `npm run build && npx tsc --noEmit && npm run lint && npm run test:agents && npm run check:agents` remain green.

### How it is verified

- `npm run build && npx tsc --noEmit && npm run lint && npm run test:agents && npm run check:agents` pass.

## Cycle log

### Cycle 1
- verifier: pass
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved_with_notes — 0 required
- resolved since cycle 0: 0
- outstanding: none

### Delivery
All verdicts approved or approved_with_notes, verifier passed. Committed.
