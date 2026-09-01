// src/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import {
  getPublicBaseUrl,
  isGoogleAuthConfigured,
} from "@/lib/auth/environment";
import { sendEmail } from "@/lib/email/client";
import { prisma } from "@/lib/db";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/schemas";

const baseURL = getPublicBaseUrl();

// The endpoints not listed in disabledPaths below (the ones the browser reaches
// by following an emailed or redirected link) rely on Better Auth's own
// trustedOrigins check for CSRF protection, since they aren't behind the
// Server Action origin check. Listing origins explicitly — rather than letting
// this default to just baseURL — is what makes that check meaningful on
// preview deployments too.
const trustedOrigins = [new URL(baseURL).origin];
if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
  trustedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

// Registering the Google provider with empty credentials would let a direct
// call to /sign-in/social reach Google with an empty client_id instead of
// failing legibly. isGoogleAuthConfigured() is the single source of truth for
// whether the keys are present, so the provider is only ever built here when
// it can actually work.
const socialProviders = isGoogleAuthConfigured()
  ? {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    }
  : {};

export const auth = betterAuth({
  baseURL,
  trustedOrigins,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // Every credential flow in this app goes through a Server Action, which calls
  // auth.api.* directly. Better Auth's rate limiter runs only in the router's
  // onRequest hook (better-auth/dist/api/index.mjs:168), so an HTTP caller hitting
  // these paths would bypass both the limiter below AND the per-action limits.
  // Disabling them leaves the Server Action as the only door.
  // The paths kept open are the ones the browser reaches by following an emailed
  // or redirected link, not by script.
  disabledPaths: [
    "/sign-in/email",
    "/sign-up/email",
    "/sign-in/social",
    "/request-password-reset",
    "/reset-password",
    "/send-verification-email",
    "/sign-out",
  ],
  rateLimit: {
    enabled: true, // on in development too, so E2E exercises it
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/callback/*": { window: 60, max: 20 },
      "/verify-email": { window: 3600, max: 20 },
      "/reset-password/*": { window: 3600, max: 20 },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // Not awaited: response timing must not reveal whether the address exists.
      // The catch keeps a transport failure from becoming an unhandled rejection.
      void sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: [
          "Click the link to reset your password:",
          "",
          url,
          "",
          "If you did not request this, you can ignore this message.",
        ].join("\n"),
      }).catch((error: unknown) => {
        console.error("Failed to send reset password email", error);
      });
    },
  },
  session: {
    // Without this every getSession() is a SELECT. The trade is that a revoked
    // session stays usable for up to maxAge — see docs/auth-architecture.md.
    cookieCache: { enabled: true, maxAge: 300 },
  },
  emailVerification: {
    sendOnSignUp: true,
    callbackURL: "/login",
    sendVerificationEmail: async ({ user, url }) => {
      // Not awaited: response timing must not reveal whether the address exists.
      // The catch keeps a transport failure (e.g. SMTP down) from becoming an
      // unhandled rejection, which would crash the process outside dev — it
      // must not change what this action or any HTTP response returns.
      void sendEmail({
        to: user.email,
        subject: "Confirm your email address",
        text: [
          "Confirm your address to finish creating your account:",
          "",
          url,
          "",
          "If you did not sign up, you can ignore this message.",
        ].join("\n"),
      }).catch((error: unknown) => {
        console.error("Failed to send verification email", error);
      });
    },
  },
  socialProviders,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: true,
    },
  },
  // nextCookies must stay last so it can flush cookies set by earlier plugins.
  plugins: [nextCookies()],
});
