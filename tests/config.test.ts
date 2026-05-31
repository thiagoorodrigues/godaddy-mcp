import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GODADDY_API_KEY;
    delete process.env.GODADDY_API_SECRET;
    delete process.env.GODADDY_BASE_URL;
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("loads valid config from env", () => {
    process.env.GODADDY_API_KEY = "test-key";
    process.env.GODADDY_API_SECRET = "test-secret";
    const cfg = loadConfig();
    expect(cfg.apiKey).toBe("test-key");
    expect(cfg.apiSecret).toBe("test-secret");
    expect(cfg.baseUrl).toBe("https://api.godaddy.com");
    expect(cfg.logLevel).toBe("info");
  });

  it("uses custom base URL when provided", () => {
    process.env.GODADDY_API_KEY = "k";
    process.env.GODADDY_API_SECRET = "s";
    process.env.GODADDY_BASE_URL = "https://api.ote-godaddy.com";
    expect(loadConfig().baseUrl).toBe("https://api.ote-godaddy.com");
  });

  it("throws when GODADDY_API_KEY is missing", () => {
    process.env.GODADDY_API_SECRET = "s";
    expect(() => loadConfig()).toThrow(/GODADDY_API_KEY/);
  });

  it("throws when GODADDY_API_SECRET is missing", () => {
    process.env.GODADDY_API_KEY = "k";
    expect(() => loadConfig()).toThrow(/GODADDY_API_SECRET/);
  });

  it("accepts valid LOG_LEVEL values", () => {
    process.env.GODADDY_API_KEY = "k";
    process.env.GODADDY_API_SECRET = "s";
    process.env.LOG_LEVEL = "debug";
    expect(loadConfig().logLevel).toBe("debug");
  });

  it("rejects invalid LOG_LEVEL", () => {
    process.env.GODADDY_API_KEY = "k";
    process.env.GODADDY_API_SECRET = "s";
    process.env.LOG_LEVEL = "verbose";
    expect(() => loadConfig()).toThrow(/LOG_LEVEL/);
  });
});
