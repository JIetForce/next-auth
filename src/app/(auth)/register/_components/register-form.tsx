// src/app/(auth)/register/_components/register-form.tsx
"use client";

import { useActionState } from "react";
import {
  ArrowRight,
  CircleAlert,
  KeyRound,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { registerAction, type RegisterState } from "../actions";

const initialState: RegisterState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
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
        <Label htmlFor="register-name" className="text-xs font-medium">
          Name
        </Label>
        <div className="relative flex items-center">
          <User
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="register-name"
            name="name"
            placeholder="Alex Developer"
            autoComplete="name"
            className="pl-9"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email" className="text-xs font-medium">
          Email
        </Label>
        <div className="relative flex items-center">
          <Mail
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="register-email"
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
        <Label htmlFor="register-password" className="text-xs font-medium">
          Password
        </Label>
        <div className="relative flex items-center">
          <KeyRound
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="register-password"
            name="password"
            type="password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            minLength={6}
            className="pl-9"
            required
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Must be at least 6 characters with letters and numbers.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="register-confirmPassword"
          className="text-xs font-medium"
        >
          Confirm password
        </Label>
        <div className="relative flex items-center">
          <ShieldCheck
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="register-confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            autoComplete="new-password"
            minLength={6}
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
          <span>Creating account…</span>
        ) : (
          <>
            <span>Create account</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
