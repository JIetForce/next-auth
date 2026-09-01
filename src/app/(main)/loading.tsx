import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="relative min-h-svh w-full overflow-hidden p-4 sm:p-6">
      <div className="sl-bg-grid" aria-hidden="true" />
      <div className="sl-ambient-glow-top" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-6 pt-16">
        <Skeleton className="h-10 w-2/3 max-w-xl" aria-hidden="true" />
        <Skeleton className="h-6 w-1/2 max-w-md" aria-hidden="true" />
        <div className="mt-8 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" aria-hidden="true" />
          <Skeleton className="h-64 w-full" aria-hidden="true" />
          <Skeleton className="h-64 w-full" aria-hidden="true" />
          <Skeleton className="h-64 w-full" aria-hidden="true" />
          <Skeleton className="h-64 w-full" aria-hidden="true" />
          <Skeleton className="h-64 w-full" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}
