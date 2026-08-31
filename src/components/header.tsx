import { Suspense, type ComponentProps } from "react";
import Link from "next/link";

import { HeaderAccount } from "@/components/header-account";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ModeToggle } from "@/components/mode-toggle";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
] as const;

const navLinkClass =
  "inline-flex h-9 items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground/80 transition-all hover:text-foreground hover:bg-muted focus:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1";

export function Header({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md",
        className,
      )}
      {...props}
    >
      <div className="container flex h-14 items-center gap-4">
        <Link
          href="/"
          className="mr-auto flex items-center gap-2 font-heading text-base font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
        >
          <span
            className="size-6 rounded-md bg-siftloom-gradient shadow-xs"
            aria-hidden="true"
          />
          <span>Agent Roster</span>
        </Link>

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {primaryLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink
                  className={navLinkClass}
                  render={<Link href={link.href} />}
                >
                  {link.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
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
