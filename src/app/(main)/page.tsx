import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

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
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-6">
      {/* Siftloom-inspired background glows */}
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />

      <Card className="relative z-10 w-full max-w-lg border border-border/80 bg-card/85 shadow-2xl backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center">
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
            >
              <Sparkles className="size-3 text-primary" aria-hidden="true" />
              <span>Multi-Agent Review System</span>
            </Badge>
          </div>
          <CardTitle>
            <h1 className="text-2xl font-bold tracking-tight">
              Deterministic Reviews,{" "}
              <span className="text-siftloom-gradient">Zero Noise</span>
            </h1>
          </CardTitle>
          <CardDescription className="text-sm">
            Orchestrate developer, verifier, and 3-lens review workflows with
            consensus.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Try the theme toggle in the header or explore the authenticated
            profile and deterministic pipeline.
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "default" }), "gap-2")}
            >
              <span>Get started</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/profile"
              className={buttonVariants({ variant: "outline" })}
            >
              View profile
            </Link>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
          Siftloom Palette: #07090D base, #2FB8AE teal, #3FA1DE blue, #CBE37C lime.
        </CardFooter>
      </Card>
    </main>
  );
}
