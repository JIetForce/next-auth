import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
}));

vi.mock("@/lib/auth/environment", () => ({
  getPublicBaseUrl: vi.fn(() => "https://siftloom.com"),
}));

describe("public routes metadata", () => {
  it("exports root layout metadata with metadataBase, title template, openGraph and twitter", async () => {
    const { metadata } = await import("./layout");

    expect(metadata.metadataBase).toEqual(new URL("https://siftloom.com"));
    expect(metadata.title).toEqual({
      default: "Siftloom — Curated AI, SaaS & Workflow Tools",
      template: "%s | Siftloom",
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Siftloom — Curated AI, SaaS & Workflow Tools",
      url: "/",
      siteName: "Siftloom",
      type: "website",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Siftloom — Curated AI, SaaS & Workflow Tools",
    });
  });

  it("exports distinct static metadata for home, features, and pricing", async () => {
    const home = await import("./(main)/page");
    const features = await import("./(main)/features/page");
    const pricing = await import("./(main)/pricing/page");

    expect(home.metadata).toBeDefined();
    expect(features.metadata).toBeDefined();
    expect(pricing.metadata).toBeDefined();

    expect(home.metadata.title).not.toEqual(features.metadata.title);
    expect(features.metadata.title).not.toEqual(pricing.metadata.title);
    expect(home.metadata.title).not.toEqual(pricing.metadata.title);

    expect(home.metadata.description).toBeDefined();
    expect(features.metadata.description).toBeDefined();
    expect(pricing.metadata.description).toBeDefined();
  });
});
