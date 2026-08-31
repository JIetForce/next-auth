import Link from "next/link";
import { ArrowRight, Bot, Layers, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-6 py-12">
      {/* Siftloom-inspired background glows */}
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <div className="sl-ambient-glow-side" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-8 text-center">
        {/* Badge */}
        <Badge
          variant="outline"
          className="gap-2 border-primary/40 bg-primary/10 px-3.5 py-1 text-xs text-primary shadow-xs"
        >
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(47,184,174,0.2)]" />
          <span>The curated edge for AI, Growth &amp; Sales</span>
        </Badge>

        {/* Hero Title */}
        <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          We sift through the noise
          <br />
          so you can <span className="text-siftloom-gradient">scale</span>.
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Curated AI, SaaS, and workflow tools for modern teams and digital
          professionals. Siftloom shares useful discoveries and practical
          recommendations across productivity, developer, and automation tools.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-10 px-6 text-sm font-bold gap-2",
            )}
          >
            <span>Join for Free</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/profile"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 px-5 text-sm",
            )}
          >
            View Dashboard
          </Link>
        </div>

        {/* Metrics Card */}
        <Card className="mt-4 w-full border border-border/80 bg-card/85 shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-4 text-center">
            <div className="text-xs font-semibold tracking-wider text-primary uppercase">
              What We Do
            </div>
            <CardTitle className="text-xl font-bold tracking-tight sm:text-2xl">
              Signal, not noise.
            </CardTitle>
            <CardDescription className="text-sm">
              Hand-curated by operators who actually ship. No fluff, no
              affiliate-bait.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <Zap className="size-4" aria-hidden="true" />
              </div>
              <span className="font-semibold text-foreground text-sm">
                Productivity
              </span>
              <span className="text-xs text-muted-foreground">
                Increase your output with modern workflows and time-saving tools.
              </span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <Layers className="size-4" aria-hidden="true" />
              </div>
              <span className="font-semibold text-foreground text-sm">
                Developer Tools
              </span>
              <span className="text-xs text-muted-foreground">
                Libraries, frameworks, and utilities for engineers who build fast.
              </span>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex size-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <Bot className="size-4" aria-hidden="true" />
              </div>
              <span className="font-semibold text-foreground text-sm">
                AI &amp; Automation
              </span>
              <span className="text-xs text-muted-foreground">
                Latest LLMs, autonomous workflows, and practical intelligence.
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-4 sm:flex-row text-xs text-muted-foreground">
            <span>Trusted by 10,000+ modern professionals</span>
            <span className="text-[11px]">Siftloom Platform &copy; 2026</span>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
