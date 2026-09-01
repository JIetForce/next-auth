import { beforeEach, describe, expect, it, vi } from "vitest";

import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

describe("consumeRateLimit", () => {
  const mockTx = {
    $queryRaw: vi.fn(),
    rateLimit: {
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return callback(mockTx as unknown as Parameters<typeof callback>[0]);
    });
  });

  describe("within budget", () => {
    it("creates a new bucket and allows the request when no row exists", async () => {
      mockTx.$queryRaw.mockResolvedValue([]);
      mockTx.rateLimit.create.mockResolvedValue({ id: "mock-id" });

      const allowed = await consumeRateLimit(
        "login:alice@example.com",
        5,
        60_000,
      );

      expect(allowed).toBe(true);
      expect(mockTx.rateLimit.create).toHaveBeenCalledTimes(1);
      expect(mockTx.rateLimit.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          key: "action:login:alice@example.com",
          count: 1,
          lastRequest: expect.any(BigInt),
        },
      });
      expect(mockTx.rateLimit.update).not.toHaveBeenCalled();
    });

    it("increments the bucket and allows the request when count is below max", async () => {
      const now = BigInt(Date.now());
      mockTx.$queryRaw.mockResolvedValue([{ count: 3, lastRequest: now }]);
      mockTx.rateLimit.update.mockResolvedValue({ id: "mock-id" });

      const allowed = await consumeRateLimit(
        "login:alice@example.com",
        5,
        60_000,
      );

      expect(allowed).toBe(true);
      expect(mockTx.rateLimit.create).not.toHaveBeenCalled();
      expect(mockTx.rateLimit.update).toHaveBeenCalledTimes(1);
      expect(mockTx.rateLimit.update).toHaveBeenCalledWith({
        where: { key: "action:login:alice@example.com" },
        data: {
          count: { increment: 1 },
          lastRequest: expect.any(BigInt),
        },
      });
    });
  });

  describe("over budget", () => {
    it("rejects the request when count reaches max", async () => {
      const now = BigInt(Date.now());
      mockTx.$queryRaw.mockResolvedValue([{ count: 5, lastRequest: now }]);

      const allowed = await consumeRateLimit(
        "login:alice@example.com",
        5,
        60_000,
      );

      expect(allowed).toBe(false);
      expect(mockTx.rateLimit.create).not.toHaveBeenCalled();
      expect(mockTx.rateLimit.update).not.toHaveBeenCalled();
    });

    it("rejects the request when count exceeds max", async () => {
      const now = BigInt(Date.now());
      mockTx.$queryRaw.mockResolvedValue([{ count: 8, lastRequest: now }]);

      const allowed = await consumeRateLimit(
        "login:alice@example.com",
        5,
        60_000,
      );

      expect(allowed).toBe(false);
      expect(mockTx.rateLimit.create).not.toHaveBeenCalled();
      expect(mockTx.rateLimit.update).not.toHaveBeenCalled();
    });
  });

  describe("window expiry resets the count", () => {
    it("resets count to 1 and allows the request when the window has elapsed", async () => {
      const expiredTimestamp = BigInt(Date.now() - 120_000);
      mockTx.$queryRaw.mockResolvedValue([
        { count: 10, lastRequest: expiredTimestamp },
      ]);
      mockTx.rateLimit.update.mockResolvedValue({ id: "mock-id" });

      const allowed = await consumeRateLimit(
        "login:alice@example.com",
        5,
        60_000,
      );

      expect(allowed).toBe(true);
      expect(mockTx.rateLimit.create).not.toHaveBeenCalled();
      expect(mockTx.rateLimit.update).toHaveBeenCalledTimes(1);
      expect(mockTx.rateLimit.update).toHaveBeenCalledWith({
        where: { key: "action:login:alice@example.com" },
        data: {
          count: 1,
          lastRequest: expect.any(BigInt),
        },
      });
    });
  });

  describe("database error returns false (fails closed)", () => {
    it("returns false when the transaction fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(prisma.$transaction).mockRejectedValue(
        new Error("DB connection failure"),
      );

      const allowed = await consumeRateLimit(
        "login:alice@example.com",
        5,
        60_000,
      );

      expect(allowed).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "consumeRateLimit failed closed:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it("returns false when a query fails inside the transaction", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockTx.$queryRaw.mockRejectedValue(new Error("Deadlock detected"));

      const allowed = await consumeRateLimit(
        "login:alice@example.com",
        5,
        60_000,
      );

      expect(allowed).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "consumeRateLimit failed closed:",
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
