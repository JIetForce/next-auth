// src/lib/auth/schemas.ts
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Enter your password." }),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(6, {
        message:
          "Use at least 6 characters, including one letter and one number.",
      })
      .regex(/[a-zA-Z]/, {
        message:
          "Use at least 6 characters, including one letter and one number.",
      })
      .regex(/[0-9]/, {
        message:
          "Use at least 6 characters, including one letter and one number.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const resendSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export type ResendInput = z.infer<typeof resendSchema>;
