import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Code2,
  Layers,
  Send,
  Sparkles,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Features",
  description:
    "The six categories Siftloom covers, from productivity and developer tools to AI agents and growth, and what we look at in each.",
};

const categories = [
  {
    icon: Zap,
    title: "Productivity",
    color: "#3fa1de",
    description:
      "Apps and workflows that cut busywork, so more of your day goes to the work itself.",
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
      "Hand-picked apps for running projects, selling, and collaborating with a team.",
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
      "LLMs, autonomous agents, and AI tools, judged by how they hold up in real work rather than in demos.",
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
    title: "Follow on X",
    description:
      "New finds are posted on X, each with a short note on what it does well and who it's for.",
  },
  {
    icon: Bot,
    title: "Ask the assistant",
    description:
      "The chat assistant on this site answers questions about Siftloom and how it works.",
  },
  {
    icon: Send,
    title: "Suggest a tool",
    description:
      "Built or found something useful? Send it to us on X and we'll weigh it against the same criteria.",
  },
] as const;

export default function FeaturesPage() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-background text-foreground">
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <div className="sl-ambient-glow-side" aria-hidden="true" />

      <main id="main-content">
        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 pt-12 pb-12 text-center sm:pt-16 sm:pb-16">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-6xl">
            Everything we track,{" "}
            <span className="text-siftloom-gradient">curated</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Six categories, one set of criteria. Here&apos;s what Siftloom
            covers and what we look at in each, from AI agents to growth stacks.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://x.com/siftloom"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 gap-2.5 px-8 text-base font-bold shadow-siftloom-glow",
              )}
            >
              <span>Follow updates on X</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
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
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Six areas we cover
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
                    className="mb-6 flex size-13 items-center justify-center rounded-xl border bg-linear-to-br from-[#3fa1de]/20 to-[#2fb8ae]/20"
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
              Ways to use Siftloom
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              All of it free.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="sl-card flex-row items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#3fa1de] to-[#2fb8ae] text-black">
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
          <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-br from-[#0c1118] to-[#0a1014] p-8 shadow-2xl sm:p-14">
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
                Follow Siftloom on X to see new finds as they&apos;re posted.
                Free, forever.
              </p>
              <a
                href="https://x.com/siftloom"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-12 gap-2.5 px-8 font-bold shadow-siftloom-glow",
                )}
              >
                <span>Follow on X</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
