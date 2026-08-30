import { expect, test } from "@playwright/test";

import { addAuthenticatedSession, E2E_VIEWER } from "./helpers/auth-session";

const sessionCookieName = "better-auth.session_token";

const googleAuthEnvironmentKeys = [
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;
const googleConfigured = googleAuthEnvironmentKeys.every((key) =>
  Boolean(process.env[key]?.trim()),
);

function accountMenuButton(page: import("@playwright/test").Page) {
  return page.getByRole("button", {
    name: `Open account menu for ${E2E_VIEWER.name}`,
  });
}

async function openAccountMenu(page: import("@playwright/test").Page) {
  await accountMenuButton(page).click();
}

test("renders anonymous account navigation on desktop and mobile", async ({
  page,
}) => {
  const response = await page.request.get("/");
  const html = await response.text();

  expect(response.ok()).toBe(true);
  expect(html).toContain(">Sign in<");
  expect(html).not.toContain(E2E_VIEWER.email);

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(page.getByRole("link", { name: "Profile" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log out" })).toHaveCount(0);

  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.getByRole("button", { name: "Toggle navigation menu" }).click();
  await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("link")).toHaveCount(3);
  await expect(
    page.getByRole("dialog").getByRole("link", { name: "Sign in" }),
  ).toHaveCount(0);
});

test("redirects an anonymous profile request to the fixed login route", async ({
  request,
}) => {
  const response = await request.get(
    "/profile?callbackUrl=https://attacker.example&redirectTo=//attacker.example",
    { maxRedirects: 0 },
  );

  expect([303, 307]).toContain(response.status());
  const location = new URL(
    response.headers().location!,
    "http://localhost:3000",
  );
  expect(location.origin).toBe("http://localhost:3000");
  expect(location.pathname).toBe("/login");
  expect(location.search).toBe("");
  expect(await response.text()).not.toContain(E2E_VIEWER.email);
});

test("signs out through the raw endpoint", async ({ context, page }) => {
  await addAuthenticatedSession(context);

  const response = await page.request.post("/api/auth/sign-out", {
    data: {},
    headers: { Origin: "http://localhost:3000" },
  });
  expect(response.ok()).toBe(true);

  expect(
    (await context.cookies()).find(
      (cookie) => cookie.name === sessionCookieName,
    ),
  ).toBeUndefined();
});

test("returns a Google URL and ignores a caller-supplied destination", async ({
  request,
}) => {
  test.skip(
    !googleConfigured,
    "The full Google auth environment is required to exercise sign-in/social",
  );

  // Better Auth validates callbackURL against trusted origins. An untrusted
  // destination is rejected outright (403) rather than echoed back — the
  // stronger form of "ignores a caller-supplied destination".
  const rejected = await request.post("/api/auth/sign-in/social", {
    data: { provider: "google", callbackURL: "https://evil.example/pwned" },
  });
  expect(rejected.status()).toBe(403);
  expect((await rejected.json()).url).toBeUndefined();

  // A trusted same-origin destination still yields the provider URL, which
  // never contains the caller's destination.
  const response = await request.post("/api/auth/sign-in/social", {
    data: { provider: "google", callbackURL: "http://localhost:3000/" },
  });
  const body = await response.json();
  expect(body.url).toContain("accounts.google.com");
  expect(body.url).not.toContain("evil.example");
});

test.describe("authenticated session", () => {
  test("recognizes the test-only Better Auth session fixture", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);

    const response = await page.request.get("/api/auth/get-session");
    const session = await response.json();

    expect(response.ok()).toBe(true);
    expect(session.user).toMatchObject(E2E_VIEWER);
  });

  test("renders account navigation instead of Sign in on desktop", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    const response = await page.request.get("/");
    const html = await response.text();

    expect(html).toContain(E2E_VIEWER.name);
    expect(html).not.toContain(">Sign in<");

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
    await expect(accountMenuButton(page)).toHaveJSProperty("tagName", "BUTTON");
    await openAccountMenu(page);
    await expect(page.getByText(E2E_VIEWER.email)).toBeVisible();
    const profileItem = page.getByRole("menuitem", { name: "Profile" });
    await expect(profileItem).toHaveJSProperty("tagName", "A");
    await expect(profileItem).toHaveAttribute("href", "/profile");
    await expect(page.getByRole("menuitem", { name: "Log out" })).toBeVisible();
  });

  test("renders keyboard-accessible account navigation on a mobile viewport", async ({
    context,
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await addAuthenticatedSession(context);
    await page.goto("/");

    await accountMenuButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Log out" })).toBeVisible();
  });

  test("closes the persistent mobile navigation after keyboard activation", async ({
    context,
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await addAuthenticatedSession(context);
    await page.goto("/profile");

    await page.getByRole("button", { name: "Toggle navigation menu" }).click();
    const homeLink = page
      .getByRole("dialog")
      .getByRole("link", { name: "Home" });
    await homeLink.focus();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByRole("dialog", { name: "Navigation" })).toHaveCount(
      0,
    );
  });

  test("renders only allowlisted viewer fields on the profile page", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto("/profile");

    await expect(
      page.getByRole("heading", { level: 1, name: "Profile" }),
    ).toBeVisible();
    await expect(page.getByText(E2E_VIEWER.name)).toBeVisible();
    await expect(page.getByText(E2E_VIEWER.email)).toBeVisible();
    await expect(page.getByText("Google", { exact: true })).toBeVisible();
    await expect(page.getByText("EU", { exact: true })).toHaveCount(2);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator("body")).not.toContainText("private-e2e-subject");
  });

  test("redirects an authenticated login request to home", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto(
      "/login?callbackUrl=https://attacker.example&redirectTo=//attacker.example",
    );

    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("logs out locally and protects profile again", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto("/profile");

    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    const response = await page.request.get("/api/auth/get-session");
    expect(await response.json()).toBeNull();
    expect(
      (await context.cookies()).find(
        (cookie) => cookie.name === sessionCookieName,
      ),
    ).toBeUndefined();

    await page.goto("/profile");
    await expect(page).toHaveURL("http://localhost:3000/login");
  });

  test("logs out through the header dropdown menu item by pointer", async ({
    context,
    page,
  }) => {
    // The profile page's standalone SignOutButton has role="button" and
    // resolves via getByRole("button", { name: "Log out" }) in the test
    // above. The header dropdown's Logout control is a Base UI
    // DropdownMenuItem with role="menuitem", so it is a distinct,
    // unambiguous target reached only through the account menu.
    await addAuthenticatedSession(context);
    await page.goto("/");

    await openAccountMenu(page);
    await page.getByRole("menuitem", { name: "Log out" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    const response = await page.request.get("/api/auth/get-session");
    expect(await response.json()).toBeNull();
    expect(
      (await context.cookies()).find(
        (cookie) => cookie.name === sessionCookieName,
      ),
    ).toBeUndefined();
  });

  test("logs out through the header dropdown menu item by keyboard", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto("/");

    await accountMenuButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Profile" })).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    const response = await page.request.get("/api/auth/get-session");
    expect(await response.json()).toBeNull();
    expect(
      (await context.cookies()).find(
        (cookie) => cookie.name === sessionCookieName,
      ),
    ).toBeUndefined();
  });

  test("ignores browser-controlled logout fields and uses the fixed destination", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto("/profile");

    const logoutButton = page.getByRole("button", { name: "Log out" });
    const logoutForm = page.locator("form").filter({ has: logoutButton });
    await logoutForm.evaluate((form) => {
      for (const [name, value] of [
        ["callbackUrl", "https://attacker.example"],
        ["redirectTo", "//attacker.example"],
        ["provider", "credentials"],
      ]) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
    });
    await logoutButton.click();

    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("checks the session again when a stale logout form is submitted", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto("/profile");
    await context.clearCookies();

    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
    expect(
      await (await page.request.get("/api/auth/get-session")).json(),
    ).toBeNull();
    await page.reload();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });
});

