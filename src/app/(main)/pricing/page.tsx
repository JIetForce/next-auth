import type { Metadata } from "next";
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
import { sharedFaqs } from "@/lib/content";
import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Siftloom is free for every reader. No paywalls, ever. Here's how the project will be funded.",
  alternates: { canonical: "/pricing" },
};

const freeFeatures = [
  "All six categories: productivity, dev, automation, SaaS, AI, growth",
  "New finds shared on X",
  "The Siftloom chat assistant",
  "No paywall, ever",
] as const;

export default function PricingPage() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-background text-foreground">
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <div className="sl-ambient-glow-side" aria-hidden="true" />

      <main id="main-content">
        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 pt-12 pb-12 text-center sm:pt-16 sm:pb-16">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-6xl">
            Free, <span className="text-siftloom-gradient">forever</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Siftloom is free for every reader. We plan to fund it through
            clearly labelled sponsorships, never a paywall. See the FAQ below
            for the details.
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
                <div className="flex-1">
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

              <a
                href="https://x.com/siftloom"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-12 w-full gap-2.5 text-base font-bold shadow-siftloom-glow",
                )}
              >
                <span>Follow updates on X</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </Card>
        </section>

        {/* Sponsor / Partner */}
        <section className="relative z-10 mx-auto max-w-6xl px-6 py-12">
          <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-br from-[#0c1118] to-[#0a1014] p-8 shadow-2xl sm:p-14">
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 88% 8%, rgba(47,184,174,0.18), transparent 46%), radial-gradient(circle at 8% 96%, rgba(63,161,222,0.14), transparent 50%)",
              }}
            />
            <div className="relative max-w-2xl">
              <Badge
                variant="outline"
                className="h-auto gap-2 rounded-full border-border/80 bg-muted/50 px-3.5 py-1 text-xs font-semibold text-muted-foreground"
              >
                <Megaphone className="size-3.5" aria-hidden="true" />
                For Partners &amp; Sponsors
              </Badge>
              <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Sponsorships: coming soon
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                We aren&apos;t taking sponsors yet. When we do, sponsored
                placements will be clearly labelled and limited to tools that
                pass the same criteria as everything else we feature. Follow us
                on X to hear when it opens.
              </p>
              <div className="mt-8">
                <a
                  href="https://x.com/siftloom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "h-12 gap-2.5 px-7 text-sm font-bold",
                  )}
                >
                  <span>Follow on X</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </Card>
        </section>

        {/* FAQ */}
        <section className="relative z-10 mx-auto max-w-3xl px-6 py-12">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Frequently asked questions
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
