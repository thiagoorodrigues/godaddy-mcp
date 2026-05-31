import { z } from "zod";
import type { GoDaddyClient } from "../client.js";
import type { ToolDefinition } from "./types.js";
import { successResponse, genericErrorResponse } from "../errors.js";

const DnsRecordSchema = z.object({
  data: z.string().min(1),
  name: z.string().min(1),
  ttl: z.number().int().positive().default(3600),
  priority: z.number().int().nonnegative().optional(),
  port: z.number().int().positive().optional(),
  protocol: z.string().optional(),
  service: z.string().optional(),
  weight: z.number().int().nonnegative().optional()
});

type DnsRecord = z.infer<typeof DnsRecordSchema>;

const DNS_TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "SOA", "SRV", "TXT", "ALIAS", "CAA", "PTR"] as const;

export function createDnsTools(client: GoDaddyClient): ToolDefinition[] {
  return [
    {
      name: "dns_records_list",
      config: {
        title: "List DNS Records",
        description: "List all DNS records for a domain. Supports limit and offset for pagination.",
        inputSchema: {
          domain: z.string().min(1),
          limit: z.number().int().positive().max(500).optional(),
          offset: z.number().int().nonnegative().optional()
        }
      },
      handler: async (input: { domain: string; limit?: number; offset?: number }) => {
        try {
          const data = await client.get(`/v1/domains/${input.domain}/records`, {
            limit: input.limit,
            offset: input.offset
          });
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "dns_records_list_by_type",
      config: {
        title: "List DNS Records by Type",
        description: `List DNS records for a domain filtered by type. Valid types: ${DNS_TYPES.join(", ")}.`,
        inputSchema: {
          domain: z.string().min(1),
          type: z.enum(DNS_TYPES),
          limit: z.number().int().positive().max(500).optional(),
          offset: z.number().int().nonnegative().optional()
        }
      },
      handler: async (input: { domain: string; type: string; limit?: number; offset?: number }) => {
        try {
          const data = await client.get(`/v1/domains/${input.domain}/records/${input.type}`, {
            limit: input.limit,
            offset: input.offset
          });
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "dns_records_get",
      config: {
        title: "Get DNS Record",
        description: "Get a specific DNS record by type and name. Use '@' for the root/apex record.",
        inputSchema: {
          domain: z.string().min(1),
          type: z.enum(DNS_TYPES),
          name: z.string().min(1)
        }
      },
      handler: async (input: { domain: string; type: string; name: string }) => {
        try {
          const data = await client.get(`/v1/domains/${input.domain}/records/${input.type}/${input.name}`);
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "dns_records_add",
      config: {
        title: "Add DNS Records",
        description: "Add DNS records to a domain without replacing existing ones. Each record requires data and name; ttl defaults to 3600. Use '@' for root/apex name.",
        inputSchema: {
          domain: z.string().min(1),
          records: z.array(DnsRecordSchema.extend({ type: z.enum(DNS_TYPES) })).min(1)
        }
      },
      handler: async (input: { domain: string; records: Array<DnsRecord & { type: string }> }) => {
        try {
          const data = await client.patch(`/v1/domains/${input.domain}/records`, input.records);
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "dns_records_replace_by_type",
      config: {
        title: "Replace DNS Records by Type",
        description: "WARNING: REPLACES ALL existing records of the given type for this domain. Use dns_records_list_by_type first to retrieve current records if you need to preserve any. Valid types: A, AAAA, CNAME, MX, NS, SOA, SRV, TXT, ALIAS, CAA, PTR.",
        inputSchema: {
          domain: z.string().min(1),
          type: z.enum(DNS_TYPES),
          records: z.array(DnsRecordSchema).min(1)
        }
      },
      handler: async (input: { domain: string; type: string; records: DnsRecord[] }) => {
        try {
          const data = await client.put(`/v1/domains/${input.domain}/records/${input.type}`, input.records);
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    },
    {
      name: "dns_records_delete",
      config: {
        title: "Delete DNS Record",
        description: "Delete a specific DNS record by type and name. Use '@' for the root/apex record. This action cannot be undone.",
        inputSchema: {
          domain: z.string().min(1),
          type: z.enum(DNS_TYPES),
          name: z.string().min(1)
        }
      },
      handler: async (input: { domain: string; type: string; name: string }) => {
        try {
          const data = await client.delete(`/v1/domains/${input.domain}/records/${input.type}/${input.name}`);
          return successResponse(data);
        } catch (e) {
          return genericErrorResponse(e);
        }
      }
    }
  ];
}
