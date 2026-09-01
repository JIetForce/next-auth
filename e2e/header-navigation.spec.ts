import { expect, test } from "@playwright/test";

import { assertPageAccessibility } from "./helpers/a11y";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
] as const;

test.describe("header navigation", () => {
  for (const link of navLinks) {
    test(`passes accessibility checks on ${link.href}`, async ({ page }) => {
      await page.goto(link.href);
      await assertPageAccessibility(page);
    });
  }

  for (const link of navLinks) {
    test(`navigates to ${link.name} without a 404`, async ({ page }) => {
      const response = await page.goto(link.href);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(`http://localhost:3000${link.href}`);
    });
  }

  for (const link of navLinks) {
    test(`highlights ${link.name} as the active page on ${link.href}`, async ({
      page,
    }) => {
      await page.goto(link.href);

      const activeLink = page.getByRole("link", {
        name: link.name,
        exact: true,
      });

      await expect(activeLink).toHaveAttribute("aria-current", "page");
      await expect(activeLink).toHaveClass(/border-primary/);
    });
  }

  test("does not highlight a sibling as active", async ({ page }) => {
    await page.goto("/features");

    const homeLink = page.getByRole("link", { name: "Home", exact: true });
    await expect(homeLink).not.toHaveAttribute("aria-current", "page");
    await expect(homeLink).not.toHaveClass(/border-primary/);
  });
});
