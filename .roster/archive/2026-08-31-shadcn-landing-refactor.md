# Refactor landing page with shadcn/ui components and remove mailto links

## Spec
- In `src/app/(main)/page.tsx`:
  - Refactor the FAQ section from raw `<details>` / `<summary>` tags to shadcn/ui `Accordion`, `AccordionItem`, `AccordionTrigger`, and `AccordionContent` components.
  - Use shadcn/ui `Badge` across all sections (Hero, What We Do, FAQ, Partners).
  - Use shadcn/ui `Card` components for feature cards, sneak peek previews, and partner container.
  - Remove all `mailto:` links (e.g. `mailto:siftloom@gmail.com`), replacing them with internal navigation (e.g. `/login`).

What must not change:
Siftloom copy, metrics, and visual hierarchy.
Authentication logic, Better Auth session validation, and E2E test assertions.

How it will be verified:
- `npm run lint`
- `npm run build`
- `npm run test:agents`

## Cycle log

### Cycle 1
- verifier: pass
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: rejected — 2 required
- resolved since cycle 0: 0
- outstanding:
  - src/components/ui/accordion.tsx:6: Remove fake Radix type intersection and preserve clean Base UI AccordionPrimitive.Root.Props.
  - src/app/(main)/page.tsx:307: Remove type="single" and collapsible from Accordion JSX tag.

### Cycle 2
- verifier: pass
- code-reviewer: approved — 0 required
- security-reviewer: approved — 0 required
- quality-reviewer: approved — 0 required
- resolved since cycle 1: 2
- outstanding: none

## Delivered
Delivered in cycle 2. Refactored landing page with shadcn/ui components (Accordion, Badge, Card, Button) and removed all mailto links in favour of internal routing.
