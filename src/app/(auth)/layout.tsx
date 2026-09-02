import type { ReactNode } from "react";

import { Header } from "@/components/header";
import { AuthShowcase } from "./_components/auth-showcase";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-background text-foreground selection:bg-primary/30 selection:text-foreground">
      <Header />
      <main
        id="main-content"
        className="relative flex min-h-[calc(100svh-3.5rem)] flex-1 overflow-hidden bg-background"
      >
        {/* Siftloom-inspired ambient background grid & radial glow effects */}
        <div className="sl-bg-grid" aria-hidden="true" />
        <div className="sl-ambient-glow-top" aria-hidden="true" />
        <div className="sl-ambient-glow-side" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-8 p-4 sm:p-6 lg:grid-cols-12 lg:gap-12 lg:p-8">
          <AuthShowcase />
          <div className="flex w-full flex-col items-center justify-center lg:col-span-6 xl:col-span-5">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
