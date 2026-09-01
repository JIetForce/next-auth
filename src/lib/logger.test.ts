import { describe, expect, it } from "vitest";

import { logger } from "@/lib/logger";

describe("logger", () => {
  it("provides structured logging methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("defaults level to info when LOG_LEVEL is not set", () => {
    expect(logger.level).toBe(process.env.LOG_LEVEL || "info");
  });
});
