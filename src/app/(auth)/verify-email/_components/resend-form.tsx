// src/app/(auth)/verify-email/_components/resend-form.tsx
"use client";

import { useActionState } from "react";
import { CheckCircle2, Mail, Send } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
      {state.message ? (
        <Alert className="border-primary/20 bg-primary/5 py-2.5 text-xs text-foreground">
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resend-email" className="text-xs font-medium">
          Email
        </Label>
        <div className="relative flex items-center">
          <Mail
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="resend-email"
            name="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            className="pl-9"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="outline"
        disabled={pending}
        className="w-full gap-2 font-medium"
      >
        {pending ? (
          <span>Sending…</span>
        ) : (
          <>
            <Send className="size-3.5" aria-hidden="true" />
            <span>Resend verification email</span>
          </>
        )}
      </Button>
    </form>
  );
}
