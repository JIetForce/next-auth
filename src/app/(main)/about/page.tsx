import type { Metadata } from "next";
import { ArrowRight, Mail } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { CONTACT_EMAIL } from "@/lib/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Siftloom exists, where the project stands, and how to get in touch.",
  alternates: { canonical: "/about" },
};

const X_URL = "https://x.com/siftloom";

export default function AboutPage() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-background text-foreground">
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <div className="sl-ambient-glow-side" aria-hidden="true" />

      <main id="main-content">
        <section className="relative z-10 mx-auto max-w-4xl px-6 pt-12 pb-16 sm:pt-16 sm:pb-20">
          <div className="flex flex-col items-center text-center">
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              About <span className="text-siftloom-gradient">Siftloom</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              A small, independent project that picks out the AI, SaaS, and
              workflow tools worth your time.
            </p>
          </div>

          <div className="mt-12 flex flex-col gap-8">
            <Card className="rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md sm:p-10">
              <CardContent className="flex flex-col gap-8 p-0 text-sm leading-relaxed text-muted-foreground">
                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    Why Siftloom exists
                  </h2>
                  <p>
                    New tools launch every day, and most lists rank them by
                    hype. Siftloom takes the opposite approach: a tool gets
                    featured only when it solves a real problem, does it without
                    unnecessary bloat, and is worth what it costs. It is free to
                    read and always will be.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    Where the project stands
                  </h2>
                  <p>
                    Siftloom started in August 2026 and is in early development.
                    Today it is this website, updates on X, and an assistant
                    that answers questions about the project. Curated picks for
                    each category are being built next.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    Get in touch
                  </h2>
                  <p>
                    Questions, feedback, or a tool you think we should look at?
                    Email{" "}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      {CONTACT_EMAIL}
                    </a>{" "}
                    or message us on X.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className={cn(
                        buttonVariants({ variant: "default" }),
                        "h-11 gap-2 px-6 font-bold",
                      )}
                    >
                      <Mail className="size-4" aria-hidden="true" />
                      <span>Email us</span>
                    </a>
                    <a
                      href={X_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-11 gap-2 px-6 text-sm font-medium",
                      )}
                    >
                      <span>Follow on X</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
