import { Bot, CheckCircle2, Quote, Shield, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function AuthShowcase() {
  return (
    <div className="hidden flex-col justify-between gap-8 lg:col-span-6 lg:flex xl:col-span-7">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            <span>Next-Gen Multi-Agent Platform</span>
          </Badge>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl xl:text-5xl">
            Deterministic Review &amp; Delivery Loop
          </h2>
          <p className="max-w-lg text-base text-muted-foreground">
            Orchestrate developers, verifiers, and specialized review
            triumvirates with automated consensus and real-time verification.
          </p>
        </div>

        {/* Platform Metrics */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-xs">
          <div className="flex flex-col gap-1 border-r border-border/50 pr-2">
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
              100%
            </span>
            <span className="text-xs text-muted-foreground">
              Deterministic Builds
            </span>
          </div>
          <div className="flex flex-col gap-1 border-r border-border/50 px-2">
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
              3-Lens
            </span>
            <span className="text-xs text-muted-foreground">
              Review Consensus
            </span>
          </div>
          <div className="flex flex-col gap-1 pl-2">
            <span className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Zero
            </span>
            <span className="text-xs text-muted-foreground">
              Stored Secrets
            </span>
          </div>
        </div>

        {/* Feature Highlights Matrix */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 p-3.5 backdrop-blur-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Bot className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Autonomous Roles</span>
              <span className="text-xs text-muted-foreground">
                Developer, verifier, and 3-lens reviewers
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 p-3.5 backdrop-blur-xs">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CheckCircle2 className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                Real-time Verification
              </span>
              <span className="text-xs text-muted-foreground">
                Deterministic build and test evidence
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 p-3.5 backdrop-blur-xs sm:col-span-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Shield className="size-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Enterprise Security</span>
              <span className="text-xs text-muted-foreground">
                OIDC tokens, zero local credential storage &amp; strict origin
                isolation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof / Customer Testimonial Quote */}
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-5 shadow-xs backdrop-blur-sm">
        <Quote
          className="pointer-events-none absolute right-3 top-3 size-12 text-foreground/5 dark:text-foreground/10"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-3">
          <p className="text-sm italic text-foreground/90">
            &ldquo;Agent Roster transformed our delivery cycle into a
            verifiable, deterministic loop with automated multi-agent
            consensus.&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              AI
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">
                Autonomous Engineering Lead
              </span>
              <span className="text-[10px] text-muted-foreground">
                AI Systems Infrastructure
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
