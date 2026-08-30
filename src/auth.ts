import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // Pin every sign-in/sign-out destination to the fixed compile-time
    // constant "/", ignoring the `url` argument entirely so no
    // `callbackUrl`/`redirectTo` value (query, form, or the
    // `authjs.callback-url` cookie) can steer it — including via the raw
    // `/api/auth/signin/*` and `/api/auth/signout` routes. See
    // docs/auth-architecture.md § "Routes and redirects" for the full
    // rationale.
    redirect({ baseUrl }) {
      return `${baseUrl}/`;
    },
  },
});
