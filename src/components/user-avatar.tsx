import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { Viewer } from "@/lib/auth/types";

function firstCodePoint(value: string) {
  return Array.from(value)[0] ?? "";
}

function initialsFromWords(words: string[]) {
  if (words.length === 0) return "";

  if (words.length === 1) {
    return Array.from(words[0]).slice(0, 2).join("");
  }

  return `${firstCodePoint(words[0])}${firstCodePoint(words.at(-1)!)}`;
}

export function getViewerInitials(viewer: Viewer) {
  const nameWords = viewer.name?.trim().split(/\s+/u).filter(Boolean) ?? [];
  const nameInitials = initialsFromWords(nameWords);
  if (nameInitials) return Array.from(nameInitials.toUpperCase()).slice(0, 2).join("");

  const emailLocalPart = viewer.email?.trim().split("@", 1)[0] ?? "";
  const emailWords = emailLocalPart.split(/[\s._-]+/u).filter(Boolean);
  const emailInitials = initialsFromWords(emailWords);

  return (
    Array.from(emailInitials.toUpperCase()).slice(0, 2).join("") || "U"
  );
}

export function UserAvatar({
  viewer,
  size = "default",
}: {
  viewer: Viewer;
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Avatar size={size} aria-hidden="true">
      {viewer.image ? (
        <AvatarImage
          src={viewer.image}
          alt=""
          referrerPolicy="no-referrer"
        />
      ) : null}
      <AvatarFallback>{getViewerInitials(viewer)}</AvatarFallback>
    </Avatar>
  );
}
