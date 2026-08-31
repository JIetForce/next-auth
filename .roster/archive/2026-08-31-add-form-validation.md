# Add client-side Zod + react-hook-form validation to auth forms

## Spec

Install vetted versions: `react-hook-form@7.86.0`, `zod@4.4.3`, `@hookform/resolvers@5.9.1`. Add Zod schemas for the three existing auth forms (`CredentialsForm`, `RegisterForm`, `ResendForm`). Refactor the forms to use `useForm` with `zodResolver` for client-side validation while keeping the existing server actions (`actions.ts`) as a security fallback. Add `aria-invalid` and per-field error messages, using the existing `Label`/`Input` components and the project’s `data-invalid`/`aria-invalid` convention. Do not change auth logic, rate limiting, server error messages, page layouts, or add new shadcn components. Verify with `npm run lint`, `npx tsc --noEmit`, and a manual `npm run dev` check.

## Cycle log

### Cycle 1

- verifier: pass — `npm run lint` (0 errors, 2 pre-existing warnings), `npx tsc --noEmit` clean, `CI=1 npm run test` 35 passed/1 skipped
- code-reviewer: approved_with_notes — no required changes
- security-reviewer: approved — no required changes
- quality-reviewer: approved_with_notes — required changes listed
- resolved since cycle 0: n/a
- outstanding:
  - `src/lib/auth/schemas.ts:5,14,39` — add explicit, well-worded `message` to the three `.email()` schemas
  - `src/lib/auth/schemas.ts:6` — add an explicit `message` to the login `password` `min(1)` check
  - `src/app/(auth)/register/_components/register-form.tsx:125,160` — remove dead `minLength={6}` props now that the form has `noValidate`
  - `e2e/login.spec.ts:138` — assert the exact login validation message once it is added, instead of the loose `/invalid|valid email/i` regex

### Cycle 2

- verifier: pass — `npm run lint` (0 errors, 2 pre-existing warnings), `npx tsc --noEmit` clean, `CI=1 npm run test -- --workers=1` 35 passed/1 skipped
- code-reviewer: approved
- security-reviewer: approved
- quality-reviewer: approved
- resolved since cycle 1: all 4 required changes
- outstanding: (none)

### Delivered

- All reviewer verdicts approved, verifier green. Changes staged for commit.
