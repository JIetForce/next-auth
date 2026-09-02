import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookieStore, mockRedirect, mockGetCurrentViewer } = vi.hoisted(
  () => ({
    mockCookieStore: {
      get: vi.fn(),
    },
    mockRedirect: vi.fn().mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    }),
    mockGetCurrentViewer: vi.fn(),
  }),
);

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentViewer: () => mockGetCurrentViewer(),
}));

vi.mock("./actions", () => ({
  resendVerificationAction: vi.fn(),
}));

import { VerifyEmailContent } from "./page";
import { ResendForm } from "./_components/resend-form";

describe("ResendForm component", () => {
  it("prefills defaultEmail when provided", () => {
    const html = renderToStaticMarkup(
      <ResendForm defaultEmail="alice@example.com" />,
    );

    expect(html).toContain('value="alice@example.com"');
    expect(html).toContain('id="resend-email"');
    expect(html).toContain('type="email"');
    // Field remains editable: input element is neither disabled nor readonly
    const inputTag = html.match(/<input\b[^>]*id="resend-email"[^>]*>/)?.[0];
    expect(inputTag).toBeDefined();
    expect(inputTag).not.toMatch(/\sdisabled(=|[\s>])/);
    expect(inputTag).not.toMatch(/\sreadonly(=|[\s>])/i);
    expect(html).toContain("Resend verification email");
  });

  it("renders an empty editable input when defaultEmail is omitted", () => {
    const html = renderToStaticMarkup(<ResendForm />);

    expect(html).toContain('id="resend-email"');
    expect(html).not.toContain('value="');
    const inputTag = html.match(/<input\b[^>]*id="resend-email"[^>]*>/)?.[0];
    expect(inputTag).toBeDefined();
    expect(inputTag).not.toMatch(/\sdisabled(=|[\s>])/);
    expect(inputTag).not.toMatch(/\sreadonly(=|[\s>])/i);
    expect(html).toContain("Resend verification email");
  });
});

describe("VerifyEmailContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentViewer.mockResolvedValue(null);
  });

  it("reads pending_verification_email cookie and passes it to ResendForm", async () => {
    mockCookieStore.get.mockReturnValue({ value: "pending@example.com" });

    const content = await VerifyEmailContent();
    const html = renderToStaticMarkup(content);

    expect(mockCookieStore.get).toHaveBeenCalledWith(
      "pending_verification_email",
    );
    expect(html).toContain('value="pending@example.com"');
    expect(html).toContain("Verification link sent");
  });

  it("renders cleanly with empty form when no pending cookie is set", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const content = await VerifyEmailContent();
    const html = renderToStaticMarkup(content);

    expect(mockCookieStore.get).toHaveBeenCalledWith(
      "pending_verification_email",
    );
    expect(html).not.toContain('value="');
    expect(html).toContain("Verification link sent");
  });

  it("redirects authenticated viewers to home", async () => {
    mockGetCurrentViewer.mockResolvedValue({
      id: "u-1",
      email: "user@example.com",
      name: "User",
      emailVerified: true,
      image: null,
    });

    await expect(VerifyEmailContent()).rejects.toThrow("REDIRECT:/");
    expect(mockRedirect).toHaveBeenCalledWith("/");
    expect(mockCookieStore.get).not.toHaveBeenCalled();
  });
});
