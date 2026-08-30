// src/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { sendEmail } from "@/lib/email/client";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  emailVerification: {
    sendOnSignUp: true,
    callbackURL: "/login",
    sendVerificationEmail: async ({ user, url }) => {
      // Not awaited: response timing must not reveal whether the address exists.
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
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
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
