import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import {
  ArrowRight,
  Bot,
  Code2,
  Feather,
  Layers,
  Scale,
  Target,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";

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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sharedFaqs } from "@/lib/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Curated AI, SaaS & Workflow Tools",
  description:
    "Siftloom picks out AI, SaaS, and workflow tools worth your time across productivity, development, automation, and growth.",
};

export default function Home() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-background text-foreground">
      {/* Siftloom-inspired background glows */}
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <div className="sl-ambient-glow-side" aria-hidden="true" />

      <main id="main-content">
        {/* ===== HERO SECTION ===== */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-16 text-center sm:pt-20 sm:pb-20">
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-primary gap-2 px-4 py-1.5 text-xs rounded-full shadow-xs h-auto"
          >
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(47,184,174,0.25)]" />
            <span>The curated edge for AI, Growth &amp; Sales</span>
          </Badge>

          <h1 className="mt-8 font-heading text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            We sift through the noise
            <br />
            so you can <span className="text-siftloom-gradient">scale</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Siftloom picks out the AI, SaaS, and workflow tools worth your time,
            across productivity, development, automation, and growth, and says
            plainly why each one made the cut.
          </p>

          {/* Quick Join Actions */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://x.com/siftloom"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 px-8 text-base font-bold shadow-siftloom-glow gap-2.5",
              )}
            >
              <span>Follow updates on X</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <a
              href="#categories"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 px-6 text-sm font-medium",
              )}
            >
              Explore categories
            </a>
          </div>
        </section>

        {/* ===== CATEGORIES SECTION ===== */}
        <section
          id="categories"
          className="relative z-10 mx-auto max-w-6xl px-6 py-20 scroll-mt-20"
        >
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest h-auto px-3 py-1"
            >
              What we cover
            </Badge>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Six categories, one filter.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              The same bar applies everywhere, whether it&apos;s an agent
              framework or a clipboard manager.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Productivity */}
            <Card className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md gap-0">
              <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#3fa1de]/30 bg-linear-to-br from-[#3fa1de]/20 to-[#2fb8ae]/20 text-[#3fa1de]">
                <Zap className="size-6" />
              </div>
              <CardHeader className="p-0 gap-2">
                <CardTitle className="font-heading text-lg font-bold text-foreground">
                  Productivity
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  Tools that give you back hours, not more tabs.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 2: Developer Tools */}
            <Card className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md gap-0">
              <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#2fb8ae]/30 bg-linear-to-br from-[#2fb8ae]/20 to-[#9fd37e]/20 text-[#2fb8ae]">
                <Code2 className="size-6" />
              </div>
              <CardHeader className="p-0 gap-2">
                <CardTitle className="font-heading text-lg font-bold text-foreground">
                  Developer Tools
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  Frameworks and utilities that make shipping faster.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 3: Automation */}
            <Card className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md gap-0">
              <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#9fd37e]/30 bg-linear-to-br from-[#9fd37e]/20 to-[#cbe37c]/20 text-[#9fd37e]">
                <Workflow className="size-6" />
              </div>
              <CardHeader className="p-0 gap-2">
                <CardTitle className="font-heading text-lg font-bold text-foreground">
                  Automation
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  Ways to take repetitive work off your plate.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 4: SaaS & Software */}
            <Card className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md gap-0">
              <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#cbe37c]/30 bg-linear-to-br from-[#cbe37c]/20 to-[#3fa1de]/20 text-[#cbe37c]">
                <Layers className="size-6" />
              </div>
              <CardHeader className="p-0 gap-2">
                <CardTitle className="font-heading text-lg font-bold text-foreground">
                  SaaS &amp; Software
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  Apps for running projects, sales, and design.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 5: AI & Agents */}
            <Card className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md gap-0">
              <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#2fb8ae]/30 bg-linear-to-br from-[#2fb8ae]/20 to-[#cbe37c]/20 text-[#2fb8ae]">
                <Bot className="size-6" />
              </div>
              <CardHeader className="p-0 gap-2">
                <CardTitle className="font-heading text-lg font-bold text-foreground">
                  AI &amp; Agents
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  Models, agents, and AI tools that hold up in real work.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 6: Growth & Marketing */}
            <Card className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md gap-0">
              <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#3fa1de]/30 bg-linear-to-br from-[#3fa1de]/20 to-[#9fd37e]/20 text-[#3fa1de]">
                <TrendingUp className="size-6" />
              </div>
              <CardHeader className="p-0 gap-2">
                <CardTitle className="font-heading text-lg font-bold text-foreground">
                  Growth &amp; Marketing
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  Tools that get your work in front of the right people.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/features"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 gap-2 px-6 text-sm font-medium",
              )}
            >
              <span>See all categories</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ===== WHAT WE LOOK FOR SECTION ===== */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              What we look for
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Every tool we feature has to pass the same three checks.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card className="sl-card flex-row items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#3fa1de] to-[#2fb8ae] text-black">
                <Target className="size-5" />
              </div>
              <div>
                <CardTitle className="font-heading text-base font-bold text-foreground">
                  Solves a real problem
                </CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  It removes a concrete pain point instead of adding one more
                  dashboard to check.
                </CardDescription>
              </div>
            </Card>

            <Card className="sl-card flex-row items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#9fd37e] to-[#cbe37c] text-black">
                <Feather className="size-5" />
              </div>
              <div>
                <CardTitle className="font-heading text-base font-bold text-foreground">
                  No unnecessary bloat
                </CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  It does its job well without forcing you to rebuild your
                  workflow around it.
                </CardDescription>
              </div>
            </Card>

            <Card className="sl-card flex-row items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#2fb8ae] to-[#9fd37e] text-black">
                <Scale className="size-5" />
              </div>
              <div>
                <CardTitle className="font-heading text-base font-bold text-foreground">
                  Worth the price
                </CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Free or paid, the value has to be clear next to the
                  alternatives you already know.
                </CardDescription>
              </div>
            </Card>
          </div>
        </section>

        {/* ===== FAQ SECTION ===== */}
        <section className="relative z-10 mx-auto max-w-3xl px-6 py-20">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-12">
            <Accordion className="w-full space-y-3">
              {sharedFaqs.map(({ value, question, answer }) => (
                <AccordionItem
                  key={value}
                  value={value}
                  className="rounded-2xl border border-border/80 bg-card/60 px-6 transition-colors hover:border-border hover:bg-card/80"
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
      </main>

      <SiteFooter />
    </div>
  );
}
