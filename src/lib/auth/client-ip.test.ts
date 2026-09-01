import { describe, expect, it } from "vitest";

import { getClientIp } from "@/lib/auth/client-ip";

describe("getClientIp", () => {
  describe("x-real-ip precedence", () => {
    it("returns x-real-ip when only x-real-ip is present", () => {
      const headers = new Headers({
        "x-real-ip": "203.0.113.195",
      });

      expect(getClientIp(headers)).toBe("203.0.113.195");
    });

    it("prioritizes x-real-ip over x-forwarded-for when both are present", () => {
      const headers = new Headers({
        "x-real-ip": "203.0.113.195",
        "x-forwarded-for": "198.51.100.1, 192.0.2.1",
      });

      expect(getClientIp(headers)).toBe("203.0.113.195");
    });
  });

  describe("x-forwarded-for parsing", () => {
    it("takes the first entry when x-forwarded-for contains multiple IPs", () => {
      const headers = new Headers({
        "x-forwarded-for": "198.51.100.1, 192.0.2.1, 10.0.0.1",
      });

      expect(getClientIp(headers)).toBe("198.51.100.1");
    });

    it("trims whitespace from the first entry of x-forwarded-for", () => {
      const headers = new Headers({
        "x-forwarded-for": "   198.51.100.42   , 192.0.2.1",
      });

      expect(getClientIp(headers)).toBe("198.51.100.42");
    });

    it("handles single IP in x-forwarded-for", () => {
      const headers = new Headers({
        "x-forwarded-for": "198.51.100.42",
      });

      expect(getClientIp(headers)).toBe("198.51.100.42");
    });
  });

  describe("unknown fallback", () => {
    it("returns 'unknown' when neither header is present", () => {
      const headers = new Headers();

      expect(getClientIp(headers)).toBe("unknown");
    });

    it("returns 'unknown' when headers only contain unrelated entries", () => {
      const headers = new Headers({
        "user-agent": "Mozilla/5.0",
        accept: "application/json",
      });

      expect(getClientIp(headers)).toBe("unknown");
    });

    it("returns 'unknown' when x-forwarded-for is empty or whitespace", () => {
      const emptyHeaders = new Headers({
        "x-forwarded-for": "",
      });
      expect(getClientIp(emptyHeaders)).toBe("unknown");

      const whitespaceHeaders = new Headers({
        "x-forwarded-for": "   ",
      });
      expect(getClientIp(whitespaceHeaders)).toBe("unknown");
    });

    it("returns 'unknown' when x-forwarded-for contains only commas", () => {
      const headers = new Headers({
        "x-forwarded-for": ",,,",
      });

      expect(getClientIp(headers)).toBe("unknown");
    });
  });
});
