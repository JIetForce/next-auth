import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthCardSkeleton() {
  return (
    <Card className="w-full max-w-md border-border/80 bg-card/90 shadow-xl shadow-black/5 backdrop-blur-md dark:shadow-black/20">
      <CardHeader className="flex flex-col gap-2 text-center sm:text-left">
        <Skeleton className="h-7 w-32" aria-hidden="true" />
        <Skeleton className="h-4 w-56" aria-hidden="true" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" aria-hidden="true" />
        <Skeleton className="h-10 w-full" aria-hidden="true" />
        <Skeleton className="h-10 w-full" aria-hidden="true" />
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-border/50 pt-4 text-center">
        <Skeleton className="h-3 w-48 mx-auto" aria-hidden="true" />
      </CardFooter>
    </Card>
  );
}
