import { SignInLink } from "@/components/sign-in-link";
import { UserMenu } from "@/components/user-menu";
import { getCurrentViewer } from "@/lib/auth/session";

export async function HeaderAccount() {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return <SignInLink />;
  }

  return <UserMenu viewer={viewer} />;
}
