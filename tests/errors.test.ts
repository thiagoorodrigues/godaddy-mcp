import { describe, it, expect } from "vitest";
import {
  successResponse,
  apiErrorResponse,
  networkErrorResponse,
  genericErrorResponse,
  GoDaddyApiError
} from "../src/errors.js";

describe("successResponse", () => {
  it("wraps data as MCP text content", () => {
    const r = successResponse({ id: "example.com" });
    expect(r.isError).toBeUndefined();
    expect(r.content).toHaveLength(1);
    expect(r.content[0].type).toBe("text");
    expect(JSON.parse(r.content[0].text)).toEqual({ id: "example.com" });
  });
});

describe("apiErrorResponse", () => {
  it("formats 4xx as MCP error", () => {
    const err = new GoDaddyApiError(404, "Not Found", "/v1/domains/example.com");
    const r = apiErrorResponse(err);
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("404");
    expect(r.content[0].text).toContain("Not Found");
  });

  it("flags 429 as rate limit", () => {
    const err = new GoDaddyApiError(429, "Too Many Requests", "/v1/domains");
    const r = apiErrorResponse(err);
    expect(r.content[0].text).toContain("rate limit");
  });
});

describe("networkErrorResponse", () => {
  it("formats network errors", () => {
    const r = networkErrorResponse(new Error("ECONNREFUSED"));
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("Network error");
    expect(r.content[0].text).toContain("ECONNREFUSED");
  });
});

describe("genericErrorResponse", () => {
  it("routes GoDaddyApiError to apiErrorResponse", () => {
    const err = new GoDaddyApiError(404, "Not Found", "/v1/domains/x.com");
    const r = genericErrorResponse(err);
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("404");
  });

  it("routes plain Error to networkErrorResponse", () => {
    const r = genericErrorResponse(new Error("ETIMEDOUT"));
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("Network error");
  });

  it("handles non-Error throws (string)", () => {
    const r = genericErrorResponse("something exploded");
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain("something exploded");
  });
});
