// src/app/(auth)/reset-password/_components/forgot-password-form.tsx
"use client";

import { startTransition, useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Mail, Send } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/auth/schemas";

import {
  requestPasswordResetAction,
  type RequestPasswordResetState,
} from "../actions";

const initialState: RequestPasswordResetState = { message: null };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onValid = (data: ForgotPasswordInput) => {
    const formData = new FormData();
    formData.set("email", data.email);
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
      {state.message ? (
        <Alert className="border-primary/20 bg-primary/5 py-2.5 text-xs text-foreground">
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-1.5" data-invalid={!!errors.email}>
        <Label htmlFor="forgot-email" className="text-xs font-medium">
          Email
        </Label>
        <div className="relative flex items-center">
          <Mail
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="forgot-email"
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

      <Button
        type="submit"
        disabled={pending}
        className="w-full gap-2 font-medium"
      >
        {pending ? (
          <span>Sending…</span>
        ) : (
          <>
            <Send className="size-3.5" aria-hidden="true" />
            <span>Send reset link</span>
          </>
        )}
      </Button>
    </form>
  );
}
