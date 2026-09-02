import { describe, expect, it, vi } from "vitest";

import sitemap from "./sitemap";

vi.mock("@/lib/auth/environment", () => ({
  getPublicBaseUrl: vi.fn(() => "https://siftloom.com"),
}));

describe("sitemap route handler", () => {
  it("returns public routes including features, pricing, terms, and privacy", () => {
    const entries = sitemap();

    expect(entries).toHaveLength(5);

    const urls = entries.map((entry) => entry.url);
    expect(urls).toEqual([
      "https://siftloom.com",
      "https://siftloom.com/features",
      "https://siftloom.com/pricing",
      "https://siftloom.com/terms",
      "https://siftloom.com/privacy",
    ]);

    for (const entry of entries) {
      expect(entry.changeFrequency).toBeDefined();
      expect(typeof entry.priority).toBe("number");
    }
  });
});
