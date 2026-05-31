import { describe, it, expect } from "vitest";
import { createDomainsTools } from "../../src/tools/domains.js";
import { GoDaddyApiError } from "../../src/errors.js";
import { mockClient } from "../helpers/mock-client.js";

describe("domains_list", () => {
  it("calls /v1/domains with no params by default", async () => {
    const client = mockClient(async () => []);
    const tool = createDomainsTools(client).find((t) => t.name === "domains_list")!;
    await tool.handler({});
    expect(client.get).toHaveBeenCalledWith("/v1/domains", {
      limit: undefined,
      marker: undefined,
      statuses: undefined
    });
  });

  it("passes statuses, limit, marker when provided", async () => {
    const client = mockClient(async () => []);
    const tool = createDomainsTools(client).find((t) => t.name === "domains_list")!;
    await tool.handler({ statuses: "ACTIVE", limit: 20, marker: "next-cursor" });
    expect(client.get).toHaveBeenCalledWith("/v1/domains", {
      limit: 20,
      marker: "next-cursor",
      statuses: "ACTIVE"
    });
  });

  it("returns isError on API error", async () => {
    const client = mockClient(async () => {
      throw new GoDaddyApiError(401, "Unauthorized", "/v1/domains");
    });
    const tool = createDomainsTools(client).find((t) => t.name === "domains_list")!;
    const res = await tool.handler({});
    expect(res.isError).toBe(true);
  });
});

describe("domains_get", () => {
  it("calls /v1/domains/:domain", async () => {
    const client = mockClient(async () => ({ domain: "example.com" }));
    const tool = createDomainsTools(client).find((t) => t.name === "domains_get")!;
    const res = await tool.handler({ domain: "example.com" });
    expect(client.get).toHaveBeenCalledWith("/v1/domains/example.com");
    expect(JSON.parse(res.content[0].text)).toEqual({ domain: "example.com" });
  });
});

describe("domains_check_availability", () => {
  it("calls /v1/domains/available with domain param", async () => {
    const client = mockClient(async () => ({ available: true, domain: "example.com" }));
    const tool = createDomainsTools(client).find((t) => t.name === "domains_check_availability")!;
    await tool.handler({ domain: "example.com" });
    expect(client.get).toHaveBeenCalledWith("/v1/domains/available", { domain: "example.com" });
  });
});

describe("domains_suggest", () => {
  it("calls /v1/domains/suggest with query", async () => {
    const client = mockClient(async () => []);
    const tool = createDomainsTools(client).find((t) => t.name === "domains_suggest")!;
    await tool.handler({ query: "myapp", count: 5 });
    expect(client.get).toHaveBeenCalledWith("/v1/domains/suggest", { query: "myapp", count: 5 });
  });
});

describe("domains_purchase", () => {
  it("POSTs to /v1/domains/purchase with purchase request body", async () => {
    const client = mockClient(
      async () => ({}),
      async () => ({ orderId: "order-1" })
    );
    const tool = createDomainsTools(client).find((t) => t.name === "domains_purchase")!;
    const purchaseRequest = { domain: "example.com", period: 1 };
    const res = await tool.handler({ purchaseRequest });
    expect(client.post).toHaveBeenCalledWith("/v1/domains/purchase", purchaseRequest);
    expect(JSON.parse(res.content[0].text)).toEqual({ orderId: "order-1" });
  });
});

describe("domains_renew", () => {
  it("POSTs to /v1/domains/:domain/renew", async () => {
    const client = mockClient(
      async () => ({}),
      async () => ({ orderId: "order-2" })
    );
    const tool = createDomainsTools(client).find((t) => t.name === "domains_renew")!;
    await tool.handler({ domain: "example.com", period: 2 });
    expect(client.post).toHaveBeenCalledWith("/v1/domains/example.com/renew", { period: 2 });
  });

  it("sends empty body when period is omitted", async () => {
    const client = mockClient(
      async () => ({}),
      async () => ({})
    );
    const tool = createDomainsTools(client).find((t) => t.name === "domains_renew")!;
    await tool.handler({ domain: "example.com" });
    expect(client.post).toHaveBeenCalledWith("/v1/domains/example.com/renew", {});
  });
});

describe("domains_update", () => {
  it("PATCHes /v1/domains/:domain with provided fields only", async () => {
    const client = mockClient(
      async () => ({}),
      undefined,
      undefined,
      async () => ({})
    );
    const tool = createDomainsTools(client).find((t) => t.name === "domains_update")!;
    await tool.handler({ domain: "example.com", autoRenew: true });
    expect(client.patch).toHaveBeenCalledWith("/v1/domains/example.com", { autoRenew: true });
  });

  it("omits undefined fields from PATCH body", async () => {
    const client = mockClient(
      async () => ({}),
      undefined,
      undefined,
      async () => ({})
    );
    const tool = createDomainsTools(client).find((t) => t.name === "domains_update")!;
    await tool.handler({ domain: "example.com", privacy: false });
    const body = (client.patch as any).mock.calls[0][1];
    expect(body).not.toHaveProperty("autoRenew");
    expect(body).not.toHaveProperty("locked");
    expect(body).toHaveProperty("privacy", false);
  });
});

describe("domains_cancel", () => {
  it("DELETEs /v1/domains/:domain", async () => {
    const client = mockClient(
      async () => ({}),
      undefined,
      undefined,
      undefined,
      async () => ({})
    );
    const tool = createDomainsTools(client).find((t) => t.name === "domains_cancel")!;
    await tool.handler({ domain: "example.com" });
    expect(client.delete).toHaveBeenCalledWith("/v1/domains/example.com");
  });
});
