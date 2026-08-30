"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function GoogleSignInButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="w-full"
      disabled={disabled || pending}
    >
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          Redirecting…
        </>
      ) : (
        "Continue with Google"
      )}
    </Button>
  );
}
