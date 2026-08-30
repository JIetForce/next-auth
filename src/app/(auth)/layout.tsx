import type { ReactNode } from "react";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-base font-medium"
          >
            <span className="size-6 rounded-md bg-primary" aria-hidden="true" />
            <span>Agent Roster</span>
          </Link>
          <ModeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
