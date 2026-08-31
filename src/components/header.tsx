import { Suspense, type ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";

import { HeaderAccount } from "@/components/header-account";
import { HeaderNav } from "@/components/header-nav";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function Header({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md",
        className,
      )}
      {...props}
    >
      <div className="relative mx-auto flex h-14 max-w-6xl items-center gap-4 px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-base font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
        >
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-black shadow-xs">
            <Image
              src="/siftloom-logo.png"
              alt="Siftloom"
              width={32}
              height={32}
              priority
              className="size-full scale-115 object-cover"
            />
          </div>
          <span className="text-lg">Siftloom</span>
        </Link>

        <HeaderNav links={primaryLinks} />

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <Suspense
            fallback={<Skeleton className="h-8 w-20" aria-hidden="true" />}
          >
            <HeaderAccount />
          </Suspense>
          <div className="md:hidden">
            <MobileNavigation links={primaryLinks} />
          </div>
        </div>
      </div>
    </header>
  );
}
