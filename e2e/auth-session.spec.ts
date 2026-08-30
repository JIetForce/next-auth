import { expect, test } from "@playwright/test";

import {
  addAuthenticatedSession,
  addTamperedSession,
  E2E_VIEWER,
} from "./helpers/auth-session";

const sessionConfigured = Boolean(process.env.AUTH_SECRET?.trim());
const sessionCookieName = "authjs.session-token";

const googleAuthEnvironmentKeys = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
] as const;
const googleConfigured = googleAuthEnvironmentKeys.every((key) =>
  Boolean(process.env[key]?.trim()),
);

// The raw `/api/auth/signin/google` POST triggers @auth/core's
// getAuthorizationUrl, which performs OIDC discovery against
// accounts.google.com. On discovery failure @auth/core throws and returns
// no cookies, so the callback-url cookie assertion below can only pass when
// that request succeeds. Probe Google's public well-known endpoint once per
// file (cached) so the test skips — rather than fails for the wrong reason —
// in an isolated CI without network. This is a plain read-only GET to a
// public URL; no mocks, no test provider, no persisted storageState.
let googleDiscoveryReachable: boolean | undefined;
async function isGoogleDiscoveryReachable(): Promise<boolean> {
  if (googleDiscoveryReachable !== undefined) {
    return googleDiscoveryReachable;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(
      "https://accounts.google.com/.well-known/openid-configuration",
      { signal: controller.signal },
    );
    googleDiscoveryReachable = response.ok;
  } catch {
    googleDiscoveryReachable = false;
  } finally {
    clearTimeout(timeout);
  }
  return googleDiscoveryReachable;
}

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

test.describe("raw Auth.js route destination pinning", () => {
  // These hit /api/auth/signin/* and /api/auth/signout directly. The app's
  // own Server Actions (login/actions.ts, lib/auth/actions.ts) never accept
  // a callbackUrl, so tests that only go through them cannot prove anything
  // about the raw routes, which next-auth reaches through
  // src/app/api/auth/[...nextauth]/route.ts's verbatim `handlers` re-export.

  test("pins the raw sign-out route to / regardless of a same-origin callbackUrl", async ({
    request,
  }) => {
    test.skip(
      !sessionConfigured,
      "AUTH_SECRET is required to exercise /api/auth/signout",
    );

    const csrfResponse = await request.get("/api/auth/csrf");
    const { csrfToken } = await csrfResponse.json();

    const response = await request.post("/api/auth/signout", {
      form: { csrfToken, callbackUrl: "/profile" },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    const location = new URL(
      response.headers().location!,
      "http://localhost:3000",
    );
    expect(location.origin).toBe("http://localhost:3000");
    expect(location.pathname).toBe("/");
    expect(location.search).toBe("");
  });

  test("pins the raw Google sign-in route's callback-url cookie to / regardless of a same-origin callbackUrl", async ({
    request,
  }) => {
    const discoveryReachable = await isGoogleDiscoveryReachable();
    test.skip(
      !googleConfigured || !discoveryReachable,
      "The full Google auth environment and network access to Google's OIDC discovery endpoint are required to exercise /api/auth/signin/google",
    );

    const csrfResponse = await request.get("/api/auth/csrf");
    const { csrfToken } = await csrfResponse.json();

    await request.post("/api/auth/signin/google", {
      form: { csrfToken, callbackUrl: "/profile" },
      maxRedirects: 0,
    });

    const { cookies } = await request.storageState();
    const callbackUrlCookie = cookies.find(
      (cookie) => cookie.name === "authjs.callback-url",
    );

    // Auth.js URL-encodes cookie values (see @auth/core/lib/vendored/cookie.js),
    // so the raw stored value is percent-encoded.
    expect(decodeURIComponent(callbackUrlCookie?.value ?? "")).toBe(
      "http://localhost:3000/",
    );
  });
});

test.describe("authenticated session", () => {
  test.skip(
    !sessionConfigured,
    "AUTH_SECRET is required for synthetic sessions",
  );

  test("recognizes the test-only Auth.js JWT fixture", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);

    const response = await page.request.get("/api/auth/session");
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

    const response = await page.request.get("/api/auth/session");
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

    const response = await page.request.get("/api/auth/session");
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

    const response = await page.request.get("/api/auth/session");
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
      await (await page.request.get("/api/auth/session")).json(),
    ).toBeNull();
    await page.reload();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("fails closed for a tampered Auth.js cookie and supports POST sign-out recovery", async ({
    context,
    page,
  }) => {
    await addTamperedSession(context);
    await page.goto("/profile");

    await expect(page).toHaveURL("http://localhost:3000/login");
    await expect(page.locator("body")).not.toContainText(E2E_VIEWER.email);

    await page.goto("/api/auth/signout");
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL("http://localhost:3000/");
    expect(
      (await context.cookies()).find(
        (cookie) => cookie.name === sessionCookieName,
      ),
    ).toBeUndefined();

    await page.goto("/login");
    await expect(page).toHaveURL("http://localhost:3000/login");
    await expect(
      page.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
  });
});

test.describe("account avatar fallback initials", () => {
  // getViewerInitials (src/components/user-avatar.tsx) has five branches;
  // only the multi-word-name branch is exercised by E2E_VIEWER ("E2E User"
  // -> "EU") above. Each test here mints its own synthetic session with an
  // addAuthenticatedSession() viewer override and reads the rendered
  // AvatarFallback text, which appears twice per page (header trigger +
  // profile body), matching the existing "EU" assertion's toHaveCount(2).
  test.skip(
    !sessionConfigured,
    "AUTH_SECRET is required for synthetic sessions",
  );

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
