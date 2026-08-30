import type { ReactNode } from "react";

import { Header } from "@/components/header";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <Header />
      {children}
    </div>
  );
}