test.describe("account avatar fallback initials", () => {
  // getViewerInitials (src/components/user-avatar.tsx) has five branches;
  // only the multi-word-name branch is exercised by E2E_VIEWER ("E2E User"
  // -> "EU") above. Each test here mints its own synthetic session with an
  // addAuthenticatedSession() viewer override and reads the rendered
  // AvatarFallback text, which appears twice per page (header trigger +
  // profile body), matching the existing "EU" assertion's toHaveCount(2).
  test("derives initials from a single-word non-BMP name", async ({
    context,
    page,
  }) => {
    // A naive `.slice(0, 2)` on UTF-16 code units would truncate this to
    // just the leading astral character ("𝓐"), silently dropping the "L".
    // Array.from-based code-point slicing must keep both.
    await addAuthenticatedSession(context, {
      name: "𝓐lice",
      email: "alice@example.invalid",
      image: null,
    });
    await page.goto("/profile");

    await expect(page.getByText("𝓐L", { exact: true })).toHaveCount(2);
  });

  test("falls back to the email local part, split on '.', when no name is present", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context, {
      name: null,
      email: "jane.doe@example.invalid",
      image: null,
    });
    await page.goto("/profile");

    await expect(page.getByText("JD", { exact: true })).toHaveCount(2);
    await expect(page.getByText("Not provided", { exact: true })).toBeVisible();
  });

  test("splits the email local part on '_' and '-' when no name is present", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context, {
      name: null,
      email: "amy_lee-jones@example.invalid",
      image: null,
    });
    await page.goto("/profile");

    await expect(page.getByText("AJ", { exact: true })).toHaveCount(2);
  });

  test("falls back to U when neither name nor email is present", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context, {
      name: null,
      email: null,
      image: null,
    });
    await page.goto("/profile");

    await expect(page.getByText("U", { exact: true })).toHaveCount(2);
  });
});
