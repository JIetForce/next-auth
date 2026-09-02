import type { ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthCardShellProps = {
  badge: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthCardShell({
  badge,
  title,
  description,
  children,
}: AuthCardShellProps) {
  return (
    <Card className="w-full max-w-md border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/20">
      <CardHeader className="flex flex-col gap-2 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start">
          <Badge
            variant="outline"
            className="gap-1 px-2.5 py-0.5 text-xs text-muted-foreground"
          >
            {badge}
          </Badge>
        </div>
        <CardTitle>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">{children}</CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border/50 pt-4 text-center">
        <CardDescription className="text-xs">
          Authentication is handled securely with deterministic verification.
        </CardDescription>
        <p className="text-[11px] text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
