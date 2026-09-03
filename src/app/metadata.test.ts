import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
}));

vi.mock("@/lib/auth/environment", () => ({
  getPublicBaseUrl: vi.fn(() => "https://siftloom.com"),
}));

// The root layout mounts the chat widget through an async server gate that
// reads the viewer via getCurrentViewer (-> @/auth -> Prisma). The metadata
// test only inspects static metadata, so the gate is stubbed out to keep the
// import graph off the database in the unit environment.
vi.mock("@/components/chat/chat-widget-gate", () => ({
  ChatWidgetGate: () => null,
}));

describe("public routes metadata", () => {
  it("exports root layout metadata with metadataBase, title template, icons, openGraph and twitter", async () => {
    const { metadata } = await import("./layout");

    expect(metadata.metadataBase).toEqual(new URL("https://siftloom.com"));
    expect(metadata.title).toEqual({
      default: "Siftloom — Curated AI, SaaS & Workflow Tools",
      template: "%s | Siftloom",
    });
    expect(metadata.icons).toMatchObject({
      shortcut: "/favicon.ico",
      apple: "/apple-icon.png",
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

  it("exports distinct static metadata for public routes", async () => {
    const home = await import("./(main)/page");
    const features = await import("./(main)/features/page");
    const pricing = await import("./(main)/pricing/page");
    const terms = await import("./(main)/terms/page");
    const privacy = await import("./(main)/privacy/page");

    expect(home.metadata).toBeDefined();
    expect(features.metadata).toBeDefined();
    expect(pricing.metadata).toBeDefined();
    expect(terms.metadata).toBeDefined();
    expect(privacy.metadata).toBeDefined();

    const titles = [
      home.metadata.title,
      features.metadata.title,
      pricing.metadata.title,
      terms.metadata.title,
      privacy.metadata.title,
    ];
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(5);

    expect(home.metadata.description).toBeDefined();
    expect(features.metadata.description).toBeDefined();
    expect(pricing.metadata.description).toBeDefined();
    expect(terms.metadata.description).toBeDefined();
    expect(privacy.metadata.description).toBeDefined();
  });
});
