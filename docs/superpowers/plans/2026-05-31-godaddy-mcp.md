# GoDaddy MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript MCP server that exposes the GoDaddy API (Domains + DNS, CRUD completo) via stdio transport, publishable to npm.

**Architecture:** Follows the `runrun-mcp` pattern — `GoDaddyClient` HTTP class, `loadConfig()` for env vars, tools organized in `src/tools/domains.ts` and `src/tools/dns.ts`, registered via `registerTools()` in `src/index.ts`.

**Tech Stack:** TypeScript 5.x, `@modelcontextprotocol/sdk ^1.0.0`, `zod ^3.x`, `vitest`, Node.js ≥ 18, STDIO transport.

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, scripts, bin entry (`godaddy-mcp → dist/index.js`) |
| `tsconfig.json` | TypeScript config (ES2022, Node16 modules) |
| `vitest.config.ts` | Test runner config |
| `.env.example` | Documented env var template |
| `.gitignore` | Ignore `node_modules/`, `dist/` |
| `src/errors.ts` | `GoDaddyApiError`, `successResponse`, `apiErrorResponse`, `networkErrorResponse`, `genericErrorResponse`, `McpToolResponse` type |
| `src/logger.ts` | `LogLevel` type, `createLogger()` |
| `src/config.ts` | `Config` type, `loadConfig()` — reads `GODADDY_API_KEY`, `GODADDY_API_SECRET`, `GODADDY_BASE_URL`, `LOG_LEVEL` |
| `src/client.ts` | `GoDaddyClient` class — `get`, `post`, `put`, `patch`, `delete`; injects `Authorization: sso-key KEY:SECRET` |
| `src/tools/types.ts` | `ToolDefinition` interface |
| `src/tools/register.ts` | `registerTools(server, tools)` |
| `src/tools/domains.ts` | `createDomainsTools(client)` — 8 tools |
| `src/tools/dns.ts` | `createDnsTools(client)` — 6 tools |
| `src/tools/index.ts` | `registerAllTools(server, client)` |
| `src/index.ts` | Entry point: bootstrap McpServer + StdioServerTransport |
| `README.md` | Usage, config, tool reference, npm/claude config |
| `tests/errors.test.ts` | Unit tests for errors.ts |
| `tests/logger.test.ts` | Unit tests for logger.ts |
| `tests/config.test.ts` | Unit tests for config.ts |
| `tests/client.test.ts` | Unit tests for client.ts |
| `tests/tools/register.test.ts` | Unit tests for register.ts |
| `tests/tools/domains.test.ts` | Unit tests for domains.ts |
| `tests/tools/dns.test.ts` | Unit tests for dns.ts |
| `tests/helpers/mock-client.ts` | `mockClient()` helper |

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "godaddy-mcp",
  "version": "0.1.0",
  "description": "MCP server for GoDaddy API (Domains + DNS).",
  "license": "MIT",
  "type": "module",
  "bin": {
    "godaddy-mcp": "dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "postbuild": "chmod +x dist/index.js",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "npm run build && npm test"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": false,
    "sourceMap": false,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts"]
    }
  }
});
```

- [ ] **Step 4: Create .env.example**

```
# Required — get from https://developer.godaddy.com/keys
GODADDY_API_KEY=
GODADDY_API_SECRET=

# Optional — defaults shown
# GODADDY_BASE_URL=https://api.godaddy.com
# LOG_LEVEL=info
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
.env
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`

Expected: `node_modules/` created, `package-lock.json` generated.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .env.example .gitignore package-lock.json
git commit -m "chore: project scaffold"
```

---

## Task 2: Errors and logger

**Files:**
- Create: `src/errors.ts`
- Create: `src/logger.ts`
- Create: `tests/errors.test.ts`
- Create: `tests/logger.test.ts`

- [ ] **Step 1: Write failing tests for errors.ts**

Create `tests/errors.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- tests/errors.test.ts`

Expected: FAIL — `Cannot find module '../src/errors.js'`

- [ ] **Step 3: Write failing tests for logger.ts**

Create `tests/logger.test.ts`:

```typescript
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
```

- [ ] **Step 4: Create src/errors.ts**

