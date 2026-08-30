import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { getCurrentViewer } from "@/lib/auth/session";

export async function HeaderAccount() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return (
      <Link
        href="/login"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Sign in
      </Link>
    );
  }

  return <UserMenu viewer={viewer} />;
}
