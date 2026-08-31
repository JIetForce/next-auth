// e2e/reset-password.spec.ts
import { expect, test } from "@playwright/test";

import { extractFirstUrl, readLatestMessageTo } from "./helpers/mail";

const password = "correct-horse-1";
const newPassword = "new-stable-9";

function uniqueEmail(label: string) {
  return `e2e-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}@example.invalid`;
}

test("requests a reset, opens the link, sets a new password, and signs in", async ({
  page,
}) => {
  const email = uniqueEmail("reset");

  // Register
  await page.goto("/register");
  await page.getByLabel("Name").fill("Reset Person");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email$/);

  // Verify email
  const verifyBody = await readLatestMessageTo(email);
  await page.goto(extractFirstUrl(verifyBody));

  // Sign in with the original password, then sign out
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");

  // The standalone "Log out" button lives on /profile; on the home page the
  // control is buried in the account-menu dropdown (a menuitem, not a button).
  // auth-session.spec.ts uses the same /profile path to reach this button.
  await page.goto("/profile");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  // Request a reset
  await page.goto("/reset-password");
  await expect(
    page.getByRole("heading", { level: 1, name: "Reset your password" }),
  ).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(
    page.getByText(
      "If that address is registered, a reset link is on its way.",
    ),
  ).toBeVisible();

  // Open the reset link from the email
  const resetBody = await readLatestMessageTo(email);
  const resetUrl = extractFirstUrl(resetBody);
  await page.goto(resetUrl);

  await expect(
    page.getByRole("heading", { level: 1, name: "Set a new password" }),
  ).toBeVisible();

  // Set a new password
  await page.getByLabel("New password").fill(newPassword);
  await page.getByLabel("Confirm password").fill(newPassword);
  await page.getByRole("button", { name: "Reset password" }).click();

  // Redirected to login
  await expect(page).toHaveURL(/\/login$/);

  // The old password must no longer work — this proves the reset took effect.
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Could not sign in" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  // Sign in with the new password
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(newPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
});

test("returns the same message for an unregistered address", async ({
  page,
}) => {
  await page.goto("/reset-password");
  await page.getByLabel("Email").fill("nonexistent@example.invalid");
  await page.getByRole("button", { name: "Send reset link" }).click();

  await expect(
    page.getByText(
      "If that address is registered, a reset link is on its way.",
    ),
  ).toBeVisible();
});
