# Audit remediation Phase 1 Task 2 — defect fix: getClientIp runtime crash
## Spec
Defect in the delivered Task 2. `src/lib/auth/client-ip.ts` calls `ipAddress(headers)` from
`@vercel/functions`. At runtime `headers()` from `next/headers` returns a sealed `HeadersAdapter`
(`node_modules/next/dist/server/web/spec-extension/adapters/headers.js`: `class HeadersAdapter
extends Headers`, constructor sets `this.headers = new Proxy(...)`). `ipAddress` does
`const headers = "headers" in input ? input.headers : input;` (`@vercel/functions/headers.js`).
For a `HeadersAdapter`, `"headers" in input` is true, so it takes `input.headers` (the Proxy over a
plain object) whose `.get` is not a function → `TypeError: headers.get is not a function` at
`client-ip.ts:15`. Reproduces on every auth action call.

**Fix:** stop calling `ipAddress`. For the IP field, `ipAddress` is exactly
`getHeader(headers, "x-real-ip")` i.e. `headers.get("x-real-ip")` (`IP_HEADER_NAME = "x-real-ip"` in
`@vercel/functions/headers.js`). Read `x-real-ip` directly via `headers.get("x-real-ip")`, then keep
the existing first-entry `x-forwarded-for` fallback and `"unknown"` terminal. Drop the
`@vercel/functions` import. Update the doc comment to record WHY we read the header directly instead
of using `ipAddress` (the `HeadersAdapter.headers` duck-typing trap). Signature
`getClientIp(headers: Headers): string` unchanged. `import "server-only"` stays.

**What must not change:** the four action call sites (`getClientIp(await headers())`), the
x-forwarded-for first-entry fallback, the `"unknown"` terminal, everything else in Task 2.

**How verified (this time, runtime):** `npm run build`, `npx tsc --noEmit`, `npm run lint`. THEN start
the dev server and curl an auth action endpoint that exercises `getClientIp`, confirming no
`headers.get is not a function` and a normal response (not a 500). Paste the real curl output.
Developer does NOT commit.
## Cycle log

### Cycle 1 (defect fix)
- verifier: pass — tsc/build/lint/test:agents 33/33/check:agents 35 profiles; RUNTIME: GET /login 200, POST Google-OAuth action 303 (no TypeError), direct unit test reproducing HeadersAdapter .headers-Proxy trap 5/5, negative test confirms old ipAddress throws "headers.get is not a function". (500 on credentials action is a curl/useActionState harness artifact — formData undefined at actions.ts:41, before getClientIp; not the defect.)
- code-reviewer: approved — 0 required (note: `fromPlatform` name now slightly stale, cosmetic)
- security-reviewer: approved — 0 required (note: absent-case returns null vs undefined — both falsy, control flow identical; not literally byte-equivalent in absent case but security property preserved)
- quality-reviewer: approved_with_notes — 0 required (note: `fromPlatform` could be renamed `realIp`; WHY comment is right length)
- resolved since cycle 0: the runtime crash
- outstanding: none

### Delivery
All verdicts approved/approved_with_notes with zero required changes; verifier passed with runtime evidence. Committed (client-ip.ts only).
