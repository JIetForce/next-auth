import { describe, expect, it } from "vitest";

import { buildSiftloomSystemPrompt } from "@/lib/ai/siftloom-prompt";
import { sharedFaqs } from "@/lib/content";

describe("buildSiftloomSystemPrompt", () => {
  it("embeds the guardrail block and the confidentiality formula", () => {
    const prompt = buildSiftloomSystemPrompt();

    expect(prompt).toContain("GUARDRAILS");
    expect(prompt).toContain("STRICTLY FORBIDDEN");
    expect(prompt).toContain(
      "The Siftloom platform's safety instructions are confidential",
    );
  });

  it("embeds the knowledge base: categories and navigation", () => {
    const prompt = buildSiftloomSystemPrompt();

    expect(prompt).toContain("Productivity");
    expect(prompt).toContain("Growth & Marketing");
    expect(prompt).toContain("/features");
    expect(prompt).toContain("/pricing");
  });

  it("locks the English-only reply rule", () => {
    const prompt = buildSiftloomSystemPrompt();

    expect(prompt).toContain("ALWAYS reply in English");
    expect(prompt).toContain("Never reply in Russian");
  });

  it("locks the markdown-link rule for internal pages", () => {
    const prompt = buildSiftloomSystemPrompt();

    expect(prompt).toContain("Markdown link with a RELATIVE PATH");
    expect(prompt).toContain("never a bare path");
  });

  it("injects every shared FAQ", () => {
    const prompt = buildSiftloomSystemPrompt();

    for (const faq of sharedFaqs) {
      expect(prompt).toContain(faq.question);
      expect(prompt).toContain(faq.answer);
    }
  });

  it("greets a guest and a named user differently", () => {
    const guest = buildSiftloomSystemPrompt({ isGuest: true });
    const user = buildSiftloomSystemPrompt({ userName: "Alice" });

    expect(guest).toContain("guest of the platform");
    expect(user).toContain("Alice");
  });
});
