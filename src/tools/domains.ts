import { z } from "zod";
import type { GoDaddyClient } from "../client.js";
import type { ToolDefinition } from "./types.js";
import { successResponse, genericErrorResponse } from "../errors.js";

export function createDomainsTools(client: GoDaddyClient): ToolDefinition[] {
  return [
    {
      name: "domains_list",
      config: {
        title: "List Domains",
        description: "List domains in your GoDaddy account. Optional filters: statuses (e.g. ACTIVE, CANCELLED), limit (max results), marker (cursor for next page).",
        inputSchema: {
          statuses: z.string().optional(),
          limit: z.number().int().positive().max(1000).optional(),
          marker: z.string().optional()
        }
      },
      handler: async (input: { statuses?: string; limit?: number; marker?: string }) => {
        try {
          const data = await client.get("/v1/domains", {
            statuses: input.statuses,
            limit: input.limit,
            marker: input.marker
          });
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "domains_get",
      config: {
        title: "Get Domain",
        description: "Get details of a single domain by name (e.g. 'example.com').",
        inputSchema: {
          domain: z.string().min(1)
        }
      },
      handler: async (input: { domain: string }) => {
        try {
          const data = await client.get(`/v1/domains/${input.domain}`);
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "domains_check_availability",
      config: {
        title: "Check Domain Availability",
        description: "Check if a domain name is available for registration.",
        inputSchema: {
          domain: z.string().min(1)
        }
      },
      handler: async (input: { domain: string }) => {
        try {
          const data = await client.get("/v1/domains/available", { domain: input.domain });
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "domains_suggest",
      config: {
        title: "Suggest Domains",
        description: "Suggest available domain names based on a query string. Returns alternatives with availability.",
        inputSchema: {
          query: z.string().min(1),
          count: z.number().int().positive().max(50).optional()
        }
      },
      handler: async (input: { query: string; count?: number }) => {
        try {
          const data = await client.get("/v1/domains/suggest", {
            query: input.query,
            count: input.count
          });
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "domains_purchase",
      config: {
        title: "Purchase Domain",
        description: "Register a domain. Pass the full GoDaddy purchase request object as purchaseRequest — must include domain, consent (agreedAt, agreedBy, agreementKeys), contact fields (contactAdmin, contactBilling, contactRegistrant, contactTech), period, privacy, and renewAuto. Use domains_check_availability first.",
        inputSchema: {
          purchaseRequest: z.record(z.unknown())
        }
      },
      handler: async (input: { purchaseRequest: Record<string, unknown> }) => {
        try {
          const data = await client.post("/v1/domains/purchase", input.purchaseRequest);
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "domains_renew",
      config: {
        title: "Renew Domain",
        description: "Renew a domain registration. Optionally specify the number of years (period). Defaults to 1 year if not provided.",
        inputSchema: {
          domain: z.string().min(1),
          period: z.number().int().positive().max(10).optional()
        }
      },
      handler: async (input: { domain: string; period?: number }) => {
        try {
          const body: Record<string, unknown> = {};
          if (input.period !== undefined) body.period = input.period;
          const data = await client.post(`/v1/domains/${input.domain}/renew`, body);
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "domains_update",
      config: {
        title: "Update Domain",
        description: "Update domain settings. Only provided fields are changed. Supported fields: autoRenew, locked, privacy.",
        inputSchema: {
          domain: z.string().min(1),
          autoRenew: z.boolean().optional(),
          locked: z.boolean().optional(),
          privacy: z.boolean().optional()
        }
      },
      handler: async (input: { domain: string; autoRenew?: boolean; locked?: boolean; privacy?: boolean }) => {
        try {
          const body: Record<string, unknown> = {};
          if (input.autoRenew !== undefined) body.autoRenew = input.autoRenew;
          if (input.locked !== undefined) body.locked = input.locked;
          if (input.privacy !== undefined) body.privacy = input.privacy;
          const data = await client.patch(`/v1/domains/${input.domain}`, body);
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "domains_cancel",
      config: {
        title: "Cancel Domain",
        description: "IRREVERSIBLE — cancel and delete a domain registration. This action cannot be undone. Verify the domain name before calling.",
        inputSchema: {
          domain: z.string().min(1)
        }
      },
      handler: async (input: { domain: string }) => {
        try {
          const data = await client.delete(`/v1/domains/${input.domain}`);
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    }
  ];
}
