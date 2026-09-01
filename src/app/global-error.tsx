"use client";

import { useEffect } from "react";

import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled global error:", error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh bg-background text-foreground antialiased">
        <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-4 sm:p-6">
          <div className="sl-bg-grid" aria-hidden="true" />
          <div className="sl-ambient-glow-top" aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border/80 bg-card/85 p-6 shadow-2xl backdrop-blur-xl">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We encountered an unexpected error. Please try again.
            </p>
            {error.digest ? (
              <p className="mt-4 break-all font-mono text-xs text-muted-foreground">
                {error.digest}
              </p>
            ) : null}
            <button
              onClick={() => retry()}
              className="mt-6 inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-siftloom-gradient px-4 text-sm font-bold text-[#06140F] shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-siftloom-glow active:translate-y-0"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
