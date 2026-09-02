import Image from "next/image";
import { Bot, Layers, Quote, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function AuthShowcase() {
  return (
    <div className="hidden flex-col justify-between gap-8 lg:col-span-6 lg:flex xl:col-span-7">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary shadow-xs"
          >
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(47,184,174,0.2)]" />
            <span>The curated edge for AI, Growth &amp; Sales</span>
          </Badge>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl xl:text-5xl">
            We sift through the noise
            <br />
            so you can <span className="text-siftloom-gradient">scale</span>.
          </h2>
          <p className="max-w-lg text-base text-muted-foreground">
            Curated AI, SaaS, and workflow tools for modern teams and digital
            professionals. Practical discoveries and clear updates without the
            fluff.
          </p>
        </div>

        {/* Qualitative Value Propositions */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs backdrop-blur-md">
          <div className="flex flex-col gap-1 border-r border-border/60 pr-2">
            <span className="font-heading text-sm font-bold tracking-tight text-siftloom-gradient sm:text-base">
              Curated Signal
            </span>
            <span className="text-xs text-muted-foreground">
              Hand-picked discoveries
            </span>
          </div>
          <div className="flex flex-col gap-1 border-r border-border/60 px-2">
            <span className="font-heading text-sm font-bold tracking-tight text-foreground sm:text-base">
              Vetted Tooling
            </span>
            <span className="text-xs text-muted-foreground">
              Tested by operators
            </span>
          </div>
          <div className="flex flex-col gap-1 pl-2">
            <span className="font-heading text-sm font-bold tracking-tight text-foreground sm:text-base">
              Active Community
            </span>
            <span className="text-xs text-muted-foreground">
              Makers and builders
            </span>
          </div>
        </div>

        {/* Feature Highlights Matrix */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-card/60 p-3.5 shadow-xs backdrop-blur-md">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-linear-to-br from-[#3fa1de]/20 to-[#2fb8ae]/20 text-primary">
              <Zap className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                Productivity Workflows
              </span>
              <span className="text-xs text-muted-foreground">
                Tools that actually save time and accelerate output
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-card/60 p-3.5 shadow-xs backdrop-blur-md">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-linear-to-br from-[#2fb8ae]/20 to-[#cbe37c]/20 text-primary">
              <Layers className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Developer Tools</span>
              <span className="text-xs text-muted-foreground">
                Frameworks, APIs, and modern toolkits for builders
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-card/60 p-3.5 shadow-xs backdrop-blur-md sm:col-span-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-linear-to-br from-[#3fa1de]/20 via-[#2fb8ae]/20 to-[#cbe37c]/20 text-primary">
              <Bot className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                AI, Agents &amp; Automation
              </span>
              <span className="text-xs text-muted-foreground">
                Real-world autonomous agents, LLM integrations, and custom
                automations
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof / Customer Testimonial Quote */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-md">
        <Quote
          className="pointer-events-none absolute right-3 top-3 size-12 text-foreground/5 dark:text-foreground/10"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-3">
          <p className="text-sm italic text-foreground/90">
            &ldquo;Siftloom gives our team the curated signal on modern AI and
            developer workflows without any fluff.&rdquo;
          </p>
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black">
              <Image
                src="/siftloom-logo.png"
                alt="Siftloom"
                width={28}
                height={28}
                className="size-full object-cover scale-115"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">
                Growth Operator &amp; Founder
              </span>
              <span className="text-[10px] text-muted-foreground">
                Siftloom Reader Community
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
