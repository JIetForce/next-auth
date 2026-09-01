# Audit remediation — Phase 5: UI, accessibility, SEO and content

> **For agentic workers:** this repository's operating contract is `AGENTS.md`. The developer does
> **not** commit.

**Goal:** close `docs/audit-2026-08-31.md` §6, 4.2, 4.3, 3.6, 5.4, 5.5, and the email-template half
of 7.2. The application ships a light theme whose decorative layers are hard-coded for dark, has no
landmark structure on its three public pages, and states marketing figures as fact.

**Spec:** `docs/superpowers/specs/2026-08-31-audit-remediation-design.md` — decisions D4 (statistics
are placeholders and come out), D5 (legal pages are engineering-drafted and need review), D6 (the
pending address travels in a cookie, not a query parameter) and D3 (email templates, transport
unchanged).

**Architecture:** Everything decorative moves onto the existing semantic tokens so one theme's
styling stops being another theme's bug. Landmarks, metadata and the two missing legal routes make
the public surface complete. Content consolidates into `src/lib/content.ts` as its single source.

**Depends on:** phase 4, Task 8 — the axe assertions are this phase's regression net, and its
recorded baseline is what "fixed" is measured against.

## Global Constraints

- The developer does **not** commit.
- Brand primary is `#2fb8ae`, exposed as `bg-primary` / `text-primary-foreground`. Never hard-code
  the hex. Use semantic tokens (`--border`, `--card`, `--muted`).
- shadcn base is `base` (Base UI), not radix — use `render={<Link href=... />}`, not `asChild`.
- Icons are `lucide-react`, sized via `data-icon`, not utility classes. Use `gap-*`, not `space-*`.
  Use `size-*` for equal dimensions.
- `e2e/auth-session.spec.ts:49` asserts the mobile navigation dialog has exactly three links, and
  `:178` uses the link name "Home". Adding a footer or a skip link must not change either.
- After phase 2, `/`, `/features` and `/pricing` are statically prerendered. Any change that
  reintroduces a request-time read on those routes undoes the phase's headline result — re-check the
  build route table at the end.

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `src/app/globals.css` | Token-based decorative layers; reduced motion; dead CSS removed | Modify |
| `src/app/layout.tsx` | Skip link, `metadataBase`, Open Graph, drop `Geist_Mono` | Modify |
| `src/app/(main)/page.tsx`, `features/page.tsx`, `pricing/page.tsx` | `<main>`, footer, per-page metadata | Modify |
| `src/components/site-footer.tsx` | Shared footer, extracted from the home page | Create |
| `src/app/robots.ts`, `src/app/sitemap.ts` | Crawl directives | Create |
| `src/app/(main)/terms/page.tsx`, `privacy/page.tsx` | Legal routes | Create |
| `src/app/(auth)/_components/auth-card-shell.tsx` | Point the legal links at real routes | Modify |
| `src/lib/content.ts` | Single source for FAQ; statistics removed | Modify |
| `src/app/(auth)/register/actions.ts`, `verify-email/page.tsx` | Pending-address cookie | Modify |
| `src/lib/email/templates/*` | react-email templates | Create |
| `e2e/helpers/mail.ts`, `scripts/*.mjs` | Dead code | Modify |

---

### Task 1: Decorative layers work in both themes

Answers 4.2.

**Files:**
- Modify: `src/app/globals.css`, `src/app/(main)/page.tsx`, `src/app/(main)/pricing/page.tsx`

- [ ] **Step 1: The three defects.** `defaultTheme="system"` (`providers.tsx:12`) means light renders
  for a large share of visitors, but: `globals.css:152-153` draws the grid in
  `rgba(255,255,255,0.03)`, invisible on `#f8fafc`; `globals.css:194` sets
  `.sl-card:hover { border-color: rgba(255,255,255,0.16) }`, which erases the border on light; and
  the accordion repeats it inline as `border-white/6 bg-white/[0.02]`
  (`(main)/page.tsx:301` and the equivalent in `pricing/page.tsx`).

- [ ] **Step 2: Move them onto tokens.** Use `--border`, `--card` and friends, or give each a `.dark`
  variant. Prefer the token: a second hard-coded colour is the same bug in a new place.

