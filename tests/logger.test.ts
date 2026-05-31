import { describe, it, expect, vi, afterEach } from "vitest";
import { createLogger } from "../src/logger.js";

describe("createLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes info messages to stderr", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const logger = createLogger("info");
    logger.info("hello");
    expect(write).toHaveBeenCalledOnce();
    expect(write.mock.calls[0][0]).toContain("[info]");
    expect(write.mock.calls[0][0]).toContain("hello");
  });

  it("suppresses debug messages at info level", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const logger = createLogger("info");
    logger.debug("secret");
    expect(write).not.toHaveBeenCalled();
  });

  it("writes warn and error at warn level", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const logger = createLogger("warn");
    logger.warn("careful");
    logger.error("boom");
    expect(write).toHaveBeenCalledTimes(2);
  });

  it("suppresses info at warn level", () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const logger = createLogger("warn");
    logger.info("nope");
    expect(write).not.toHaveBeenCalled();
  });
});