```typescript
export type McpToolResponse = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export class GoDaddyApiError extends Error {
  constructor(
    public status: number,
    public body: string,
    public endpoint: string
  ) {
    super(`GoDaddy API error (${status}) on ${endpoint}: ${body}`);
    this.name = "GoDaddyApiError";
  }
}

export function successResponse(data: unknown): McpToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
  };
}

export function apiErrorResponse(err: GoDaddyApiError): McpToolResponse {
  const rateLimitNote = err.status === 429 ? " (rate limit — retry later)" : "";
  return {
    content: [
      {
        type: "text",
        text: `GoDaddy API error (status ${err.status}) on ${err.endpoint}${rateLimitNote}: ${err.body}`
      }
    ],
    isError: true
  };
}

export function networkErrorResponse(err: Error): McpToolResponse {
  return {
    content: [{ type: "text", text: `Network error: ${err.message}` }],
    isError: true
  };
}

export function genericErrorResponse(err: unknown): McpToolResponse {
  if (err instanceof GoDaddyApiError) return apiErrorResponse(err);
  if (err instanceof Error) return networkErrorResponse(err);
  return networkErrorResponse(new Error(String(err)));
}
```

- [ ] **Step 5: Create src/logger.ts**

```typescript
export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

export interface Logger {
  debug(msg: string): void;
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
}

export function createLogger(level: LogLevel): Logger {
  const threshold = LEVEL_ORDER[level];

  const log = (lvl: LogLevel, msg: string) => {
    if (LEVEL_ORDER[lvl] < threshold) return;
    const ts = new Date().toISOString();
    process.stderr.write(`[${ts}] [${lvl}] ${msg}\n`);
  };

  return {
    debug: (m) => log("debug", m),
    info: (m) => log("info", m),
    warn: (m) => log("warn", m),
    error: (m) => log("error", m)
  };
}
```

- [ ] **Step 6: Run tests — expect PASS**

Run: `npm test -- tests/errors.test.ts tests/logger.test.ts`

Expected: all 10 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/errors.ts src/logger.ts tests/errors.test.ts tests/logger.test.ts
git commit -m "feat: add errors and logger"
```

---

## Task 3: Config

**Files:**
- Create: `src/config.ts`
- Create: `tests/config.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/config.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- tests/config.test.ts`

Expected: FAIL — `Cannot find module '../src/config.js'`

- [ ] **Step 3: Create src/config.ts**

```typescript
import { z } from "zod";

const ConfigSchema = z.object({
  apiKey: z.string().min(1, "GODADDY_API_KEY must not be empty"),
  apiSecret: z.string().min(1, "GODADDY_API_SECRET must not be empty"),
  baseUrl: z.string().url(),
  logLevel: z.enum(["debug", "info", "warn", "error"])
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const apiKey = process.env.GODADDY_API_KEY;
  const apiSecret = process.env.GODADDY_API_SECRET;

  if (!apiKey) {
    throw new Error("Missing required environment variable: GODADDY_API_KEY");
  }
  if (!apiSecret) {
    throw new Error("Missing required environment variable: GODADDY_API_SECRET");
  }

  const raw = {
    apiKey,
    apiSecret,
    baseUrl: process.env.GODADDY_BASE_URL ?? "https://api.godaddy.com",
    logLevel: process.env.LOG_LEVEL ?? "info"
  };

  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const pathKey = issue.path.join(".");
    const envVarMap: Record<string, string> = {
      apiKey: "GODADDY_API_KEY",
      apiSecret: "GODADDY_API_SECRET",
      baseUrl: "GODADDY_BASE_URL",
      logLevel: "LOG_LEVEL"
    };
    const envVar = envVarMap[pathKey] ?? pathKey;
    throw new Error(`Invalid config (${envVar}): ${issue.message}`);
  }
  return result.data;
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- tests/config.test.ts`

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/config.ts tests/config.test.ts
git commit -m "feat: add config loader"
```

---

## Task 4: HTTP Client

**Files:**
- Create: `src/client.ts`
- Create: `tests/client.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/client.test.ts`:

```typescript
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
      json: async () => ({})
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
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- tests/client.test.ts`

Expected: FAIL — `Cannot find module '../src/client.js'`

- [ ] **Step 3: Create src/client.ts**

```typescript
import type { Config } from "./config.js";
import { GoDaddyApiError } from "./errors.js";

export type QueryParams = Record<string, string | number | boolean | undefined>;
export type BodyParams = Record<string, unknown> | unknown[];

export class GoDaddyClient {
  constructor(private readonly config: Config) {}

  async get<T = unknown>(path: string, params: QueryParams = {}): Promise<T> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, {
      method: "GET",
      headers: this.authHeaders()
    });
    return this.parseResponse<T>(res, path);
  }

  async post<T = unknown>(path: string, body: BodyParams): Promise<T> {
    const url = this.buildUrl(path, {});
    const res = await fetch(url, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify(body)
    });
    return this.parseResponse<T>(res, path);
  }

  async put<T = unknown>(path: string, body: BodyParams): Promise<T> {
    const url = this.buildUrl(path, {});
    const res = await fetch(url, {
      method: "PUT",
      headers: this.authHeaders(),
      body: JSON.stringify(body)
    });
    return this.parseResponse<T>(res, path);
  }

  async patch<T = unknown>(path: string, body: BodyParams): Promise<T> {
    const url = this.buildUrl(path, {});
    const res = await fetch(url, {
      method: "PATCH",
      headers: this.authHeaders(),
      body: JSON.stringify(body)
    });
    return this.parseResponse<T>(res, path);
  }

  async delete<T = unknown>(path: string): Promise<T> {
    const url = this.buildUrl(path, {});
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.authHeaders()
    });
    return this.parseResponse<T>(res, path);
  }

  private authHeaders() {
    return {
      Authorization: `sso-key ${this.config.apiKey}:${this.config.apiSecret}`,
      "Content-Type": "application/json"
    };
  }

  private async parseResponse<T>(res: Response, path: string): Promise<T> {
    if (!res.ok) {
      const body = await res.text();
      throw new GoDaddyApiError(res.status, body, path);
    }
    if (res.status === 204) {
      return {} as T;
    }
    return (await res.json()) as T;
  }

  private buildUrl(path: string, params: QueryParams): string {
    const url = new URL(this.config.baseUrl.replace(/\/$/, "") + path);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- tests/client.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/client.ts tests/client.test.ts
git commit -m "feat: add GoDaddy HTTP client"
```

---

## Task 5: Tool infrastructure

**Files:**
- Create: `src/tools/types.ts`
- Create: `src/tools/register.ts`
- Create: `tests/helpers/mock-client.ts`
- Create: `tests/tools/register.test.ts`

- [ ] **Step 1: Write failing test for register.ts**

Create `tests/tools/register.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- tests/tools/register.test.ts`

Expected: FAIL — `Cannot find module '../../src/tools/register.js'`

- [ ] **Step 3: Create src/tools/types.ts**

```typescript
import type { ZodRawShape } from "zod";
import type { McpToolResponse } from "../errors.js";

export interface ToolDefinition {
  name: string;
  config: {
    title: string;
    description: string;
    inputSchema?: ZodRawShape;
  };
  handler: (input: any) => Promise<McpToolResponse>;
}
```

- [ ] **Step 4: Create src/tools/register.ts**

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolDefinition } from "./types.js";

