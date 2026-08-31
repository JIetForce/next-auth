"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function SignInLink() {
  const pathname = usePathname();
  const active = pathname === "/login";

  return (
    <Link
      href="/login"
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-14 items-center px-3 text-sm font-medium border-b-2 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-foreground/80 hover:text-foreground",
      )}
    >
      Sign in
    </Link>
  );
}
