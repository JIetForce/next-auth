import { expect, test } from "@playwright/test";

test.describe("chat widget", () => {
  test("floating button opens the assistant sheet", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("button", { name: "Open the Siftloom assistant" })
      .click();

    await expect(page.getByText("Siftloom Assistant")).toBeVisible();
    await expect(page.getByText("How can I help?")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "What is Siftloom?" }),
    ).toBeVisible();
  });

  test("assistant sheet can be dismissed", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("button", { name: "Open the Siftloom assistant" })
      .click();
    await expect(page.getByText("Siftloom Assistant")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByText("How can I help?")).toBeHidden();
  });

  test("input has proper accessibility aria-label", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("button", { name: "Open the Siftloom assistant" })
      .click();

    await expect(
      page.getByRole("textbox", {
        name: "Ask about Siftloom or the tools...",
      }),
    ).toBeVisible();
  });

  test("restores guest messages from localStorage on mount without wiping them", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "siftloom_chat_messages_v1",
        JSON.stringify([
          {
            id: "guest-msg-1",
            role: "user",
            parts: [
              { type: "text", text: "Hello from previous guest session" },
            ],
          },
          {
            id: "guest-msg-2",
            role: "assistant",
            parts: [
              { type: "text", text: "Welcome back to Siftloom assistant!" },
            ],
          },
        ]),
      );
    });

    await page.goto("/");

    await page
      .getByRole("button", { name: "Open the Siftloom assistant" })
      .click();

    // Verify both messages rendered
    await expect(
      page.getByText("Hello from previous guest session"),
    ).toBeVisible();
    await expect(
      page.getByText("Welcome back to Siftloom assistant!"),
    ).toBeVisible();

    // Verify localStorage was NOT wiped on initial mount
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("siftloom_chat_messages_v1"),
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe("guest-msg-1");
  });
});
