// src/app/(auth)/login/_components/credentials-form.tsx
"use client";

import { startTransition, useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, CircleAlert, Lock, Mail } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, type SignInInput } from "@/lib/auth/schemas";

import { signInWithCredentials, type SignInState } from "../actions";

const initialState: SignInState = { error: null };

export function CredentialsForm() {
  const [state, formAction, pending] = useActionState(
    signInWithCredentials,
    initialState,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onValid = (data: SignInInput) => {
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onValid)}
      noValidate
      className="flex flex-col gap-4"
    >
      {state.error ? (
        <Alert variant="destructive" className="py-2.5 text-xs">
          <CircleAlert className="size-4" aria-hidden="true" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5" data-invalid={!!errors.email}>
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
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            className="pl-9"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5" data-invalid={!!errors.password}>
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
            type="password"
            placeholder="••••••••••••"
            autoComplete="current-password"
            className="pl-9"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </div>
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
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