export function registerTools(server: McpServer, tools: ToolDefinition[]): void {
  for (const tool of tools) {
    server.registerTool(tool.name, tool.config, tool.handler);
  }
}
```

- [ ] **Step 5: Create tests/helpers/mock-client.ts**

```typescript
import { vi } from "vitest";
import type { GoDaddyClient } from "../../src/client.js";

export function mockClient(
  getImpl: (...args: Parameters<GoDaddyClient["get"]>) => ReturnType<GoDaddyClient["get"]>,
  postImpl?: (path: string, body: unknown) => Promise<unknown>,
  putImpl?: (path: string, body: unknown) => Promise<unknown>,
  patchImpl?: (path: string, body: unknown) => Promise<unknown>,
  deleteImpl?: (path: string) => Promise<unknown>
): GoDaddyClient {
  return {
    get: vi.fn(getImpl),
    post: vi.fn(postImpl ?? (async () => ({}))),
    put: vi.fn(putImpl ?? (async () => ({}))),
    patch: vi.fn(patchImpl ?? (async () => ({}))),
    delete: vi.fn(deleteImpl ?? (async () => ({})))
  } as unknown as GoDaddyClient;
}
```

- [ ] **Step 6: Run test — expect PASS**

Run: `npm test -- tests/tools/register.test.ts`

Expected: 1 test passes.

- [ ] **Step 7: Commit**

```bash
git add src/tools/types.ts src/tools/register.ts tests/tools/register.test.ts tests/helpers/mock-client.ts
git commit -m "feat: add tool infrastructure (types, register, mock-client)"
```

---

## Task 6: Domain tools

**Files:**
- Create: `src/tools/domains.ts`
- Create: `tests/tools/domains.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/tools/domains.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- tests/tools/domains.test.ts`

Expected: FAIL — `Cannot find module '../../src/tools/domains.js'`

- [ ] **Step 3: Create src/tools/domains.ts**

```typescript
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
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- tests/tools/domains.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/tools/domains.ts tests/tools/domains.test.ts
git commit -m "feat: add domain tools (list, get, check, suggest, purchase, renew, update, cancel)"
```

---

## Task 7: DNS tools

**Files:**
- Create: `src/tools/dns.ts`
- Create: `tests/tools/dns.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/tools/dns.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- tests/tools/dns.test.ts`

Expected: FAIL — `Cannot find module '../../src/tools/dns.js'`

- [ ] **Step 3: Create src/tools/dns.ts**

```typescript
import { z } from "zod";
import type { GoDaddyClient } from "../client.js";
import type { ToolDefinition } from "./types.js";
import { successResponse, genericErrorResponse } from "../errors.js";

