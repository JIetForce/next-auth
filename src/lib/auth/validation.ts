// src/lib/auth/validation.ts
import "server-only";

/**
 * Passwords must be at least 6 characters long and contain at least one
 * letter and one number. Shared by the register and reset-password actions
 * so the rule cannot drift between them.
 */
export function isValidPassword(value: string) {
  return value.length >= 6 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
}
