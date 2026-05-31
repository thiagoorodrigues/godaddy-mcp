import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoDaddyClient } from "../src/client.js";
import { GoDaddyApiError } from "../src/errors.js";

const baseConfig = {
  apiKey: "test-key",
  apiSecret: "test-secret",
  baseUrl: "https://api.godaddy.com",
  logLevel: "error" as const
};

describe("GoDaddyClient.get", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("sends Authorization header with sso-key format", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ([])
    });
    const client = new GoDaddyClient(baseConfig);
    await client.get("/v1/domains");
    const call = (global.fetch as any).mock.calls[0];
    expect(call[0]).toBe("https://api.godaddy.com/v1/domains");
    expect(call[1].headers["Authorization"]).toBe("sso-key test-key:test-secret");
  });

  it("serializes query params", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ([])
    });
    const client = new GoDaddyClient(baseConfig);
    await client.get("/v1/domains", { limit: 10, statuses: "ACTIVE" });
    const url = (global.fetch as any).mock.calls[0][0];
    expect(url).toContain("limit=10");
    expect(url).toContain("statuses=ACTIVE");
  });

  it("omits undefined params", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ([])
    });
    const client = new GoDaddyClient(baseConfig);
    await client.get("/v1/domains", { limit: undefined, statuses: "ACTIVE" });
    const url = (global.fetch as any).mock.calls[0][0];
    expect(url).not.toContain("limit");
    expect(url).toContain("statuses=ACTIVE");
  });

  it("returns parsed JSON on 2xx", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ domain: "example.com" })
    });
    const client = new GoDaddyClient(baseConfig);
    const data = await client.get("/v1/domains/example.com");
    expect(data).toEqual({ domain: "example.com" });
  });

  it("throws GoDaddyApiError on 4xx", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Not Found"
    });
    const client = new GoDaddyClient(baseConfig);
    await expect(client.get("/v1/domains/unknown.com")).rejects.toBeInstanceOf(GoDaddyApiError);
  });

  it("throws GoDaddyApiError on 5xx", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error"
    });
    const client = new GoDaddyClient(baseConfig);
    await expect(client.get("/v1/domains")).rejects.toMatchObject({
      status: 500,
      endpoint: "/v1/domains"
    });
  });

  it("propagates fetch network errors", async () => {
    (global.fetch as any).mockRejectedValue(new Error("ECONNREFUSED"));
    const client = new GoDaddyClient(baseConfig);
    await expect(client.get("/v1/domains")).rejects.toThrow("ECONNREFUSED");
  });

  it("normalizes trailing slash in baseUrl", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    });
    const client = new GoDaddyClient({ ...baseConfig, baseUrl: "https://api.godaddy.com/" });
    await client.get("/v1/domains");
    expect((global.fetch as any).mock.calls[0][0]).toBe("https://api.godaddy.com/v1/domains");
  });
});

describe("GoDaddyClient.post", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("sends POST with JSON body and auth header", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ orderId: "123" })
    });
    const client = new GoDaddyClient(baseConfig);
    await client.post("/v1/domains/purchase", { domain: "example.com", period: 1 });
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://api.godaddy.com/v1/domains/purchase");
    expect(init.method).toBe("POST");
    expect(init.headers["Authorization"]).toBe("sso-key test-key:test-secret");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ domain: "example.com", period: 1 });
  });

  it("throws GoDaddyApiError on 4xx", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => "Unprocessable Entity"
    });
    const client = new GoDaddyClient(baseConfig);
    await expect(client.post("/v1/domains/purchase", {})).rejects.toBeInstanceOf(GoDaddyApiError);
  });
});

describe("GoDaddyClient.patch", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("sends PATCH with JSON body and auth header", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 5 })
    });
    const client = new GoDaddyClient(baseConfig);
    await client.patch("/v1/domains/example.com", { autoRenew: true });
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://api.godaddy.com/v1/domains/example.com");
    expect(init.method).toBe("PATCH");
    expect(init.headers["Authorization"]).toBe("sso-key test-key:test-secret");
    expect(JSON.parse(init.body)).toEqual({ autoRenew: true });
  });

  it("throws GoDaddyApiError on 4xx", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Not Found"
    });
    const client = new GoDaddyClient(baseConfig);
    await expect(client.patch("/v1/domains/unknown.com", {})).rejects.toBeInstanceOf(GoDaddyApiError);
  });
});

describe("GoDaddyClient.put", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("sends PUT with JSON body and auth header", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    });
    const client = new GoDaddyClient(baseConfig);
    await client.put("/v1/domains/example.com/records/A", [{ data: "1.2.3.4", name: "@", ttl: 3600 }]);
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://api.godaddy.com/v1/domains/example.com/records/A");
    expect(init.method).toBe("PUT");
    expect(init.headers["Authorization"]).toBe("sso-key test-key:test-secret");
    expect(JSON.parse(init.body)).toEqual([{ data: "1.2.3.4", name: "@", ttl: 3600 }]);
  });

  it("throws GoDaddyApiError on 4xx", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => "Unprocessable Entity"
    });
    const client = new GoDaddyClient(baseConfig);
    await expect(client.put("/v1/domains/example.com/records/A", [])).rejects.toBeInstanceOf(GoDaddyApiError);
  });
});

describe("GoDaddyClient.delete", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("sends DELETE with auth header and no body", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({})
    });
    const client = new GoDaddyClient(baseConfig);
    await client.delete("/v1/domains/example.com/records/A/@");
    const [url, init] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://api.godaddy.com/v1/domains/example.com/records/A/@");
    expect(init.method).toBe("DELETE");
    expect(init.headers["Authorization"]).toBe("sso-key test-key:test-secret");
    expect(init.body).toBeUndefined();
  });

  it("returns empty object on 204", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({})
    });
    const client = new GoDaddyClient(baseConfig);
    const data = await client.delete("/v1/domains/example.com/records/A/@");
    expect(data).toEqual({});
  });

  it("throws GoDaddyApiError on 4xx", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "Not Found"
    });
    const client = new GoDaddyClient(baseConfig);
    await expect(client.delete("/v1/domains/example.com/records/A/@")).rejects.toBeInstanceOf(GoDaddyApiError);
  });
});
