import { describe, expect, it, vi } from "vitest";

import robots from "./robots";

vi.mock("@/lib/auth/environment", () => ({
  getPublicBaseUrl: vi.fn(() => "https://siftloom.com"),
}));

describe("robots route handler", () => {
  it("returns crawl rules and sitemap URL", () => {
    const result = robots();

    expect(result.sitemap).toBe("https://siftloom.com/sitemap.xml");

    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules).toBeDefined();
    expect(rules?.userAgent).toBe("*");
    expect(rules?.allow).toBe("/");
    expect(rules?.disallow).toEqual([
      "/profile",
      "/api/",
      "/login",
      "/register",
      "/reset-password",
      "/verify-email",
    ]);
  });
});
