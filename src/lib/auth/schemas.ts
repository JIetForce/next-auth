// src/lib/auth/schemas.ts
import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Please enter a valid email address." });

export const MIN_PASSWORD_LENGTH = 8;

const passwordField = z.string().min(MIN_PASSWORD_LENGTH, {
  message: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
});

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, { message: "Enter your password." }),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const resendSchema = z.object({
  email: emailField,
});

export type ResendInput = z.infer<typeof resendSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
