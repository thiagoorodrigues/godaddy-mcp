import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoDaddyClient } from "../client.js";
import { registerTools } from "./register.js";
import { createDomainsTools } from "./domains.js";
import { createDnsTools } from "./dns.js";

export function registerAllTools(server: McpServer, client: GoDaddyClient): void {
  registerTools(server, [
    ...createDomainsTools(client),
    ...createDnsTools(client)
  ]);
}
