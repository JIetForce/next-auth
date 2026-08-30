import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md border border-border">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            This is a minimal shell to verify the shadcn/ui setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Try the theme toggle in the header to switch between light, dark,
            and system modes.
          </p>
          <Button className="w-full sm:w-auto">Get started</Button>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Semantic colors: bg-background, text-foreground, border-border.
        </CardFooter>
      </Card>
    </main>
  );
}
