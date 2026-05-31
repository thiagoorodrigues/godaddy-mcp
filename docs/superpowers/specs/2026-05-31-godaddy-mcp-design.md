# GoDaddy MCP — Design Spec

**Date:** 2026-05-31  
**Status:** Approved  
**Scope:** MCP server for GoDaddy API (Domains + DNS, CRUD completo)

---

## Overview

MCP server TypeScript que expõe a API GoDaddy via Model Context Protocol. Cobre gerenciamento de domínios e registros DNS com operações de leitura e escrita. Publicado no npm e também usado internamente pela equipe South.

---

## Arquitetura

Segue o padrão estabelecido pelo `runrun-mcp` (repositório de referência da South):

```
godaddy-mcp/
├── src/
│   ├── index.ts           # Entry point — inicializa McpServer + StdioServerTransport
│   ├── client.ts          # GoDaddy HTTP client (GET/POST/PUT/PATCH/DELETE)
│   ├── config.ts          # Carrega e valida variáveis de ambiente
│   ├── errors.ts          # GoDaddyApiError + successResponse + genericErrorResponse
│   ├── logger.ts          # Logger simples (stderr, levels)
│   └── tools/
│       ├── index.ts       # registerAllTools() — agrega todos os módulos
│       ├── register.ts    # Helper: itera ToolDefinition[] e registra no McpServer
│       ├── types.ts       # Tipo ToolDefinition
│       ├── domains.ts     # 8 tools de domínios
│       └── dns.ts         # 6 tools de DNS
├── package.json           # bin: godaddy-mcp → dist/index.js
├── tsconfig.json
├── vitest.config.ts
├── .env.example
└── README.md
```

### Stack

- **Runtime:** Node.js ≥ 18
- **Linguagem:** TypeScript 5.x
- **MCP SDK:** `@modelcontextprotocol/sdk ^1.0.0`
- **Validação:** `zod ^3.x`
- **Testes:** `vitest`
- **Transport:** STDIO (padrão para MCPs locais/npm)

---

## Autenticação

A API GoDaddy usa API Key + Secret. Cada request inclui:

```
Authorization: sso-key {GODADDY_API_KEY}:{GODADDY_API_SECRET}
Content-Type: application/json
```

### Variáveis de Ambiente

| Variável | Obrigatória | Default | Descrição |
|----------|-------------|---------|-----------|
| `GODADDY_API_KEY` | sim | — | API Key da conta GoDaddy |
| `GODADDY_API_SECRET` | sim | — | API Secret da conta GoDaddy |
| `GODADDY_BASE_URL` | não | `https://api.godaddy.com` | Base URL (útil para OTE/sandbox) |
| `LOG_LEVEL` | não | `info` | Nível de log: `debug`, `info`, `warn`, `error` |

---

## HTTP Client (`src/client.ts`)

Classe `GoDaddyClient` com métodos `get`, `post`, `put`, `patch`, `delete`. Constrói URLs com base em `config.baseUrl`, injeta headers de autenticação, trata respostas não-OK lançando `GoDaddyApiError`.

---

## Tools de Domínios (`src/tools/domains.ts`)

**8 tools** mapeando a API `v1/domains`:

| Tool | Método HTTP | Endpoint | Descrição |
|------|-------------|----------|-----------|
| `domains_list` | GET | `/v1/domains` | Lista domínios da conta. Filtros: `statuses`, `limit`, `marker` |
| `domains_get` | GET | `/v1/domains/{domain}` | Detalhes de um domínio específico |
| `domains_check_availability` | GET | `/v1/domains/available` | Verifica disponibilidade de um domínio |
| `domains_suggest` | GET | `/v1/domains/suggest` | Sugere domínios disponíveis a partir de uma query |
| `domains_purchase` | POST | `/v1/domains/purchase` | Registra um domínio (requer dados de contato + pagamento) |
| `domains_renew` | POST | `/v1/domains/{domain}/renew` | Renova domínio por N anos |
| `domains_update` | PATCH | `/v1/domains/{domain}` | Atualiza configurações: `autoRenew`, `locked`, `privacy` |
| `domains_cancel` | DELETE | `/v1/domains/{domain}` | **IRREVERSÍVEL** — cancela registro do domínio |

---

## Tools de DNS (`src/tools/dns.ts`)

**6 tools** mapeando a API `v1/domains/{domain}/records`:

| Tool | Método HTTP | Endpoint | Descrição |
|------|-------------|----------|-----------|
| `dns_records_list` | GET | `/v1/domains/{domain}/records` | Lista todos os registros DNS |
| `dns_records_list_by_type` | GET | `/v1/domains/{domain}/records/{type}` | Lista registros por tipo (A, CNAME, MX, TXT, etc.) |
| `dns_records_get` | GET | `/v1/domains/{domain}/records/{type}/{name}` | Obtém registro específico por tipo e nome |
| `dns_records_add` | PATCH | `/v1/domains/{domain}/records` | Adiciona registros sem substituir os existentes |
| `dns_records_replace_by_type` | PUT | `/v1/domains/{domain}/records/{type}` | **SUBSTITUI TODOS** os registros do tipo especificado |
| `dns_records_delete` | DELETE | `/v1/domains/{domain}/records/{type}/{name}` | Deleta registro específico por tipo e nome |

---

## Tratamento de Erros

- `GoDaddyApiError` captura status HTTP + body da resposta
- Cada handler envolve chamadas em try/catch e retorna `genericErrorResponse(e)`
- Erros de configuração (env vars ausentes) são capturados no bootstrap e terminam o processo com mensagem clara no stderr

---

## Testes

- Testes unitários com `vitest`
- Foco em validação de input schema (Zod) e mapeamento correto dos parâmetros para URLs/bodies
- Client mockado nos testes de tools
- `prepublishOnly` roda build + testes antes de publicar no npm

---

## Distribuição

- `bin.godaddy-mcp` aponta para `dist/index.js` — permite `npx godaddy-mcp` e instalação global
- Campos `files` no `package.json`: `["dist", "README.md", "LICENSE"]`
- Compatível com configuração de MCP em `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "godaddy": {
      "command": "npx",
      "args": ["-y", "godaddy-mcp"],
      "env": {
        "GODADDY_API_KEY": "...",
        "GODADDY_API_SECRET": "..."
      }
    }
  }
}
```
