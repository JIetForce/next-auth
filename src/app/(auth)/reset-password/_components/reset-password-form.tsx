// src/app/(auth)/reset-password/_components/reset-password-form.tsx
"use client";

import { startTransition, useActionState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, CircleAlert, KeyRound, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/auth/schemas";

import { resetPasswordAction, type ResetPasswordState } from "../actions";

const initialState: ResetPasswordState = { error: null };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onValid = (data: ResetPasswordInput) => {
    const formData = new FormData();
    formData.set("token", token);
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

      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5" data-invalid={!!errors.password}>
        <Label htmlFor="reset-password" className="text-xs font-medium">
          New password
        </Label>
        <div className="relative flex items-center">
          <KeyRound
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="reset-password"
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
        <Label htmlFor="reset-confirmPassword" className="text-xs font-medium">
          Confirm password
        </Label>
        <div className="relative flex items-center">
          <ShieldCheck
            className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="reset-confirmPassword"
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
          <span>Resetting…</span>
        ) : (
          <>
            <span>Reset password</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
