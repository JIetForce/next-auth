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
    // Auth.js's default `redirect` callback only clamps a browser-supplied
    // `callbackUrl` to the current origin; it still honours any same-origin
    // path. The raw `/api/auth/signin/*` and `/api/auth/signout` routes
    // (reachable directly through the verbatim `handlers` re-export in
    // src/app/api/auth/[...nextauth]/route.ts) read `callbackUrl` from a
    // query/form value or from the `authjs.callback-url` cookie, so without
    // this override they would honour it. Pin every sign-in/sign-out
    // destination to the fixed compile-time constant "/", ignoring `url`
    // entirely. This does not affect the OAuth authorization redirect to
    // Google's consent screen (built from the provider's own authorization
    // endpoint) or the Auth.js error redirect to `pages.error` (built
    // directly from that config value) — neither of those call this
    // callback.
    redirect({ baseUrl }) {
      return `${baseUrl}/`;
    },
  },
});
