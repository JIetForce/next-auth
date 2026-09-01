import { expect, test } from "@playwright/test";

const googleAuthEnvironmentKeys = [
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

const googleConfigured = googleAuthEnvironmentKeys.every((key) =>
  Boolean(process.env[key]?.trim()),
);

// The approved origin is sourced from NEXT_DEV_ALLOWED_ORIGIN (the same env var
// next.config.ts reads for allowedDevOrigins). An E2E test must not fail because
// a developer is on a different network, so it is skipped when the var is unset.
const devAllowedOrigin = process.env.NEXT_DEV_ALLOWED_ORIGIN?.trim();

test("restricts Next.js dev chunks to the allowed LAN origin", async ({
  request,
}) => {
  test.skip(
    !devAllowedOrigin,
    "NEXT_DEV_ALLOWED_ORIGIN is not set for this run",
  );

  // Derive the approved origin host:port from the env var, stripping any path.
  const approvedOrigin = new URL(devAllowedOrigin!).origin;

  const loginResponse = await request.get("/login");
  expect(loginResponse.ok()).toBe(true);

  const loginHtml = await loginResponse.text();
  const assetPath = loginHtml.match(
    /(?:src|href)="([^"]*\/_next\/static\/chunks\/[^"]+)"/,
  )?.[1];
  expect(assetPath).toBeDefined();

  const assetUrl = new URL(assetPath!, "http://localhost:3000");
  expect(assetUrl.pathname).toMatch(/^\/_next\/static\/chunks\/.+/);
  expect(assetUrl.pathname).not.toMatch(
    /\/_next\/(?:image|static\/(?:media|immutable\/media))/,
  );

  const approvedResponse = await request.get(assetUrl.toString(), {
    headers: { Origin: approvedOrigin },
  });
  expect(approvedResponse.status()).toBe(200);

  // An origin not in allowedDevOrigins is rejected. Use a different port on the
  // same host — guaranteed not to match the single approved origin in the list.
  const unapprovedUrl = new URL(approvedOrigin);
  const unapprovedOrigin = `${unapprovedUrl.protocol}//${unapprovedUrl.hostname}:${Number(unapprovedUrl.port || 3000) + 1}`;

  const unapprovedResponse = await request.get(assetUrl.toString(), {
    headers: { Origin: unapprovedOrigin },
  });
  expect(unapprovedResponse.status()).toBe(403);
});

test("renders the Google sign-in page with accessible metadata", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(page).toHaveTitle(/Sign in/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Welcome back" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("shows a safe configuration state without auth environment variables", async ({
  page,
}) => {
  test.skip(googleConfigured, "Auth environment is configured for this run");

  await page.goto("/login");

  await expect(
    page.getByRole("alert").getByText("Google sign-in is not configured"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeDisabled();
});

test("enables Google sign-in when auth environment variables exist", async ({
  page,
}) => {
  test.skip(
    !googleConfigured,
    "Auth environment is not configured for this run",
  );

  await page.goto("/login");

  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeEnabled();
});

test("renders a generic OAuth error without exposing provider details", async ({
  page,
}) => {
  test.skip(
    !googleConfigured,
    "Auth environment is not configured for this run",
  );

  await page.goto("/login?error=OAuthCallback");

  const alert = page
    .getByRole("alert")
    .filter({ hasText: "Unable to sign in" });
  await expect(alert).toContainText("Unable to sign in");
  await expect(alert).not.toContainText("OAuthCallback");
});

test("switches and persists light and dark themes", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("dark");

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("light");
});

test("shows a client-side error for an invalid email before submitting", async ({
  page,
}) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("some-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByText("Please enter a valid email address."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("shows client-side errors for empty required fields and does not navigate", async ({
  page,
}) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.locator('[data-invalid="true"]')).toHaveCount(2);
  await expect(page).toHaveURL(/\/login$/);
});

test("fits the login shell in a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/login");

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeInViewport();
});

test("links to the password reset page", async ({ page }) => {
  await page.goto("/login");

  const forgotLink = page.getByRole("link", { name: "Forgot your password?" });
  await expect(forgotLink).toBeVisible();
  await expect(forgotLink).toHaveAttribute("href", "/reset-password");
});
