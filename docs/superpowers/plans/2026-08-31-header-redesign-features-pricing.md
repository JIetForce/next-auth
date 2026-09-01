# Header Redesign + Features/Pricing Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the shared `Header` with centered nav + brand-color active pill, and build real `/features` and `/pricing` marketing pages so the nav links no longer 404.

**Architecture:** The header becomes a server component that renders a new client `HeaderNav` (uses `usePathname()` for active-state detection) absolutely-centered between the logo and actions. Two new static server pages under `(main)/` reuse the Siftloom visual language already established on the home page. A new e2e spec asserts the nav links resolve and the active pill renders.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui (base-nova / Base UI), lucide-react, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-31-header-redesign-features-pricing-design.md`

## Global Constraints

- Brand primary color is `#2fb8ae` (teal), exposed as `bg-primary` / `text-primary-foreground` — never hardcode hex in components; use semantic tokens.
- Siftloom gradient utilities already exist in `globals.css`: `text-siftloom-gradient`, `bg-siftloom-gradient`, `shadow-siftloom-glow`, `sl-bg-grid`, `sl-ambient-glow-top`, `sl-ambient-glow-side`, `sl-card`. Reuse them; do not add new CSS.
- shadcn project base is `base` (Base UI), not radix. Use `render={<Link href=... />}` for composable links, not `asChild`.
- Icon library is `lucide-react`. Icons inside shadcn components use `data-icon`, no sizing classes.
- Use `gap-*` not `space-x-*`/`space-y-*`. Use `size-*` for equal dimensions.
- The developer does NOT commit. The coordinator commits after review approval, using the `git add` scope each task's final step specifies.
- Existing e2e test `auth-session.spec.ts:49` asserts the mobile nav dialog has exactly 3 links — keep 3 nav links. `auth-session.spec.ts:178` uses link name "Home" — keep that label.

---

## File Structure

| File                                   | Responsibility                                                                                    | Action |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ |
| `src/components/header-nav.tsx`        | Client component: `usePathname()` + renders centered desktop nav with brand-pill active state     | Create |
| `src/components/header.tsx`            | Server component: layout (logo left, `<HeaderNav>` center, actions right), exports `primaryLinks` | Modify |
| `src/components/mobile-navigation.tsx` | Client component: add brand-pill active state to sheet links                                      | Modify |
| `src/app/(main)/features/page.tsx`     | Static marketing page for `/features`                                                             | Create |
| `src/app/(main)/pricing/page.tsx`      | Static marketing page for `/pricing`                                                              | Create |
| `e2e/header-navigation.spec.ts`        | E2E: nav links resolve (no 404), active pill renders on each page                                 | Create |

---

### Task 1: Header redesign with centered nav and brand active pill

**Files:**

- Create: `src/components/header-nav.tsx`
- Modify: `src/components/header.tsx`
- Modify: `src/components/mobile-navigation.tsx`

**Interfaces:**

- Consumes: `primaryLinks` array (type `readonly { href: string; label: string }[]`) exported from `src/components/header.tsx`.
- Produces: `HeaderNav` component (props: `{ links: readonly NavigationLink[] }`) rendered by `Header`; `MobileNavigation` gains active-state styling.

