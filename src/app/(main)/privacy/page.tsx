import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Siftloom. Learn how we handle your personal data, sessions, authentication, and data deletion requests.",
};

export default function PrivacyPage() {
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
              <span>Privacy Policy</span>
            </Badge>

            <h1 className="mt-8 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              Privacy <span className="text-siftloom-gradient">Policy</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Last updated: September 2026. This policy outlines how Siftloom
              collects, stores, and protects your personal data.
            </p>
          </div>

          <div className="mt-12 flex flex-col gap-8">
            <Card className="rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md sm:p-10">
              <CardContent className="flex flex-col gap-8 p-0 text-sm leading-relaxed text-muted-foreground">
                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    1. Overview and Core Principles
                  </h2>
                  <p>
                    Siftloom is a curated directory for software, AI tools, and
                    workflows. We believe in minimal data collection: we collect
                    only what is strictly necessary to provide authentication,
                    maintain security, and deliver our directory service.
                  </p>
                  <p>
                    Browsing our directory does not require an account or the
                    submission of personal data. When you do register, all data
                    handling is derived directly from our system architecture
                    and database design.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    2. Personal Data We Collect and Store
                  </h2>
                  <p>
                    We hold only the specific data fields required to operate
                    user accounts, defined in our database schema:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li>
                      <strong className="text-foreground">Name:</strong> Stored
                      to identify your profile across account screens and
                      communications.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Email address:
                      </strong>{" "}
                      Stored as your unique account identifier, used for signing
                      in, email verification, and critical security notices.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Email verification status:
                      </strong>{" "}
                      A boolean flag recording whether your email address has
                      been confirmed via verification link.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Avatar image (optional):
                      </strong>{" "}
                      If you authenticate via Google OAuth, a URL to your public
                      avatar image may be stored.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Account passwords:
                      </strong>{" "}
                      For credential-based accounts, passwords are
                      cryptographically hashed using standard one-way algorithms
                      before storage. We never store or view plaintext
                      passwords.
                    </li>
                  </ul>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    3. Sessions and Authentication Storage
                  </h2>
                  <p>
                    When you sign in to Siftloom, a session row is created in
                    our PostgreSQL database. Session records include:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li>A cryptographically secure session token.</li>
                    <li>Your internal user identifier.</li>
                    <li>
                      Creation timestamp and expiration date (
                      <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                        expiresAt
                      </code>
                      ).
                    </li>
                    <li>
                      Technical metadata including IP address and browser
                      user-agent string, used exclusively to detect session
                      hijacking and unauthorized logins.
                    </li>
                  </ul>
                  <p>
                    Sessions automatically expire at their scheduled expiration
                    date. Furthermore, all active sessions are immediately
                    revoked when a user changes or resets their password, or
                    clicks log out.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    4. Transactional Email Usage
                  </h2>
                  <p>
                    Email addresses collected during registration or
                    authentication are used strictly for transactional security
                    messages:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li>
                      <strong className="text-foreground">
                        Email verification:
                      </strong>{" "}
                      Sending a one-time verification link upon account
                      registration or when requested via the verification resend
                      form.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Password reset:
                      </strong>{" "}
                      Sending a time-limited password reset link when requested
                      by the account holder.
                    </li>
                  </ul>
                  <p>
                    We do not sell, rent, trade, or share your email address
                    with third-party advertisers. We do not send marketing
                    newsletters unless you explicitly opt in.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    5. Google OAuth Authentication
                  </h2>
                  <p>
                    Users may optionally authenticate using Google OAuth. When
                    you sign in with Google:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-6">
                    <li>
                      Google provides your basic profile information (name,
                      email address, and profile picture URL).
                    </li>
                    <li>
                      Our system links the Google provider to your Siftloom
                      account based on your verified email address.
                    </li>
                    <li>
                      OAuth account identifiers and token expiration dates are
                      stored in the account table in our PostgreSQL database. We
                      request only the minimal permissions required for basic
                      identity authentication.
                    </li>
                  </ul>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    6. Security and Abuse Prevention
                  </h2>
                  <p>
                    To protect user accounts and service integrity, our
                    application enforces rate limiting on sensitive
                    authentication routes (such as login attempts, email
                    verification, and password reset endpoints).
                  </p>
                  <p>
                    Rate-limiting counters are recorded in PostgreSQL to track
                    request frequencies and timestamps. This data is used
                    exclusively to prevent brute-force attacks, credential
                    stuffing, and denial-of-service abuse.
                  </p>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    7. Data Retention and Account Deletion Procedure
                  </h2>
                  <p>
                    We retain personal data only as long as your account remains
                    active or as required for platform security and abuse
                    prevention.
                  </p>
                  <p>
                    You have the right to request the permanent deletion of your
                    account and all associated data at any time.
                  </p>
                  <div className="rounded-xl border border-border/80 bg-background/50 p-4">
                    <h3 className="font-heading text-base font-bold text-foreground">
                      How to request account and data deletion:
                    </h3>
                    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
                      <li>
                        Send an email to{" "}
                        <a
                          href="mailto:privacy@siftloom.com"
                          className="text-primary underline underline-offset-4 hover:text-foreground"
                        >
                          privacy@siftloom.com
                        </a>{" "}
                        from the email address associated with your Siftloom
                        account, with the subject line &ldquo;Account Deletion
                        Request&rdquo;. Alternatively, use the account deletion
                        option in your profile settings.
                      </li>
                      <li>
                        Upon verification, your user record, associated session
                        rows, linked OAuth accounts, and verification tokens
                        will be permanently deleted from our database via
                        cascading deletion.
                      </li>
                      <li>
                        Deletion is complete and irreversible; we do not retain
                        shadow copies of deleted accounts.
                      </li>
                    </ol>
                  </div>
                </section>

                <section className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    8. Contact Information
                  </h2>
                  <p>
                    For inquiries or requests regarding this Privacy Policy or
                    your personal data, please contact our team at:
                  </p>
                  <p>
                    Email:{" "}
                    <a
                      href="mailto:privacy@siftloom.com"
                      className="text-primary underline underline-offset-4 hover:text-foreground"
                    >
                      privacy@siftloom.com
                    </a>
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
