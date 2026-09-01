import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <Card className="relative z-10 w-full max-w-md border border-border/80 bg-card/85 shadow-2xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            404
          </CardTitle>
          <CardDescription>
            This page could not be found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Return home
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
