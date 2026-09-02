import { expect, test } from "@playwright/test";
import { instant } from "@next/playwright";

import { addAuthenticatedSession, E2E_VIEWER } from "./helpers/auth-session";
import { teardownAuthTestInstance } from "./helpers/auth-test-instance";

test.afterAll(async () => {
  await teardownAuthTestInstance();
});

test.describe("instant navigation", () => {
  test("client navigation to /pricing is instant", async ({ page }) => {
    await page.goto("/");

    await instant(page, async () => {
      await page.getByRole("link", { name: "Pricing" }).click();
      await page.waitForURL((url) => url.pathname === "/pricing");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Free,",
      );
    });

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "forever",
    );
  });

  test("client navigation to /profile is instant when authenticated", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto("/");

    await instant(page, async () => {
      await page
        .getByRole("button", {
          name: `Open account menu for ${E2E_VIEWER.name}`,
        })
        .click();
      await page.getByRole("menuitem", { name: "Profile" }).click();
      await page.waitForURL((url) => url.pathname === "/profile");
      await expect(
        page.getByRole("heading", { level: 1, name: "Profile" }),
      ).toBeVisible();
    });

    await expect(page.getByText(E2E_VIEWER.email)).toBeVisible();
  });

  test("initial /profile load shows the shell instantly", async ({
    context,
    page,
    baseURL,
  }) => {
    await addAuthenticatedSession(context);

    await instant(
      page,
      async () => {
        await page.goto("/profile");
        await expect(
          page.getByRole("heading", { level: 1, name: "Profile" }),
        ).toBeVisible();
      },
      { baseURL },
    );

    await expect(page.getByText(E2E_VIEWER.email)).toBeVisible();
  });

  test("client navigation to /login is instant for an anonymous session", async ({
    page,
  }) => {
    await page.goto("/");

    await instant(page, async () => {
      await page.getByRole("link", { name: "Sign in" }).click();
      await page.waitForURL((url) => url.pathname === "/login");
      await expect(
        page.getByRole("heading", { level: 1, name: "Welcome back" }),
      ).toBeVisible();
    });

    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