const DnsRecordSchema = z.object({
  data: z.string().min(1),
  name: z.string().min(1),
  ttl: z.number().int().positive().optional(),
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
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- tests/tools/dns.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/tools/dns.ts tests/tools/dns.test.ts
git commit -m "feat: add DNS tools (list, list-by-type, get, add, replace-by-type, delete)"
```

---

## Task 8: Wire tools + entry point

**Files:**
- Create: `src/tools/index.ts`
- Create: `src/index.ts`

- [ ] **Step 1: Create src/tools/index.ts**

```typescript
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
```

- [ ] **Step 2: Create src/index.ts**

```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { GoDaddyClient } from "./client.js";
import { registerAllTools } from "./tools/index.js";

async function main() {
  let config;
  try {
    config = loadConfig();
  } catch (e) {
    process.stderr.write(
      `godaddy-mcp: configuration error: ${(e as Error).message}\n`
    );
    process.exit(1);
  }

  const logger = createLogger(config.logLevel);
  logger.info(`godaddy-mcp starting (baseUrl=${config.baseUrl})`);

  const client = new GoDaddyClient(config);
  const server = new McpServer({
    name: "godaddy-mcp",
    version: "0.1.0"
  });

  registerAllTools(server, client);
  logger.info("Registered all tools");

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Connected to STDIO transport, ready");
}

main().catch((e) => {
  process.stderr.write(`godaddy-mcp: fatal error: ${(e as Error).message}\n`);
  process.exit(1);
});
```

- [ ] **Step 3: Build to verify TypeScript compiles cleanly**

Run: `npm run build`

Expected: `dist/` directory created with `index.js` and all supporting files. Zero TypeScript errors.

- [ ] **Step 4: Run full test suite**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/tools/index.ts src/index.ts dist/
git commit -m "feat: wire tools and entry point"
```

---

## Task 9: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# godaddy-mcp

MCP server for the GoDaddy API. Exposes domain management and DNS record operations via the Model Context Protocol.

## Tools

### Domains

| Tool | Description |
|------|-------------|
| `domains_list` | List domains in your account |
| `domains_get` | Get details of a specific domain |
| `domains_check_availability` | Check if a domain is available for registration |
| `domains_suggest` | Suggest available domain names from a query |
| `domains_purchase` | Register a domain |
| `domains_renew` | Renew a domain registration |
| `domains_update` | Update domain settings (autoRenew, locked, privacy) |
| `domains_cancel` | **IRREVERSIBLE** — cancel a domain registration |

### DNS Records

| Tool | Description |
|------|-------------|
| `dns_records_list` | List all DNS records for a domain |
| `dns_records_list_by_type` | List DNS records by type (A, CNAME, MX, TXT, etc.) |
| `dns_records_get` | Get a specific DNS record by type and name |
| `dns_records_add` | Add DNS records (non-destructive) |
| `dns_records_replace_by_type` | **Replaces all records** of a given type |
| `dns_records_delete` | Delete a specific DNS record |

## Configuration

Get your API key and secret at https://developer.godaddy.com/keys.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GODADDY_API_KEY` | yes | — | GoDaddy API Key |
| `GODADDY_API_SECRET` | yes | — | GoDaddy API Secret |
| `GODADDY_BASE_URL` | no | `https://api.godaddy.com` | Override for OTE/sandbox |
| `LOG_LEVEL` | no | `info` | `debug`, `info`, `warn`, or `error` |

## Usage

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "godaddy": {
      "command": "npx",
      "args": ["-y", "godaddy-mcp"],
      "env": {
        "GODADDY_API_KEY": "your-api-key",
        "GODADDY_API_SECRET": "your-api-secret"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add godaddy -- npx -y godaddy-mcp
```

Then set the env vars in your shell or `.env`.

### Local development

```bash
git clone https://github.com/thiagoorodrigues/godaddy-mcp
cd godaddy-mcp
npm install
cp .env.example .env   # fill in your credentials
npm run build
GODADDY_API_KEY=... GODADDY_API_SECRET=... node dist/index.js
```

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with tool reference and usage"
```

- [ ] **Step 3: Push to remote**

```bash
git push -u origin main
```

Expected: branch pushed to `git@github.com:thiagoorodrigues/godaddy-mcp.git`.

---

## Final verification

- [ ] Run `npm test` — all tests pass
- [ ] Run `npm run build` — zero TypeScript errors, `dist/index.js` is executable
- [ ] Verify `node dist/index.js` exits with config error when env vars are missing (expected: stderr message `godaddy-mcp: configuration error: Missing required environment variable: GODADDY_API_KEY`)
