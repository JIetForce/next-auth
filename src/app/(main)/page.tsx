import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import {
  ArrowRight,
  Bot,
  Code2,
  Cpu,
  Layers,
  Sparkles,
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
import { sharedFaqs, partnerStats } from "@/lib/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Curated AI, SaaS & Workflow Tools",
  description:
    "Curated AI, SaaS, and workflow tools for modern teams and digital professionals. Discover practical recommendations across productivity, dev tools, and automation.",
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
        <section className="relative z-10 mx-auto max-w-5xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
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
            Curated AI, SaaS, and workflow tools for modern teams and digital
            professionals. Siftloom shares useful discoveries, practical
            recommendations, and clear updates across productivity, developer,
            automation, and software categories.
          </p>

          {/* Quick Join Actions */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 px-8 text-base font-bold shadow-siftloom-glow gap-2.5",
              )}
            >
              <span>Join for Free</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#tools"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 px-6 text-sm font-medium",
              )}
            >
              Explore Tools
            </a>
          </div>

          {/* Social proof avatar indicators */}
          <div className="mt-12 inline-flex items-center gap-3 text-xs text-muted-foreground sm:text-sm">
            <div className="flex -space-x-2">
              <span className="inline-block size-7 rounded-full border-2 border-background bg-linear-to-br from-[#3fa1de] to-[#2fb8ae]" />
              <span className="inline-block size-7 rounded-full border-2 border-background bg-linear-to-br from-[#2fb8ae] to-[#9fd37e]" />
              <span className="inline-block size-7 rounded-full border-2 border-background bg-linear-to-br from-[#9fd37e] to-[#cbe37c]" />
            </div>
            <span>
              Trusted by{" "}
              <strong className="font-semibold text-foreground">10,000+</strong>{" "}
              modern professionals.
            </span>
          </div>
        </section>

        {/* ===== WHAT WE DO SECTION ===== */}
        <section
          id="tools"
          className="relative z-10 mx-auto max-w-6xl px-6 py-20 scroll-mt-20"
        >
          <div className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest h-auto px-3 py-1"
            >
              What we do
            </Badge>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Signal, not noise.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Every issue is hand-curated by operators who actually ship. No
              fluff, no affiliate-bait — just what&apos;s worth your attention.
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
                  Increase your output with modern workflows. We sift through
                  the noise to find tools that actually save you time.
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
                  Libraries, frameworks, and utilities for engineers who ship
                  fast. Practical recommendations without the fluff.
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
                  Eliminate manual work and scale your operations. Discover
                  Zapier alternatives, AI agents, and custom workflows.
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
                  Hand-picked apps for digital professionals. We track clear
                  updates across the entire software ecosystem.
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
                  Stay ahead of the curve. We review the latest LLMs, autonomous
                  agents, and AI tools for real-world use.
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
                  Analytics, SEO, and acquisition channels. Tools to help you
                  distribute your work and grow your audience.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* ===== SNEAK PEEK SECTION ===== */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              What you&apos;ll find inside
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              A sneak peek at the types of tools and workflows we curate every
              week.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card className="sl-card flex-row items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#3fa1de] to-[#2fb8ae] text-black">
                <Cpu className="size-5" />
              </div>
              <div>
                <CardTitle className="font-heading text-base font-bold text-foreground">
                  AI Workflows
                </CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  How to connect tools like Claude, Zapier, and Notion to
                  automate your content pipeline.
                </CardDescription>
              </div>
            </Card>

            <Card className="sl-card flex-row items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#9fd37e] to-[#cbe37c] text-black">
                <Zap className="size-5" />
              </div>
              <div>
                <CardTitle className="font-heading text-base font-bold text-foreground">
                  Productivity Hacks
                </CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Deep dives into modern text expanders, clipboard managers, and
                  local LLMs.
                </CardDescription>
              </div>
            </Card>

            <Card className="sl-card flex-row items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#2fb8ae] to-[#9fd37e] text-black">
                <Sparkles className="size-5" />
              </div>
              <div>
                <CardTitle className="font-heading text-base font-bold text-foreground">
                  SaaS Alerts
                </CardTitle>
                <CardDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Early access to emerging tools and hidden gems before they go
                  mainstream.
                </CardDescription>
              </div>
            </Card>
          </div>
        </section>

        {/* ===== FAQ SECTION ===== */}
        <section className="relative z-10 mx-auto max-w-3xl px-6 py-20">
          <div className="text-center">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest h-auto px-3 py-1"
            >
              FAQ
            </Badge>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
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
              <AccordionItem
                value="faq-4"
                className="rounded-2xl border border-border/80 bg-card/60 px-6 transition-colors hover:border-border hover:bg-card/80"
              >
                <AccordionTrigger className="py-5 font-heading text-base font-bold text-foreground hover:no-underline">
                  Can I submit a tool to be featured?
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  Absolutely. We have a dedicated submission process for
                  founders and makers. Reach out to us directly via email and
                  we&apos;ll evaluate if your product is a good fit for our
                  audience.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-5"
                className="rounded-2xl border border-border/80 bg-card/60 px-6 transition-colors hover:border-border hover:bg-card/80"
              >
                <AccordionTrigger className="py-5 font-heading text-base font-bold text-foreground hover:no-underline">
                  How is this different from other directories?
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  We don&apos;t just list tools; we curate them. Every tool we
                  mention has been tested or rigorously vetted by our team to
                  ensure it actually solves a problem without unnecessary bloat.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* ===== PARTNERS SECTION ===== */}
        <section
          id="partners"
          className="relative z-10 mx-auto max-w-6xl px-6 py-20 scroll-mt-20"
        >
          <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-br from-[#0c1118] to-[#0a1014] p-8 shadow-2xl sm:p-14">
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 88% 8%, rgba(47,184,174,0.18), transparent 46%), radial-gradient(circle at 8% 96%, rgba(63,161,222,0.14), transparent 50%)",
              }}
            />

            <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <Badge
                  variant="outline"
                  className="border-border/80 bg-muted/50 text-muted-foreground gap-2 px-3.5 py-1 text-xs font-semibold h-auto rounded-full"
                >
                  For Partners &amp; Sponsors
                </Badge>
                <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Reach a Highly Engaged B2B Audience
                </h2>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                  Partner with Siftloom to put your SaaS or service in front of
                  founders, marketers, and decision-makers. We drive high-intent
                  traffic through our curated newsletter and active community.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "h-12 px-7 font-bold text-sm",
                    )}
                  >
                    Become a Partner
                  </Link>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-12 px-6 text-sm font-medium border-border/80 bg-card/60 hover:bg-card/80",
                    )}
                  >
                    View Media Kit
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:col-span-5">
                {partnerStats.map((stat) => (
                  <Card
                    key={stat.value}
                    className={cn(
                      "gap-1 rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md",
                      stat.highlight && "col-span-2",
                    )}
                  >
                    <CardHeader className="gap-1 p-0">
                      <CardTitle
                        className={cn(
                          "font-heading font-extrabold tracking-tight",
                          stat.highlight
                            ? "text-3xl text-siftloom-gradient sm:text-4xl"
                            : "text-2xl text-foreground sm:text-3xl",
                        )}
                      >
                        {stat.value}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground sm:text-sm">
                        {stat.label}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
