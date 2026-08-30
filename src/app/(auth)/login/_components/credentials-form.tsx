// src/app/(auth)/login/_components/credentials-form.tsx
"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
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
      {state.error ? <Alert role="alert">{state.error}</Alert> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
