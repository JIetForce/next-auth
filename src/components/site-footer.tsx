import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      id="community"
      className="relative z-10 border-t border-border/80 bg-card/40"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-10">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/10 bg-black">
            <Image
              src="/siftloom-logo.png"
              alt="Siftloom"
              width={36}
              height={36}
              className="size-full object-cover scale-115"
            />
          </div>
          <div>
            <div className="font-heading text-base font-bold text-foreground">
              Siftloom
            </div>
            <div className="text-xs text-muted-foreground">
              &copy; 2026 Siftloom. All rights reserved.
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <a
            href="https://x.com/siftloom"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Twitter / X
          </a>
          <a
            href="https://t.me/siftloom"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Telegram
          </a>
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
