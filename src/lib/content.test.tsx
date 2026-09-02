import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
}));

vi.mock("@/lib/auth/environment", () => ({
  getPublicBaseUrl: () => "https://siftloom.com",
}));

import { AuthShowcase } from "@/app/(auth)/_components/auth-showcase";
import FeaturesPage from "@/app/(main)/features/page";
import Home from "@/app/(main)/page";
import PricingPage from "@/app/(main)/pricing/page";
import * as contentModule from "@/lib/content";
import { sharedFaqs } from "@/lib/content";

describe("Content consolidation and statistics removal (Task 7 / D4)", () => {
  it("exports sharedFaqs as single source of truth and does not export partnerStats", () => {
    expect(sharedFaqs).toHaveLength(5);
    expect("partnerStats" in contentModule).toBe(false);

    const questions = sharedFaqs.map((faq) => faq.question);
    expect(questions).toContain("Can I submit a tool to be featured?");
    expect(questions).toContain(
      "How is this different from other directories?",
    );
  });

  it("renders all sharedFaqs on Home page and contains no placeholder statistics", () => {
    const html = renderToStaticMarkup(<Home />);

    for (const faq of sharedFaqs) {
      expect(html).toContain(faq.question);
    }

    expect(html).not.toContain("10,000+");
    expect(html).not.toContain("5,000+");
    expect(html).not.toContain("48%");
    expect(html).toContain("Trusted by");
    expect(html).toContain("modern professionals");
  });

  it("renders all sharedFaqs on Pricing page and contains no placeholder statistics", () => {
    const html = renderToStaticMarkup(<PricingPage />);

    for (const faq of sharedFaqs) {
      expect(html).toContain(faq.question);
    }

    expect(html).not.toContain("10,000+");
    expect(html).not.toContain("5,000+");
    expect(html).not.toContain("48%");
    expect(html).toContain("Active community access");
    expect(html).not.toContain("5,000+ members");
  });

  it("Features page contains no placeholder statistics", () => {
    const html = renderToStaticMarkup(<FeaturesPage />);

    expect(html).not.toContain("10,000+");
    expect(html).not.toContain("5,000+");
    expect(html).not.toContain("48%");
    expect(html).toContain("Connect with operators, founders, and makers");
    expect(html).toContain(
      "Join modern professionals getting curated tools and workflows",
    );
  });

  it("AuthShowcase renders qualitative value propositions with no unverified numbers", () => {
    const html = renderToStaticMarkup(<AuthShowcase />);

    expect(html).not.toContain("10,000+");
    expect(html).not.toContain("5,000+");
    expect(html).not.toContain("48%");
    expect(html).toContain("Curated Signal");
    expect(html).toContain("Vetted Tooling");
    expect(html).toContain("Active Community");
  });
});
