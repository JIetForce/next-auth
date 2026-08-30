// e2e/registration.spec.ts
import { expect, test } from "@playwright/test";

import { extractFirstUrl, readLatestMessageTo } from "./helpers/mail";

const password = "correct-horse-1";

function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.invalid`;
}

test("registers, confirms by email, then signs in", async ({ page }) => {
  const email = uniqueEmail("happy");

  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify-email$/);

  const body = await readLatestMessageTo(email);
  await page.goto(extractFirstUrl(body));

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("http://localhost:3000/");

  await page.goto("/profile");
  await expect(page).toHaveURL(/\/profile$/);
});

test("refuses sign-in before the address is confirmed", async ({ page }) => {
  const email = uniqueEmail("unconfirmed");

  await page.goto("/register");
  await page.getByLabel("Name").fill("Unconfirmed Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email$/);

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
});

test("answers identically when the address is already registered", async ({
  page,
}) => {
  const email = uniqueEmail("duplicate");

  for (const attempt of [1, 2]) {
    await page.goto("/register");
    await page.getByLabel("Name").fill(`Duplicate ${attempt}`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    // Identical outcome both times: no error, same destination.
    await expect(page).toHaveURL(/\/verify-email$/);
  }
});
