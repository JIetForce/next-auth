import Link from "next/link";
import Image from "next/image";
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

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-background text-foreground">
      {/* Siftloom-inspired background glows */}
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <div className="sl-ambient-glow-side" aria-hidden="true" />

      {/* ===== HERO SECTION ===== */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs text-primary shadow-xs">
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(47,184,174,0.25)]" />
          <span>The curated edge for AI, Growth &amp; Sales</span>
        </div>

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
            <span className="inline-block size-7 rounded-full border-2 border-background bg-gradient-to-br from-[#3fa1de] to-[#2fb8ae]" />
            <span className="inline-block size-7 rounded-full border-2 border-background bg-gradient-to-br from-[#2fb8ae] to-[#9fd37e]" />
            <span className="inline-block size-7 rounded-full border-2 border-background bg-gradient-to-br from-[#9fd37e] to-[#cbe37c]" />
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
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            What we do
          </div>
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
          <div className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md">
            <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#3fa1de]/30 bg-gradient-to-br from-[#3fa1de]/20 to-[#2fb8ae]/20 text-[#3fa1de]">
              <Zap className="size-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Productivity
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Increase your output with modern workflows. We sift through the
              noise to find tools that actually save you time.
            </p>
          </div>

          {/* Card 2: Developer Tools */}
          <div className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md">
            <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#2fb8ae]/30 bg-gradient-to-br from-[#2fb8ae]/20 to-[#9fd37e]/20 text-[#2fb8ae]">
              <Code2 className="size-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Developer Tools
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Libraries, frameworks, and utilities for engineers who ship fast.
              Practical recommendations without the fluff.
            </p>
          </div>

          {/* Card 3: Automation */}
          <div className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md">
            <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#9fd37e]/30 bg-gradient-to-br from-[#9fd37e]/20 to-[#cbe37c]/20 text-[#9fd37e]">
              <Workflow className="size-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Automation
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Eliminate manual work and scale your operations. Discover Zapier
              alternatives, AI agents, and custom workflows.
            </p>
          </div>

          {/* Card 4: SaaS & Software */}
          <div className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md">
            <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#cbe37c]/30 bg-gradient-to-br from-[#cbe37c]/20 to-[#3fa1de]/20 text-[#cbe37c]">
              <Layers className="size-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              SaaS &amp; Software
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Hand-picked apps for digital professionals. We track clear
              updates across the entire software ecosystem.
            </p>
          </div>

          {/* Card 5: AI & Agents */}
          <div className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md">
            <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#2fb8ae]/30 bg-gradient-to-br from-[#2fb8ae]/20 to-[#cbe37c]/20 text-[#2fb8ae]">
              <Bot className="size-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              AI &amp; Agents
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Stay ahead of the curve. We review the latest LLMs, autonomous
              agents, and AI tools for real-world use.
            </p>
          </div>

          {/* Card 6: Growth & Marketing */}
          <div className="sl-card rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xs backdrop-blur-md">
            <div className="mb-6 flex size-13 items-center justify-center rounded-xl border border-[#3fa1de]/30 bg-gradient-to-br from-[#3fa1de]/20 to-[#9fd37e]/20 text-[#3fa1de]">
              <TrendingUp className="size-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Growth &amp; Marketing
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Analytics, SEO, and acquisition channels. Tools to help you
              distribute your work and grow your audience.
            </p>
          </div>
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
          <div className="sl-card flex items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3fa1de] to-[#2fb8ae] text-black">
              <Cpu className="size-5" />
            </div>
            <div>
              <h4 className="font-heading text-base font-bold text-foreground">
                AI Workflows
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                How to connect tools like Claude, Zapier, and Notion to
                automate your content pipeline.
              </p>
            </div>
          </div>

          <div className="sl-card flex items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9fd37e] to-[#cbe37c] text-black">
              <Zap className="size-5" />
            </div>
            <div>
              <h4 className="font-heading text-base font-bold text-foreground">
                Productivity Hacks
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Deep dives into modern text expanders, clipboard managers, and
                local LLMs.
              </p>
            </div>
          </div>

          <div className="sl-card flex items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6 backdrop-blur-md">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2fb8ae] to-[#9fd37e] text-black">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h4 className="font-heading text-base font-bold text-foreground">
                SaaS Alerts
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Early access to emerging tools and hidden gems before they go
                mainstream.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-20">
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-primary">
            FAQ
          </div>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="mt-12 flex flex-col">
          <details className="sl-faq-item">
            <summary>Is Siftloom really free?</summary>
            <p className="sl-faq-content">
              Yes, 100% free. We monetize through careful, relevant sponsorships
              with tools we actually like and use. We will never hide our core
              content behind a paywall.
            </p>
          </details>

          <details className="sl-faq-item">
            <summary>How often do you send updates?</summary>
            <p className="sl-faq-content">
              We typically post high-signal updates on our Telegram channel a
              few times a week, and send a consolidated email newsletter weekly.
              We respect your inbox and only send when we have something truly
              valuable to share.
            </p>
          </details>

          <details className="sl-faq-item">
            <summary>What kind of tools do you feature?</summary>
            <p className="sl-faq-content">
              We feature everything from emerging AI agents and developer
              utilities to proven marketing platforms and no-code builders. If
              it saves time, reduces friction, or creates leverage for digital
              professionals, it&apos;s on our radar.
            </p>
          </details>

          <details className="sl-faq-item">
            <summary>Can I submit a tool to be featured?</summary>
            <p className="sl-faq-content">
              Absolutely. We have a dedicated submission process for founders
              and makers. Reach out to us directly via email and we&apos;ll
              evaluate if your product is a good fit for our audience.
            </p>
          </details>

          <details className="sl-faq-item">
            <summary>How is this different from other directories?</summary>
            <p className="sl-faq-content">
              We don&apos;t just list tools; we curate them. Every tool we mention
              has been tested or rigorously vetted by our team to ensure it
              actually solves a problem without unnecessary bloat.
            </p>
          </details>
        </div>
      </section>

      {/* ===== PARTNERS SECTION ===== */}
      <section
        id="partners"
        className="relative z-10 mx-auto max-w-6xl px-6 py-20 scroll-mt-20"
      >
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-[#0c1118] to-[#0a1014] p-8 shadow-2xl sm:p-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(circle at 88% 8%, rgba(47,184,174,0.18), transparent 46%), radial-gradient(circle at 8% 96%, rgba(63,161,222,0.14), transparent 50%)",
            }}
          />

          <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold text-muted-foreground">
                For Partners &amp; Sponsors
              </div>
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
                <a
                  href="mailto:siftloom@gmail.com?subject=Media%20Kit%20Request"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-12 px-6 text-sm font-medium border-white/15 bg-white/5 hover:bg-white/10",
                  )}
                >
                  View Media Kit
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:col-span-5">
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <div className="font-heading text-3xl font-extrabold tracking-tight text-siftloom-gradient sm:text-4xl">
                  10,000+
                </div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Engaged newsletter subscribers
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <div className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
                  48%
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Avg. open rate
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <div className="font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
                  5,000+
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Community members
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER SECTION ===== */}
      <footer
        id="community"
        className="relative z-10 border-t border-border/80 bg-card/40"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-10">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-black">
              <Image
                src="/siftloom-logo.png"
                alt="Siftloom"
                width={36}
                height={36}
                className="size-full object-cover scale-115"
              />
            </div>
            <div>
              <div className="font-heading text-base font-bold text-foreground">
                Siftloom
              </div>
              <div className="text-xs text-muted-foreground">
                &copy; 2026 Siftloom. All rights reserved.
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <a
              href="https://x.com/siftloom"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Twitter / X
            </a>
            <a
              href="https://t.me/siftloom"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Telegram
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Terms of Service
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
