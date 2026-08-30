"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import { LogOut, User } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { signOutAction } from "@/lib/auth/actions";
import type { Viewer } from "@/lib/auth/types";

function LogoutMenuItem() {
  const { pending } = useFormStatus();

  return (
    <DropdownMenuItem
      nativeButton
      disabled={pending}
      render={<button type="submit" />}
      className="w-full"
    >
      {pending ? <Spinner data-icon="inline-start" /> : <LogOut />}
      {pending ? "Signing out…" : "Log out"}
    </DropdownMenuItem>
  );
}

export function UserMenu({ viewer }: { viewer: Viewer }) {
  const displayName = viewer.name?.trim() || viewer.email?.trim() || "User";
  const displayEmail = viewer.email?.trim() || "Not provided";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Open account menu for ${displayName}`}
        render={<Button variant="ghost" size="icon" className="rounded-full" />}
      >
        <UserAvatar viewer={viewer} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
            <span className="truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
            <span className="truncate font-normal">{displayEmail}</span>
          </DropdownMenuLabel>
          <DropdownMenuItem render={<Link href="/profile" />}>
            <User />
            Profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuGroup>
            <LogoutMenuItem />
          </DropdownMenuGroup>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