- [ ] **Step 3: Replace the inline `border-white/*` and `bg-white/*` utilities** on the accordions
  with the token equivalents. Grep for others:

```bash
grep -rn "white/\[\?0\?\.\?[0-9]" src/app src/components | grep -v node_modules
```

- [ ] **Step 4: Verify — visually, in both themes.** Build, run, and check `/`, `/features`,
  `/pricing` in light and dark. Confirm the grid is visible in light and the card hover does not
  erase its border. Screenshots or a precise description; not an assertion that it should work.

---

### Task 2: Motion and compositing

Answers the `prefers-reduced-motion` row of §6 and 5.5.

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Honour `prefers-reduced-motion`.** `.sl-card:hover` (`globals.css:189-195`) translates
  cards on every hover with no query guarding it. Wrap the transform in
  `@media (prefers-reduced-motion: no-preference)`; keep the colour transition, which is not motion.

- [ ] **Step 2: The blur layers.** Three `filter: blur(90–100px)` layers render on every public page
  (`globals.css:160-187`) and composite expensively on weak hardware. Add `will-change: filter` — or,
  if measurement says the layer is still costly, replace it with a static radial-gradient image. Say
  which you did and on what evidence.

- [ ] **Step 3: Verify.** Build and check with reduced motion enabled at the OS level that cards no
  longer translate. Report what you observed.

---

### Task 3: Delete the dead code

Answers 4.3 and 5.4.

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `e2e/helpers/mail.ts`,
  `scripts/sync-agents.mjs`, `scripts/validate-agents.mjs`

- [ ] **Step 1: `.sl-faq-item` / `.sl-faq-content`** — 32 lines of CSS (`globals.css:197-228`)
  superseded by the shadcn Accordion. Confirm nothing references them, then delete:

```bash
grep -rn "sl-faq" src e2e
```

- [ ] **Step 2: `Geist_Mono`** — loaded in `layout.tsx:11` and declared in `@theme`
  (`globals.css:11`), and `font-mono` is applied nowhere. It is a font downloaded on every visit for
  nothing. Confirm, then remove both the import and the theme entry:

```bash
grep -rn "font-mono\|geistMono\|--font-geist-mono" src
```

- [ ] **Step 3: `clearMailbox()`** (`e2e/helpers/mail.ts:28`) — exported and never called.

- [ ] **Step 4: The two lint warnings.** Unused `roles` (`scripts/sync-agents.mjs:231`) and unused
  `tool` (`scripts/validate-agents.mjs:29`). These are the only two warnings in the repository;
  removing them makes `npm run lint` silent, which is what makes a future warning noticeable.

- [ ] **Step 5: Verify.** `npm run lint` with **zero** warnings, `npm run build`, `npx tsc --noEmit`,
  `npm run test:agents` (Step 4 edits roster scripts — this is the check that matters),
  `npm run check:agents`.

---

### Task 4: Landmarks, skip link, and a footer on every public page

Answers three rows of §6.

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/(main)/page.tsx`, `features/page.tsx`, `pricing/page.tsx`
- Create: `src/components/site-footer.tsx`

- [ ] **Step 1: `<main>` on the three public pages.** They currently open with a `<div>`, so
  screen-reader landmark navigation has nothing to jump to. `(auth)/layout.tsx:10` and
  `profile/page.tsx:31` already do this correctly — follow them. Exactly one `<main>` per page.

- [ ] **Step 2: A skip link** as the first focusable element in `src/app/layout.tsx`: visually hidden
  until focused, targeting the `<main>` id. With a sticky header and a full navigation, a keyboard
  user currently tabs through everything on every page.

- [ ] **Step 3: Extract the footer.** It exists only on the home page (`(main)/page.tsx:426`), so
  `/features` and `/pricing` simply stop. Move it to `src/components/site-footer.tsx` unchanged and
  render it on all three. Keep it a server component.

- [ ] **Step 4: Verify.** Build, then check each page has exactly one `<main>`, that Tab from a fresh
  load reveals the skip link first and that it moves focus, and that the footer renders on all three.
  Re-run the axe assertions from phase 4 Task 8 and report the change against their baseline.

---

### Task 5: Metadata, Open Graph, robots and sitemap

Answers four rows of §6.

**Files:**
- Modify: `src/app/layout.tsx`, and the three public pages
- Create: `src/app/robots.ts`, `src/app/sitemap.ts`, an Open Graph image

- [ ] **Step 1: Per-page `metadata`.** None of the three public pages exports any, so all of them
  inherit the landing page's title. `profile/page.tsx:16-23` shows the house pattern, including
  `robots: { index: false }` — keep that on `/profile`.

- [ ] **Step 2: `metadataBase`, `openGraph` and `twitter`** in the root layout (`layout.tsx:16-25`).
  `metadataBase` must come from the same resolved public base URL phase 1 Task 5 introduced — do not
  add a second source of truth for the deployment origin.

- [ ] **Step 3: An Open Graph image.** Either a static asset in `public/` or Next's
  `opengraph-image` convention — read
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/` before
  choosing.

