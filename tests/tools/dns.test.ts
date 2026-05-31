import { describe, it, expect } from "vitest";
import { createDnsTools } from "../../src/tools/dns.js";
import { GoDaddyApiError } from "../../src/errors.js";
import { mockClient } from "../helpers/mock-client.js";

describe("dns_records_list", () => {
  it("calls /v1/domains/:domain/records", async () => {
    const client = mockClient(async () => []);
    const tool = createDnsTools(client).find((t) => t.name === "dns_records_list")!;
    await tool.handler({ domain: "example.com" });
    expect(client.get).toHaveBeenCalledWith("/v1/domains/example.com/records", {
      limit: undefined,
      offset: undefined
    });
  });

  it("passes limit and offset when provided", async () => {
    const client = mockClient(async () => []);
    const tool = createDnsTools(client).find((t) => t.name === "dns_records_list")!;
    await tool.handler({ domain: "example.com", limit: 50, offset: 100 });
    expect(client.get).toHaveBeenCalledWith("/v1/domains/example.com/records", {
      limit: 50,
      offset: 100
    });
  });

  it("returns isError on API error", async () => {
    const client = mockClient(async () => {
      throw new GoDaddyApiError(403, "Forbidden", "/v1/domains/example.com/records");
    });
    const tool = createDnsTools(client).find((t) => t.name === "dns_records_list")!;
    const res = await tool.handler({ domain: "example.com" });
    expect(res.isError).toBe(true);
  });
});

describe("dns_records_list_by_type", () => {
  it("calls /v1/domains/:domain/records/:type", async () => {
    const client = mockClient(async () => []);
    const tool = createDnsTools(client).find((t) => t.name === "dns_records_list_by_type")!;
    await tool.handler({ domain: "example.com", type: "A" });
    expect(client.get).toHaveBeenCalledWith("/v1/domains/example.com/records/A", {
      limit: undefined,
      offset: undefined
    });
  });
});

describe("dns_records_get", () => {
  it("calls /v1/domains/:domain/records/:type/:name", async () => {
    const client = mockClient(async () => [{ data: "1.2.3.4", name: "@", ttl: 3600, type: "A" }]);
    const tool = createDnsTools(client).find((t) => t.name === "dns_records_get")!;
    const res = await tool.handler({ domain: "example.com", type: "A", name: "@" });
    expect(client.get).toHaveBeenCalledWith("/v1/domains/example.com/records/A/@");
    expect(JSON.parse(res.content[0].text)).toEqual([{ data: "1.2.3.4", name: "@", ttl: 3600, type: "A" }]);
  });
});

describe("dns_records_add", () => {
  it("PATCHes /v1/domains/:domain/records with records array", async () => {
    const records = [{ data: "1.2.3.4", name: "@", ttl: 3600 }];
    const client = mockClient(
      async () => ({}),
      undefined,
      undefined,
      async () => ({})
    );
    const tool = createDnsTools(client).find((t) => t.name === "dns_records_add")!;
    await tool.handler({ domain: "example.com", records });
    expect(client.patch).toHaveBeenCalledWith("/v1/domains/example.com/records", records);
  });
});

describe("dns_records_replace_by_type", () => {
  it("PUTs /v1/domains/:domain/records/:type with records array", async () => {
    const records = [{ data: "1.2.3.4", name: "@", ttl: 600 }];
    const client = mockClient(
      async () => ({}),
      undefined,
      async () => ({})
    );
    const tool = createDnsTools(client).find((t) => t.name === "dns_records_replace_by_type")!;
    await tool.handler({ domain: "example.com", type: "A", records });
    expect(client.put).toHaveBeenCalledWith("/v1/domains/example.com/records/A", records);
  });
});

describe("dns_records_delete", () => {
  it("DELETEs /v1/domains/:domain/records/:type/:name", async () => {
    const client = mockClient(
      async () => ({}),
      undefined,
      undefined,
      undefined,
      async () => ({})
    );
    const tool = createDnsTools(client).find((t) => t.name === "dns_records_delete")!;
    await tool.handler({ domain: "example.com", type: "A", name: "@" });
    expect(client.delete).toHaveBeenCalledWith("/v1/domains/example.com/records/A/@");
  });
});
