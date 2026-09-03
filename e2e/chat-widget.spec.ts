import { expect, test } from "@playwright/test";

import { addAuthenticatedSession } from "./helpers/auth-session";

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

  test("hides the Sign in link inside the panel for an authenticated viewer", async ({
    context,
    page,
  }) => {
    await addAuthenticatedSession(context);
    await page.goto("/");

    await page
      .getByRole("button", { name: "Open the Siftloom assistant" })
      .click();

    // Scope to the sheet panel so a header "Sign in" link (which only renders
    // for guests anyway) can never satisfy this assertion.
    const panel = page.locator("[data-slot='sheet-content']");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  });

  test("renders Markdown links from the assistant stream as clickable anchors", async ({
    page,
  }) => {
    // Intercept the chat API and fulfill with a minimal AI SDK v5 UI-message
    // SSE stream. The wire format is `data: {json}\n\n` lines terminated by
    // `data: [DONE]\n\n` (see JsonToSseTransformStream in node_modules/ai).
    // The chunk types are defined by UIMessageChunk: `start`, `text-start`,
    // `text-delta`, `text-end`, `finish`.
    await page.route("/api/chat", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      const textId = "txt-1";
      const messageId = "msg-1";
      const linkText = "[How do I add my tool?](/register)";
      const sseLines = [
        `data: ${JSON.stringify({ type: "start", messageId })}\n\n`,
        `data: ${JSON.stringify({ type: "start-step" })}\n\n`,
        `data: ${JSON.stringify({ type: "text-start", id: textId })}\n\n`,
        `data: ${JSON.stringify({
          type: "text-delta",
          id: textId,
          delta: linkText,
        })}\n\n`,
        `data: ${JSON.stringify({ type: "text-end", id: textId })}\n\n`,
        `data: ${JSON.stringify({ type: "finish-step" })}\n\n`,
        `data: ${JSON.stringify({ type: "finish", finishReason: "stop" })}\n\n`,
        "data: [DONE]\n\n",
      ];
      const body = sseLines.join("");
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
          "x-vercel-ai-ui-message-stream": "v1",
          "x-accel-buffering": "no",
        },
        body,
      });
    });

    await page.goto("/");

    await page
      .getByRole("button", { name: "Open the Siftloom assistant" })
      .click();

    // Trigger an assistant response via a quick prompt.
    await page
      .getByRole("button", { name: "How do I add my tool to the catalog?" })
      .click();

    // The Markdown link should render as an anchor with the internal href.
    const panel = page.locator("[data-slot='sheet-content']");
    const link = panel.getByRole("link", { name: "How do I add my tool?" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/register");
  });

  test("renders external Markdown links from the assistant stream with safe target/rel", async ({
    page,
  }) => {
    // Same canned AI SDK v5 UI-message SSE stream technique as the internal
    // link test, but the assistant text contains an external `https://` link.
    // The custom `a` renderer must open it in a new tab with the standard
    // safe rel — removing `target="_blank"` or `rel="noopener noreferrer"`
    // would fail this test.
    await page.route("/api/chat", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      const textId = "txt-1";
      const messageId = "msg-1";
      const linkText = "[Siftloom docs](https://example.com/siftloom/docs)";
      const sseLines = [
        `data: ${JSON.stringify({ type: "start", messageId })}\n\n`,
        `data: ${JSON.stringify({ type: "start-step" })}\n\n`,
        `data: ${JSON.stringify({ type: "text-start", id: textId })}\n\n`,
        `data: ${JSON.stringify({
          type: "text-delta",
          id: textId,
          delta: linkText,
        })}\n\n`,
        `data: ${JSON.stringify({ type: "text-end", id: textId })}\n\n`,
        `data: ${JSON.stringify({ type: "finish-step" })}\n\n`,
        `data: ${JSON.stringify({ type: "finish", finishReason: "stop" })}\n\n`,
        "data: [DONE]\n\n",
      ];
      const body = sseLines.join("");
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
          "x-vercel-ai-ui-message-stream": "v1",
          "x-accel-buffering": "no",
        },
        body,
      });
    });

    await page.goto("/");

    await page
      .getByRole("button", { name: "Open the Siftloom assistant" })
      .click();

    // Trigger an assistant response via a quick prompt.
    await page
      .getByRole("button", { name: "How do I add my tool to the catalog?" })
      .click();

    // The external Markdown link should render as an anchor that opens in a
    // new tab with the standard safe rel.
    const panel = page.locator("[data-slot='sheet-content']");
    const link = panel.getByRole("link", { name: "Siftloom docs" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      "href",
      "https://example.com/siftloom/docs",
    );
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(link).toHaveAttribute("rel", /noreferrer/);
  });
});