- [ ] **Step 4: `robots.ts` and `sitemap.ts`.** The sitemap lists the public routes only: `/`,
  `/features`, `/pricing`, `/terms`, `/privacy`. Robots disallows `/profile`, `/api/`, and the auth
  routes. Read the file-convention docs — these are typed file conventions, not hand-written text
  files.

- [ ] **Step 5: Verify.** Build, then fetch `/robots.txt` and `/sitemap.xml` and paste the bodies.
  Confirm each public page's `<title>` differs. **Confirm the three marketing routes are still `○`
  in the build table** — a metadata function that reads request data would undo phase 2.

---

### Task 6: Terms and Privacy

Answers the "links point at `/`" row of §6. **Read spec D5 first — it carries an explicit assumption.**

**Files:**
- Create: `src/app/(main)/terms/page.tsx`, `src/app/(main)/privacy/page.tsx`
- Modify: `src/app/(auth)/_components/auth-card-shell.tsx`

- [ ] **Step 1: The defect.** `auth-card-shell.tsx:53` and `:60` present "Terms of Service" and
  "Privacy Policy" as links, and both go to `/`. A sign-up consent line pointing at the landing page
  is worse than no line.

- [ ] **Step 2: Write only what is true of this application**, derived from the code, not from
  boilerplate: the service is free (`content.ts:30`); the data held is name, email and avatar
  (`prisma/schema.prisma:13-26`); sessions are rows in Postgres with an expiry; email is used for
  verification and password reset only (`src/auth.ts:19-58`); Google sign-in is optional and links to
  the same account. Include how to request deletion.

- [ ] **Step 3: State the limit in your report.** These pages are engineering-drafted from observable
  behaviour and are **not legal advice**; they need review by a lawyer before public launch. Put that
  in `### Concerns` so the coordinator surfaces it to the human — do not put a disclaimer to that
  effect on the public page itself.

- [ ] **Step 4: Point the links at the new routes**, and add both to the sitemap from Task 5.

- [ ] **Step 5: Verify.** Build; both routes render and are static; both links resolve from `/login`
  and `/register`.

---

### Task 7: One content source, and the placeholder statistics out

Answers 3.6 and the statistics paragraph of §6. **Spec decision D4.**

**Files:**
- Modify: `src/lib/content.ts`, `src/app/(main)/page.tsx`, `src/app/(main)/pricing/page.tsx`

- [ ] **Step 1: The FAQ split.** `content.ts:25-43` holds three entries; the landing page renders
  those and then appends two more inline (`(main)/page.tsx:311-337`); `/pricing` renders only the
  three. Two answers exist on exactly one page and are not edited with the rest. Move both into
  `sharedFaqs`, then decide per page which subset it renders — explicitly, from the shared array.

- [ ] **Step 2: Remove the statistics.** Per D4 they are placeholders: delete `partnerStats`
  (`content.ts:1-17`) and the "Trusted by 10,000+ modern professionals" line
  (`(main)/page.tsx:94`), and replace them with copy that makes no numeric claim. Presenting
  unverified figures as fact on a public site is a claim someone has to stand behind.

- [ ] **Step 3: Remove the renderer too**, not just the data — leaving an empty statistics band is a
  layout bug. Check the surrounding spacing still reads correctly.

