import { expect, test } from "@playwright/test";

const googleAuthEnvironmentKeys = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
] as const;

const authConfigured = googleAuthEnvironmentKeys.every((key) =>
  Boolean(process.env[key]?.trim()),
);

test("restricts Next.js dev chunks to the allowed LAN origin", async ({
  request,
}) => {
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
    headers: { Origin: "http://192.168.31.145:3000" },
  });
  expect(approvedResponse.status()).toBe(200);

  const unapprovedResponse = await request.get(assetUrl.toString(), {
    headers: { Origin: "http://192.168.31.146:3000" },
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
  test.skip(authConfigured, "Auth environment is configured for this run");

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
  test.skip(!authConfigured, "Auth environment is not configured for this run");

  await page.goto("/login");

  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeEnabled();
});

test("exposes only the configured Google provider", async ({ request }) => {
  test.skip(!authConfigured, "Auth environment is not configured for this run");

  const response = await request.get("/api/auth/providers");
  const providers = await response.json();

  expect(response.ok()).toBe(true);
  expect(Object.keys(providers)).toEqual(["google"]);
  expect(providers.google).toMatchObject({
    id: "google",
    name: "Google",
    type: "oidc",
    signinUrl: "http://localhost:3000/api/auth/signin/google",
    callbackUrl: "http://localhost:3000/api/auth/callback/google",
  });
});

test("renders a generic OAuth error without exposing provider details", async ({
  page,
}) => {
  test.skip(!authConfigured, "Auth environment is not configured for this run");

  await page.goto("/login?error=OAuthCallback");

  const alert = page
    .getByRole("alert")
    .filter({ hasText: "Unable to sign in" });
  await expect(alert).toContainText("Unable to sign in");
  await expect(alert).not.toContainText("OAuthCallback");
});

test("switches and persists light, dark, and system themes", async ({
  page,
}) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("menuitem", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("menuitem", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);

  await page.getByRole("button", { name: "Toggle theme" }).click();
  const systemOption = page.getByRole("menuitem", { name: "System" });
  await expect(systemOption).toBeVisible();
  await systemOption.click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("system");

  await page.reload();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("system");
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
