import { describe, it, expect, vi } from "vitest";
import { registerTools } from "../../src/tools/register.js";
import type { ToolDefinition } from "../../src/tools/types.js";
import { z } from "zod";

describe("registerTools", () => {
  it("calls server.registerTool for each tool", () => {
    const server = { registerTool: vi.fn() };
    const tools: ToolDefinition[] = [
      {
        name: "domains_list",
        config: { title: "List Domains", description: "List domains", inputSchema: { limit: z.number().optional() } },
        handler: async () => ({ content: [{ type: "text", text: "ok" }] })
      },
      {
        name: "dns_records_list",
        config: { title: "List DNS", description: "List DNS records", inputSchema: {} },
        handler: async () => ({ content: [{ type: "text", text: "ok" }] })
      }
    ];
    registerTools(server as any, tools);
    expect(server.registerTool).toHaveBeenCalledTimes(2);
    expect(server.registerTool.mock.calls[0][0]).toBe("domains_list");
    expect(server.registerTool.mock.calls[1][0]).toBe("dns_records_list");
  });
});
