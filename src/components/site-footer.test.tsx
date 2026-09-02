import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
}));

vi.mock("@/lib/auth/environment", () => ({
  getPublicBaseUrl: () => "https://siftloom.com",
}));

import FeaturesPage from "@/app/(main)/features/page";
import Home from "@/app/(main)/page";
import PricingPage from "@/app/(main)/pricing/page";
import PrivacyPage from "@/app/(main)/privacy/page";
import TermsPage from "@/app/(main)/terms/page";
import RootLayout from "@/app/layout";
import { SiteFooter } from "@/components/site-footer";

describe("SiteFooter and Page Landmarks", () => {
  it("renders skip link in RootLayout with elevated focus z-index", () => {
    const html = renderToStaticMarkup(
      <RootLayout params={Promise.resolve({})}>
        <div>Content</div>
      </RootLayout>,
    );
    expect(html).toContain('href="#main-content"');
    expect(html).toContain("focus:z-60");
    expect(html).toContain("Skip to content");
  });

  it("renders SiteFooter with footer landmark and navigation links", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(html).toContain('<footer id="community"');
    expect(html).toContain("Siftloom");
    expect(html).toContain("Twitter / X");
    expect(html).toContain("Telegram");
    expect(html).toContain('href="/privacy"');
    expect(html).toContain("Privacy Policy");
    expect(html).toContain('href="/terms"');
    expect(html).toContain("Terms of Service");
  });

  it("renders exactly one main id=main-content landmark and footer on Home page", () => {
    const html = renderToStaticMarkup(<Home />);
    const mainMatches = html.match(/<main\b[^>]*id="main-content"[^>]*>/g);
    expect(mainMatches).not.toBeNull();
    expect(mainMatches).toHaveLength(1);

    const allMainMatches = html.match(/<main\b/g);
    expect(allMainMatches).toHaveLength(1);

    const footerMatches = html.match(/<footer\b/g);
    expect(footerMatches).toHaveLength(1);

    // Verify footer is placed after main, not nested inside main
    const mainEndIndex = html.indexOf("</main>");
    const footerStartIndex = html.indexOf("<footer");
    expect(mainEndIndex).toBeGreaterThan(-1);
    expect(footerStartIndex).toBeGreaterThan(mainEndIndex);
  });

  it("renders exactly one main id=main-content landmark and footer on Features page", () => {
    const html = renderToStaticMarkup(<FeaturesPage />);
    const mainMatches = html.match(/<main\b[^>]*id="main-content"[^>]*>/g);
    expect(mainMatches).not.toBeNull();
    expect(mainMatches).toHaveLength(1);

    const allMainMatches = html.match(/<main\b/g);
    expect(allMainMatches).toHaveLength(1);

    const footerMatches = html.match(/<footer\b/g);
    expect(footerMatches).toHaveLength(1);

    const mainEndIndex = html.indexOf("</main>");
    const footerStartIndex = html.indexOf("<footer");
    expect(mainEndIndex).toBeGreaterThan(-1);
    expect(footerStartIndex).toBeGreaterThan(mainEndIndex);
  });

  it("renders exactly one main id=main-content landmark and footer on Pricing page", () => {
    const html = renderToStaticMarkup(<PricingPage />);
    const mainMatches = html.match(/<main\b[^>]*id="main-content"[^>]*>/g);
    expect(mainMatches).not.toBeNull();
    expect(mainMatches).toHaveLength(1);

    const allMainMatches = html.match(/<main\b/g);
    expect(allMainMatches).toHaveLength(1);

    const footerMatches = html.match(/<footer\b/g);
    expect(footerMatches).toHaveLength(1);

    const mainEndIndex = html.indexOf("</main>");
    const footerStartIndex = html.indexOf("<footer");
    expect(mainEndIndex).toBeGreaterThan(-1);
    expect(footerStartIndex).toBeGreaterThan(mainEndIndex);
  });

  it("renders exactly one main id=main-content landmark and footer on Terms page", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    const mainMatches = html.match(/<main\b[^>]*id="main-content"[^>]*>/g);
    expect(mainMatches).not.toBeNull();
    expect(mainMatches).toHaveLength(1);

    const allMainMatches = html.match(/<main\b/g);
    expect(allMainMatches).toHaveLength(1);

    const footerMatches = html.match(/<footer\b/g);
    expect(footerMatches).toHaveLength(1);

    const mainEndIndex = html.indexOf("</main>");
    const footerStartIndex = html.indexOf("<footer");
    expect(mainEndIndex).toBeGreaterThan(-1);
    expect(footerStartIndex).toBeGreaterThan(mainEndIndex);
  });

  it("renders exactly one main id=main-content landmark and footer on Privacy page", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    const mainMatches = html.match(/<main\b[^>]*id="main-content"[^>]*>/g);
    expect(mainMatches).not.toBeNull();
    expect(mainMatches).toHaveLength(1);

    const allMainMatches = html.match(/<main\b/g);
    expect(allMainMatches).toHaveLength(1);

    const footerMatches = html.match(/<footer\b/g);
    expect(footerMatches).toHaveLength(1);

    const mainEndIndex = html.indexOf("</main>");
    const footerStartIndex = html.indexOf("<footer");
    expect(mainEndIndex).toBeGreaterThan(-1);
    expect(footerStartIndex).toBeGreaterThan(mainEndIndex);
  });
});
