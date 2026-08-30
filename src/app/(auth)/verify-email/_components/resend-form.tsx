// src/app/(auth)/verify-email/_components/resend-form.tsx
"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resendVerificationAction,
  type ResendState,
} from "../actions";

const initialState: ResendState = { message: null };

export function ResendForm() {
  const [state, formAction, pending] = useActionState(
    resendVerificationAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.message ? <p role="status">{state.message}</p> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Sending…" : "Send it again"}
      </Button>
    </form>
  );
}