- [ ] **Step 1: Create `src/components/header-nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavigationLink = Readonly<{
  href: string;
  label: string;
}>;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navLinkClass =
  "inline-flex h-9 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1";

export function HeaderNav({ links }: { links: readonly NavigationLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="absolute left-1/2 hidden -translate-x-1/2 md:flex">
      <div className="flex items-center gap-1">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                navLinkClass,
                active
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Rewrite `src/components/header.tsx`**

Replace the entire file content. The `primaryLinks` labels become `Home → /`, `Features → /features`, `Pricing → /pricing`. Remove the `NavigationMenu` imports (no longer used). Add `HeaderNav` import. The inner container gains `relative` for absolute centering. Actions move to `ml-auto`.

```tsx
import { Suspense, type ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";

import { HeaderAccount } from "@/components/header-account";
import { HeaderNav } from "@/components/header-nav";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function Header({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md",
        className,
      )}
      {...props}
    >
      <div className="container relative flex h-14 items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-base font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
        >
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-black shadow-xs">
            <Image
              src="/siftloom-logo.png"
              alt="Siftloom"
              width={32}
              height={32}
              priority
              className="size-full scale-115 object-cover"
            />
          </div>
          <span className="text-lg">Siftloom</span>
        </Link>

        <HeaderNav links={primaryLinks} />

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <Suspense
            fallback={<Skeleton className="h-8 w-20" aria-hidden="true" />}
          >
            <HeaderAccount />
          </Suspense>
          <div className="md:hidden">
            <MobileNavigation links={primaryLinks} />
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Add active state to `src/components/mobile-navigation.tsx`**

Add `usePathname` import and active-state styling. The link className switches between the brand pill (active) and the muted hover (inactive).

Replace the `<nav>` block and imports. Full updated file:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavigationLink = Readonly<{
  href: string;
  label: string;
}>;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavigation({
  links,
}: {
  links: readonly NavigationLink[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm">
            <Menu aria-hidden="true" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        }
      />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Browse the application sections.</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-2 p-4">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both pass, 0 errors. The `/features` and `/pricing` links will still 404 at runtime (pages built in later tasks) but the build itself succeeds — Next.js does not validate that `Link` hrefs resolve to routes at build time.

- [ ] **Step 5: Run existing e2e tests**

Run: `npx playwright test e2e/auth-session.spec.ts e2e/login.spec.ts --workers 1`
Expected: all pass. The mobile nav still has 3 links; "Home" label is unchanged.

- [ ] **Step 6: Commit scope (coordinator commits after review)**

```bash
git add src/components/header-nav.tsx src/components/header.tsx src/components/mobile-navigation.tsx
```

---

### Task 2: `/features` marketing page

**Files:**

- Create: `src/app/(main)/features/page.tsx`

**Interfaces:**

- Consumes: shadcn `Badge`, `Card`/`CardHeader`/`CardTitle`/`CardDescription`, `buttonVariants`, lucide icons, Siftloom CSS utilities from `globals.css`.
- Produces: a static route at `/features` (server component, no props).

- [ ] **Step 1: Create `src/app/(main)/features/page.tsx`**

A server component reusing the home page's visual language. Hero + 6 expanded category cards + 3 "what you get" cards + CTA banner.

```tsx
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bot,
  Code2,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const categories = [
  {
    icon: Zap,
    title: "Productivity",
    color: "#3fa1de",
    description:
      "Increase your output with modern workflows. We sift through the noise to find tools that actually save you time.",
    items: [
      "Text expanders & clipboard managers",
      "Note-taking & PKM systems",
      "Focus & time-blocking tools",
    ],
  },
  {
    icon: Code2,
    title: "Developer Tools",
    color: "#2fb8ae",
    description:
      "Libraries, frameworks, and utilities for engineers who ship fast. Practical recommendations without the fluff.",
    items: [
      "Frameworks & runtimes",
      "DevEx & debugging utilities",
      "API & testing tooling",
    ],
  },
  {
    icon: Workflow,
    title: "Automation",
    color: "#9fd37e",
    description:
      "Eliminate manual work and scale your operations. Discover Zapier alternatives, AI agents, and custom workflows.",
    items: [
      "No-code & low-code platforms",
      "AI agent orchestration",
      "Custom workflow recipes",
    ],
  },
  {
    icon: Layers,
    title: "SaaS & Software",
    color: "#cbe37c",
    description:
      "Hand-picked apps for digital professionals. We track clear updates across the entire software ecosystem.",
    items: [
      "Project & task management",
      "CRM & sales enablement",
      "Design & collaboration suites",
    ],
  },
  {
    icon: Bot,
    title: "AI & Agents",
    color: "#2fb8ae",
    description:
      "Stay ahead of the curve. We review the latest LLMs, autonomous agents, and AI tools for real-world use.",
    items: [
      "LLM benchmarks & comparisons",
      "Autonomous agent frameworks",
      "RAG & knowledge tooling",
    ],
  },
  {
    icon: TrendingUp,
    title: "Growth & Marketing",
    color: "#3fa1de",
    description:
      "Analytics, SEO, and acquisition channels. Tools to help you distribute your work and grow your audience.",
    items: [
      "SEO & content analytics",
      "Email & lifecycle automation",
      "Social distribution tools",
    ],
  },
] as const;

const benefits = [
  {
    icon: Sparkles,
    title: "Curated Updates",
    description:
      "High-signal updates a few times a week. No filler, no affiliate-bait — just what's worth your attention.",
  },
  {
    icon: Users,
    title: "Community Access",
    description:
      "Join 5,000+ operators, founders, and makers in an active community sharing real workflows and discoveries.",
  },
  {
    icon: Bell,
    title: "Early Alerts",
    description:
      "Early access to emerging tools and hidden gems before they go mainstream. Be first, not last.",
  },
] as const;

export default function FeaturesPage() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-background text-foreground">
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <div className="sl-ambient-glow-side" aria-hidden="true" />

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-24 pb-12 text-center sm:pt-32 sm:pb-16">
        <Badge
          variant="outline"
          className="h-auto gap-2 rounded-full border-primary/40 bg-primary/10 px-4 py-1.5 text-xs text-primary shadow-xs"
        >
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(47,184,174,0.25)]" />
          <span>Features</span>
        </Badge>

        <h1 className="mt-8 font-heading text-4xl font-extrabold tracking-tight sm:text-6xl">
          Everything we track,{" "}
          <span className="text-siftloom-gradient">curated</span>.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Six categories. One signal. Siftloom covers the tools modern teams and
          digital professionals actually use — from AI agents to growth stacks —
          with practical, tested recommendations.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-12 gap-2.5 px-8 text-base font-bold shadow-siftloom-glow",
            )}
          >
            <span>Join for Free</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 px-6 text-sm font-medium",
            )}
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Category grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="outline"
            className="h-auto px-3 py-1 text-xs font-bold uppercase tracking-widest border-primary/40 bg-primary/10 text-primary"
          >
            Categories
          </Badge>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Six areas, constantly watched
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(
            ({ icon: Icon, title, color, description, items }) => (
              <Card
                key={title}
                className="sl-card gap-0 rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md"
              >
                <div
                  className="mb-6 flex size-13 items-center justify-center rounded-xl border bg-gradient-to-br from-[#3fa1de]/20 to-[#2fb8ae]/20"
                  style={{ borderColor: `${color}30`, color }}
                >
                  <Icon className="size-6" />
                </div>
                <CardHeader className="gap-2 p-0">
                  <CardTitle className="font-heading text-lg font-bold text-foreground">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </CardDescription>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardHeader>
              </Card>
            ),
          )}
        </div>
      </section>

      {/* What you get */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            What you get inside
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            More than a list — a working advantage.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="sl-card flex-row items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3fa1de] to-[#2fb8ae] text-black">
                <Icon className="size-5" />
              </div>
              <div>
                <CardTitle className="font-heading text-base font-bold text-foreground">
                  {title}
                </CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {description}
                </CardDescription>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-[#0c1118] to-[#0a1014] p-8 shadow-2xl sm:p-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(circle at 88% 8%, rgba(47,184,174,0.18), transparent 46%), radial-gradient(circle at 8% 96%, rgba(63,161,222,0.14), transparent 50%)",
            }}
          />
          <div className="relative flex flex-col items-center gap-6 text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to <span className="text-siftloom-gradient">scale</span>?
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
              Join 10,000+ modern professionals getting curated tools and
              workflows every week. Free, forever.
            </p>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 gap-2.5 px-8 font-bold shadow-siftloom-glow",
              )}
            >
              <span>Join for Free</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both pass. `/features` appears as `○` (static) in the route output.

- [ ] **Step 3: Commit scope (coordinator commits after review)**

```bash
git add "src/app/(main)/features/page.tsx"
```

---

### Task 3: `/pricing` marketing page

**Files:**

- Create: `src/app/(main)/pricing/page.tsx`

**Interfaces:**

- Consumes: shadcn `Badge`, `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`, `Accordion` family, `buttonVariants`, lucide icons, Siftloom CSS utilities.
- Produces: a static route at `/pricing` (server component, no props).

- [ ] **Step 1: Create `src/app/(main)/pricing/page.tsx`**

A server component reflecting product reality: Siftloom is free, monetized via sponsorships. Hero + free-tier card + sponsor card + FAQ accordion.

```tsx
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Megaphone } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const freeFeatures = [
  "Curated weekly newsletter",
  "Active community access (5,000+ members)",
  "Early alerts on emerging tools",
  "All categories: AI, dev, automation, growth",
  "No paywall, ever",
] as const;

const faqs = [
  {
    value: "faq-free",
    question: "Is Siftloom really free?",
    answer:
      "Yes, 100% free. We monetize through careful, relevant sponsorships with tools we actually like and use. We will never hide our core content behind a paywall.",
  },
  {
    value: "faq-frequency",
    question: "How often do you send updates?",
    answer:
      "We typically post high-signal updates on our Telegram channel a few times a week, and send a consolidated email newsletter weekly. We respect your inbox and only send when we have something truly valuable to share.",
  },
  {
    value: "faq-tools",
    question: "What kind of tools do you feature?",
    answer:
      "We feature everything from emerging AI agents and developer utilities to proven marketing platforms and no-code builders. If it saves time, reduces friction, or creates leverage for digital professionals, it's on our radar.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-background text-foreground">
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <div className="sl-ambient-glow-side" aria-hidden="true" />

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-24 pb-12 text-center sm:pt-32 sm:pb-16">
        <Badge
          variant="outline"
          className="h-auto gap-2 rounded-full border-primary/40 bg-primary/10 px-4 py-1.5 text-xs text-primary shadow-xs"
        >
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(47,184,174,0.25)]" />
          <span>Pricing</span>
        </Badge>

        <h1 className="mt-8 font-heading text-4xl font-extrabold tracking-tight sm:text-6xl">
          Free, <span className="text-siftloom-gradient">forever</span>.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Siftloom is free for every reader. We monetize through careful
          sponsorships — never a paywall. See the FAQ below for the details.
        </p>
      </section>

      {/* Free tier */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        <Card className="sl-card relative overflow-hidden rounded-3xl border border-primary/30 bg-card/60 p-8 shadow-siftloom-glow backdrop-blur-md sm:p-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(47,184,174,0.16), transparent 60%)",
            }}
          />
          <div className="relative flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <BadgeCheck className="size-5" />
              </div>
              <div>
                <CardHeader className="gap-1 p-0">
                  <CardTitle className="font-heading text-2xl font-extrabold tracking-tight">
                    Free
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Everything, for everyone.
                  </CardDescription>
                </CardHeader>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-heading text-5xl font-extrabold tracking-tight text-siftloom-gradient">
                $0
              </span>
              <span className="text-sm text-muted-foreground">/ forever</span>
            </div>

            <CardContent className="p-0">
              <ul className="flex flex-col gap-3">
                {freeFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-foreground"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>

            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 w-full gap-2.5 text-base font-bold shadow-siftloom-glow",
              )}
            >
              <span>Join for Free</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Card>
      </section>

      {/* Sponsor / Partner */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-[#0c1118] to-[#0a1014] p-8 shadow-2xl sm:p-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(circle at 88% 8%, rgba(47,184,174,0.18), transparent 46%), radial-gradient(circle at 8% 96%, rgba(63,161,222,0.14), transparent 50%)",
            }}
          />
          <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <Badge
                variant="outline"
                className="h-auto gap-2 rounded-full border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold text-muted-foreground"
              >
                <Megaphone className="size-3.5" aria-hidden="true" />
                For Partners &amp; Sponsors
              </Badge>
              <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Reach a highly engaged B2B audience
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                Partner with Siftloom to put your SaaS or service in front of
                founders, marketers, and decision-makers. We drive high-intent
                traffic through our curated newsletter and active community.
              </p>
              <div className="mt-8">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "h-12 gap-2.5 px-7 text-sm font-bold",
                  )}
                >
                  <span>Become a Partner</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:col-span-5">
              <Card className="col-span-2 gap-1 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <CardHeader className="gap-1 p-0">
                  <CardTitle className="font-heading text-3xl font-extrabold tracking-tight text-siftloom-gradient sm:text-4xl">
                    10,000+
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground sm:text-sm">
                    Engaged newsletter subscribers
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="gap-1 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <CardHeader className="gap-1 p-0">
                  <CardTitle className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
                    48%
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Avg. open rate
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="gap-1 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <CardHeader className="gap-1 p-0">
                  <CardTitle className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
                    5,000+
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Community members
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        <div className="text-center">
          <Badge
            variant="outline"
            className="h-auto border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary"
          >
            FAQ
          </Badge>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-12">
          <Accordion className="w-full space-y-3">
            {faqs.map(({ value, question, answer }) => (
              <AccordionItem
                key={value}
                value={value}
                className="rounded-2xl border border-white/6 bg-white/[0.02] px-6 transition-colors hover:border-white/12 hover:bg-white/[0.035]"
              >
                <AccordionTrigger className="py-5 font-heading text-base font-bold text-foreground hover:no-underline">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both pass. `/pricing` appears as `○` (static) in the route output.

- [ ] **Step 3: Commit scope (coordinator commits after review)**

```bash
git add "src/app/(main)/pricing/page.tsx"
```

---

### Task 4: E2E spec for header navigation and active state

**Files:**

- Create: `e2e/header-navigation.spec.ts`

**Interfaces:**

- Consumes: the three nav routes `/`, `/features`, `/pricing` and the `Header` component's active-pill class `bg-primary`.

- [ ] **Step 1: Create `e2e/header-navigation.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
] as const;

test.describe("header navigation", () => {
  for (const link of navLinks) {
    test(`navigates to ${link.name} without a 404`, async ({ page }) => {
      const response = await page.goto(link.href);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(`http://localhost:3000${link.href}`);
    });
  }

  for (const link of navLinks) {
    test(`highlights ${link.name} as the active page on ${link.href}`, async ({
      page,
    }) => {
      await page.goto(link.href);

      const activeLink = page.getByRole("link", {
        name: link.name,
        exact: true,
      });

      await expect(activeLink).toHaveAttribute("aria-current", "page");
      await expect(activeLink).toHaveClass(/bg-primary/);
    });
  }

  test("does not highlight a sibling as active", async ({ page }) => {
    await page.goto("/features");

    const homeLink = page.getByRole("link", { name: "Home", exact: true });
    await expect(homeLink).not.toHaveAttribute("aria-current", "page");
    await expect(homeLink).not.toHaveClass(/bg-primary/);
  });
});
```

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test e2e/header-navigation.spec.ts --workers 1`
Expected: all 7 tests pass (3 navigation + 3 active-state + 1 sibling).

- [ ] **Step 3: Run the full e2e suite**

Run: `npx playwright test --workers 1`
Expected: all tests pass, including the new spec and the existing `auth-session.spec.ts` / `login.spec.ts`.

- [ ] **Step 4: Commit scope (coordinator commits after review)**

```bash
git add e2e/header-navigation.spec.ts
```
