import type { NextConfig } from "next";

const devAllowedOrigin = process.env.NEXT_DEV_ALLOWED_ORIGIN;
// For testing the dev server from another device on the same network.
// Unset in CI and most local setups; defaults to no extra allowed origins.
const allowedDevOrigins = devAllowedOrigin ? [devAllowedOrigin] : [];

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins,
  reactCompiler: true,
  cacheComponents: true,

  // Security response headers, applied at the response layer so they do not
  // affect rendering mode. The CSP is deliberately partial: `script-src` and
  // `default-src` are absent because they need a per-request nonce, a nonce
  // needs dynamic rendering
  // (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md),
  // and dynamic rendering is exactly what phase 2 removes. Adding `unsafe-inline`
  // instead would read as protection while providing none.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
