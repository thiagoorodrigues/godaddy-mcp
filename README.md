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
