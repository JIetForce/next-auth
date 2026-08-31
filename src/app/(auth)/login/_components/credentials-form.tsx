// src/app/(auth)/login/_components/credentials-form.tsx
"use client";

import { useActionState } from "react";
import { ArrowRight, CircleAlert, Lock, Mail } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signInWithCredentials, type SignInState } from "../actions";

const initialState: SignInState = { error: null };

export function CredentialsForm() {
  const [state, formAction, pending] = useActionState(
    signInWithCredentials,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive" className="py-2.5 text-xs">
          <CircleAlert className="size-4" aria-hidden="true" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email" className="text-xs font-medium">
          Email
        </Label>
        <div className="relative flex items-center">
          <Mail
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="login-email"
            name="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password" className="text-xs font-medium">
          Password
        </Label>
        <div className="relative flex items-center">
          <Lock
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="login-password"
            name="password"
            type="password"
            placeholder="••••••••••••"
            autoComplete="current-password"
            className="pl-9"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full gap-2 font-medium"
      >
        {pending ? (
          <span>Signing in…</span>
        ) : (
          <>
            <span>Sign in</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
