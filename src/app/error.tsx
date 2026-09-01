"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error in route", { digest: error.digest });
  }, [error]);

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <Card
        role="alert"
        aria-live="assertive"
        className="relative z-10 w-full max-w-md border border-border/80 bg-card/85 shadow-2xl backdrop-blur-xl"
      >
        <CardHeader>
          <CardTitle className="text-xl font-bold tracking-tight">
            Something went wrong
          </CardTitle>
          <CardDescription>
            We ran into a problem while loading this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Error reference:{" "}
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
              {error.digest ?? "—"}
            </code>
          </p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={() => retry()}>Try again</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
