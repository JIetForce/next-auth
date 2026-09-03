import { describe, expect, it } from "vitest";

import { getViewerInitials } from "@/components/user-avatar";
import type { Viewer } from "@/lib/auth/types";

function createViewer(overrides: Partial<Viewer> = {}): Viewer {
  return {
    id: "test-user-id",
    name: null,
    email: null,
    image: null,
    emailVerified: false,
    ...overrides,
  };
}

describe("getViewerInitials", () => {
  it("extracts initials from multi-word names", () => {
    expect(getViewerInitials(createViewer({ name: "Jane Doe" }))).toBe("JD");
    expect(
      getViewerInitials(createViewer({ name: "John Fitzgerald Kennedy" })),
    ).toBe("JK");
    expect(getViewerInitials(createViewer({ name: "  alice   bob  " }))).toBe(
      "AB",
    );
  });

  it("extracts initials from single-word names using the first two characters", () => {
    expect(getViewerInitials(createViewer({ name: "Cher" }))).toBe("CH");
    expect(getViewerInitials(createViewer({ name: "Madonna" }))).toBe("MA");
    expect(getViewerInitials(createViewer({ name: "A" }))).toBe("A");
  });

  it("handles multi-byte and unicode names correctly", () => {
    // Latin multi-word
    expect(getViewerInitials(createViewer({ name: "Alexander Ivanov" }))).toBe(
      "AI",
    );
    // Latin single-word
    expect(getViewerInitials(createViewer({ name: "Vladimir" }))).toBe("VL");
    // Accented characters
    expect(getViewerInitials(createViewer({ name: "Élodie Dupont" }))).toBe(
      "ÉD",
    );
    // CJK characters
    expect(getViewerInitials(createViewer({ name: "田中 太郎" }))).toBe("田太");
  });

  it("falls back to email local part when name is absent or blank", () => {
    // Multi-part email (dot, underscore, hyphen)
    expect(
      getViewerInitials(
        createViewer({ name: null, email: "jane.doe@example.com" }),
      ),
    ).toBe("JD");
    expect(
      getViewerInitials(
        createViewer({ name: "", email: "alice_smith@example.com" }),
      ),
    ).toBe("AS");
    expect(
      getViewerInitials(
        createViewer({ name: "   ", email: "bob-builder@example.com" }),
      ),
    ).toBe("BB");

    // Single-part email local part
    expect(
      getViewerInitials(
        createViewer({ name: null, email: "developer@example.com" }),
      ),
    ).toBe("DE");
  });

  it("falls back to 'U' when both name and email are absent or unparseable", () => {
    expect(getViewerInitials(createViewer({ name: null, email: null }))).toBe(
      "U",
    );
    expect(getViewerInitials(createViewer({ name: "", email: "" }))).toBe("U");
    expect(getViewerInitials(createViewer({ name: "   ", email: "   " }))).toBe(
      "U",
    );
    expect(
      getViewerInitials(createViewer({ name: null, email: "@example.com" })),
    ).toBe("U");
  });
});
