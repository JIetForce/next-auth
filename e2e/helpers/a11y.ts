import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function assertPageAccessibility(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const criticalOrSerious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(criticalOrSerious).toEqual([]);
}