- [ ] **Step 4: Verify.** Build; `/` and `/pricing` render the FAQ from the shared source; no
  numeric claim survives:

```bash
grep -rn "10,000\|5,000\|48%" src
```

---

### Task 8: `/verify-email` remembers the pending address

Answers the last row of §6. **Spec decision D6.**

**Files:**
- Modify: `src/app/(auth)/register/actions.ts`, `src/app/(auth)/verify-email/page.tsx`,
  `verify-email/_components/resend-form.tsx`

- [ ] **Step 1: The defect.** `registerAction` redirects to `/verify-email`
  (`register/actions.ts:62`) carrying nothing, so the user retypes the address they just entered.

- [ ] **Step 2: Set a short-lived cookie** before the redirect: `httpOnly`, `sameSite: "lax"`,
  `secure` outside development, a lifetime of roughly 30 minutes. **Not a query parameter** — that
  would put an email address in browser history, server logs and any outbound `Referer`, which is the
  exact leak the uniform anti-enumeration replies elsewhere in this codebase exist to prevent.

- [ ] **Step 3: Read it on the page** and prefill the resend form. The field stays editable, and the
  page must still work with no cookie — someone arriving from an email link on another device has
  none.

- [ ] **Step 4: Do not change the resend action's reply.** `verify-email/actions.ts:11-13` returns one
  message for every outcome. Prefilling the form must not add a "we know this address" signal.

- [ ] **Step 5: Verify.** Build, then walk the flow: register, land on `/verify-email`, confirm the
  address is prefilled; then open `/verify-email` in a clean context and confirm it renders an empty,
  working form. Report both.

---

### Task 9: HTML email templates

Answers the react-email row of 7.2. **Spec decision D3 — transport is not touched.**

**Files:**
- Create: `src/lib/email/templates/verify-email.tsx`, `reset-password.tsx`
- Modify: `src/auth.ts`, `src/lib/email/client.ts`

- [ ] **Step 1: Add `@react-email/components`** and build the two messages currently assembled as
  string arrays in `src/auth.ts:25-31` and `:48-54`.

- [ ] **Step 2: Both parts, always.** Render each template to HTML and keep a plain-text
  alternative — the existing text is good and should survive as that alternative. A verification mail
  with no text part scores worse with spam filters, which is the opposite of the goal.

- [ ] **Step 3: Extend `sendEmail` minimally.** It gains an optional `html` alongside `text`;
  nothing else about its interface changes. Per D3, nodemailer and SMTP stay, so
  `EMAIL_CAPTURE_FILE` keeps working — **verify that explicitly**, since the E2E suite reads captured
  mail to extract verification and reset links, and breaking the capture format breaks every one of
  those tests silently.

- [ ] **Step 4: Preserve the timing property.** `src/auth.ts` dispatches mail without `await` on
  purpose (`auth.ts:20-21`, `41-44`), so response timing cannot reveal whether an address exists.
  Rendering a template must happen inside that un-awaited path, not before it.

- [ ] **Step 5: Verify.** `npm run build`, `npx tsc --noEmit`, `npm run lint`. Then trigger a
  registration with `EMAIL_CAPTURE_FILE` set and paste the captured message, showing both parts are
  present and the link is intact. E2E confirmation is human-gated.

---

## Phase exit

- [ ] `npm run build && npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:agents && npm run check:agents && npm run format:check` — all green, with **zero** lint warnings.
- [ ] The build route table still shows `/`, `/features`, `/pricing` as `○`. Paste it.
- [ ] The axe violation count from phase 4 Task 8 is lower than its recorded baseline. Paste both numbers.
- [ ] Ask the human to run `npm test`.
- [ ] Surface to the human: the Terms and Privacy pages need a lawyer's review before public launch (Task 6).
- [ ] Coordinator commits, appends the delivery line to `.roster/ledger.md`, archives it.

---

## After all five phases

Every finding in `docs/audit-2026-08-31.md` is then either fixed or explicitly accepted with a reason
recorded in the spec's `## Out of scope`. The traceability table at the end of
`docs/superpowers/specs/2026-08-31-audit-remediation-design.md` is the checklist for confirming that.
