import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuthCardShell } from "./auth-card-shell";

describe("AuthCardShell", () => {
  it("renders terms and privacy links with correct hrefs", () => {
    const html = renderToStaticMarkup(
      <AuthCardShell
        badge={<span>Test Badge</span>}
        title="Test Title"
        description="Test Description"
      >
        <div>Form Content</div>
      </AuthCardShell>,
    );

    expect(html).toContain('href="/terms"');
    expect(html).toContain("Terms of Service");
    expect(html).toContain('href="/privacy"');
    expect(html).toContain("Privacy Policy");
    expect(html).not.toContain('href="/"');
  });
});
