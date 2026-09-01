// src/app/(auth)/register/_components/register-form.tsx
"use client";

import { startTransition, useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { registerSchema, type RegisterInput } from "@/lib/auth/schemas";

import { registerAction, type RegisterState } from "../actions";

const initialState: RegisterState = { error: null };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onValid = (data: RegisterInput) => {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("email", data.email);
    formData.set("password", data.password);
    formData.set("confirmPassword", data.confirmPassword);
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

      <div className="flex flex-col gap-1.5" data-invalid={!!errors.name}>
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
            placeholder="Alex Developer"
            autoComplete="name"
            className="pl-9"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </div>
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5" data-invalid={!!errors.email}>
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
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            className="pl-9"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </div>
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Must be at least 8 characters.
          </p>
        )}
      </div>

      <div
        className="flex flex-col gap-1.5"
        data-invalid={!!errors.confirmPassword}
      >
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
            type="password"
            placeholder="Repeat password"
            autoComplete="new-password"
            className="pl-9"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </div>
        {errors.confirmPassword ? (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        ) : null}
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
