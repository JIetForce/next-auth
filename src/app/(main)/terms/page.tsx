import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Siftloom. Learn about our free directory service, user accounts, and acceptable use policies.",
};

export default function TermsPage() {
  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-background text-foreground">
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <div className="sl-ambient-glow-side" aria-hidden="true" />

      <main id="main-content">
        <section className="relative z-10 mx-auto max-w-4xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20">
          <div className="flex flex-col items-center text-center">
            <Badge
              variant="outline"
              className="h-auto gap-2 rounded-full border-primary/40 bg-primary/10 px-4 py-1.5 text-xs text-primary shadow-xs"
            >
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_rgba(47,184,174,0.25)]" />
              <span>Terms of Service</span>
            </Badge>

            <h1 className="mt-8 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              Terms of <span className="text-siftloom-gradient">Service</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Last updated: September 2026. These terms govern your use of the
              Siftloom directory and platform.
            </p>
          </div>

          <div className="mt-12 flex flex-col gap-8">
            <Card className="rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md sm:p-10">
              <CardContent className="flex flex-col gap-8 p-0 text-sm leading-relaxed text-muted-foreground">
                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    1. The Siftloom Directory Service
                  </h2>
                  <p>
                    Siftloom is a curated directory and publication service
                    providing vetted tools, software recommendations, and
                    workflows for modern builders, engineers, and digital teams.
                  </p>
                  <p>
                    The directory service is 100% free of charge. There are no
                    paywalls, subscription fees, or mandatory charges to browse
                    the directory, access recommendations, or read our curated
                    guides. Siftloom is monetized through transparent
                    sponsorships and partnerships with tools we evaluate and
                    recommend.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    2. User Accounts and Authentication
                  </h2>
                  <p>
                    Browsing the Siftloom directory does not require an account.
                    However, you may optionally create an account to access
                    community features and personalize your experience.
                  </p>
                  <p>
                    Accounts may be registered using an email address and
                    password, or through third-party authentication via Google
                    OAuth. When creating an account:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li>
                      You must provide accurate and verifiable contact
                      information.
                    </li>
                    <li>
                      You are responsible for safeguarding your password and
                      account session credentials.
                    </li>
                    <li>
                      You are responsible for all actions conducted under your
                      account.
                    </li>
                    <li>
                      You agree to notify us immediately if you discover or
                      suspect unauthorized access to your account.
                    </li>
                  </ul>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    3. Acceptable Use Policy
                  </h2>
                  <p>
                    You agree to use Siftloom only in accordance with all
                    applicable laws and these Terms. You agree not to engage in
                    any of the following prohibited activities:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li>
                      <strong className="text-foreground">
                        Authentication abuse:
                      </strong>{" "}
                      Probing, scanning, or circumventing authentication
                      systems, rate limits, session tokens, or origin
                      verification checks.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Automated abuse:
                      </strong>{" "}
                      Launching automated credential stuffing attacks, password
                      brute-force scripts, or high-frequency requests designed
                      to overload or degrade the service.
                    </li>
                    <li>
                      <strong className="text-foreground">Scraping:</strong>{" "}
                      Engaging in unauthorized bulk scraping or automated
                      extraction that disrupts system performance or violates
                      data privacy.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        System tampering:
                      </strong>{" "}
                      Decompiling, reverse engineering, or attempting to derive
                      source code or secrets from the service infrastructure.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Malicious content:
                      </strong>{" "}
                      Distributing malicious software, malware, phishing links,
                      or unsolicited bulk communications.
                    </li>
                  </ul>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    4. Third-Party Products and Links
                  </h2>
                  <p>
                    Siftloom indexes, links to, and reviews third-party
                    software, applications, and external websites. We do not
                    own, control, or operate these third-party products.
                  </p>
                  <p>
                    We provide external links for discovery and informational
                    purposes only. Siftloom does not endorse and is not
                    responsible for the availability, security, accuracy, or
                    business practices of third-party websites or services. Your
                    interactions with third-party software are governed
                    exclusively by their respective terms and privacy policies.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    5. Service Availability and Disclaimer of Warranties
                  </h2>
                  <p>
                    Siftloom is provided on an &ldquo;as is&rdquo; and &ldquo;as
                    available&rdquo; basis without warranties of any kind,
                    whether express, implied, or statutory, including warranties
                    of merchantability, fitness for a particular purpose, or
                    non-infringement.
                  </p>
                  <p>
                    We do not warrant that directory listings will always be
                    up-to-date, error-free, or uninterrupted. We reserve the
                    right to modify, suspend, or discontinue any aspect of the
                    service at any time without notice.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    6. Termination and Account Deletion
                  </h2>
                  <p>
                    You may terminate your account at any time. Upon your
                    request, your account and associated personal data will be
                    completely deleted from our database per our Privacy Policy.
                  </p>
                  <p>
                    We reserve the right to suspend or terminate accounts
                    immediately and without prior notice in the event of a
                    breach of these Terms, abusive behavior, or actions that
                    compromise platform security.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    7. Changes to these Terms
                  </h2>
                  <p>
                    We may revise these Terms of Service as our service evolves.
                    When updates occur, we will update the &ldquo;Last
                    updated&rdquo; date at the top of this page. Your continued
                    use of Siftloom after revised Terms become effective
                    signifies your agreement to the new Terms.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    8. Contact Information
                  </h2>
                  <p>
                    If you have questions or concerns regarding these Terms of
                    Service, please contact us at{" "}
                    <a
                      href="mailto:legal@siftloom.com"
                      className="text-primary underline underline-offset-4 hover:text-foreground"
                    >
                      legal@siftloom.com
                    </a>{" "}
                    or{" "}
                    <a
                      href="mailto:privacy@siftloom.com"
                      className="text-primary underline underline-offset-4 hover:text-foreground"
                    >
                      privacy@siftloom.com
                    </a>
                    .
                  </p>
                </section>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 gap-2 px-6 text-sm font-medium",
                )}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
