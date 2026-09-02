import { Skeleton } from "@/components/ui/skeleton";

export function AuthContentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-full" aria-hidden="true" />
      <Skeleton className="h-10 w-full" aria-hidden="true" />
      <Skeleton className="h-3 w-32 self-end" aria-hidden="true" />
      <Skeleton className="h-3 w-40 self-center" aria-hidden="true" />
      <Skeleton className="h-10 w-full" aria-hidden="true" />
      <Skeleton className="h-3 w-48 self-center" aria-hidden="true" />
    </div>
  );
}
