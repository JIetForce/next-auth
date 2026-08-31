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
  await expect(
    page.getByRole("heading", { level: 1, name: "Confirm your email" }),
  ).toBeVisible();

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

  await expect(
    page.getByRole("alert").filter({ hasText: "Could not sign in" }),
  ).toBeVisible();
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
});

test("shows a client-side error for a password that is too short", async ({
  page,
}) => {
  const email = uniqueEmail("short-password");

  await page.goto("/register");
  await page.getByLabel("Name").fill("Short Password");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("abc1");
  await page.getByLabel("Confirm password").fill("abc1");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText(
      "Use at least 6 characters, including one letter and one number.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("shows a client-side error for a password missing a letter or number", async ({
  page,
}) => {
  const email = uniqueEmail("no-number-password");

  await page.goto("/register");
  await page.getByLabel("Name").fill("No Number Password");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("onlyletters");
  await page.getByLabel("Confirm password").fill("onlyletters");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText(
      "Use at least 6 characters, including one letter and one number.",
    ),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("shows a client-side error when the confirmation password does not match", async ({
  page,
}) => {
  const email = uniqueEmail("mismatch");

  await page.goto("/register");
  await page.getByLabel("Name").fill("Mismatch Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill("different-password-1");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("The two passwords do not match.")).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
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
