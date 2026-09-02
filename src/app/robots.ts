import type { MetadataRoute } from "next";

import { getPublicBaseUrl } from "@/lib/auth/environment";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/profile",
        "/api/",
        "/login",
        "/register",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
