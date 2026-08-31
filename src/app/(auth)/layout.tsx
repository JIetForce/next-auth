import type { ReactNode } from "react";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { AuthShowcase } from "./_components/auth-showcase";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading text-base font-semibold tracking-tight transition-opacity hover:opacity-90"
          >
            <span
              className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-xs"
              aria-hidden="true"
            >
              AR
            </span>
            <span>Agent Roster</span>
          </Link>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="relative flex min-h-[calc(100svh-3.5rem)] flex-1 overflow-hidden bg-background">
        {/* Ambient background lighting and gradient effects */}
        <div
          className="pointer-events-none absolute -top-40 left-1/4 -z-10 size-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 right-1/4 -z-10 size-[500px] translate-x-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
          aria-hidden="true"
        />

        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-8 p-4 sm:p-6 lg:grid-cols-12 lg:gap-12 lg:p-8">
          <AuthShowcase />
          <div className="flex w-full flex-col items-center justify-center lg:col-span-6 xl:col-span-5">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
