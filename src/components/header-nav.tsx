"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavigationLink = Readonly<{
  href: string;
  label: string;
}>;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navLinkClass =
  "inline-flex h-14 items-center px-3 text-sm font-medium border-b-2 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1";

export function HeaderNav({ links }: { links: readonly NavigationLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="absolute left-1/2 hidden -translate-x-1/2 md:flex">
      <div className="flex items-center gap-1">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                navLinkClass,
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-foreground/80 hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
