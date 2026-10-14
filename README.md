# agentic-domain

Safely check and buy a domain through **Cloudflare Registrar**. It ships as a TypeScript library, CLI, and MCP server.

> **Safety:** all commands and MCP calls are dry runs by default. Nothing reaches Cloudflare or purchases a domain until `--live` (or MCP `live: true`) is explicitly supplied. Live mode checks first and buys only when the domain is available.

## Install

```bash
npm install agentic-domain
```

## CLI

```bash
# safe preview; no network access
npx agentic-domain example.com

# checks then buys an available domain
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... \
  npx agentic-domain example.com --live
```

The JSON result includes `dryRun`, `status`, availability, and (for a successful purchase) `orderId`. The API token needs the Cloudflare permissions required for Registrar operations.

## Library

```ts
import { runDomain, checkDomain, buyDomain } from "agentic-domain";

const preview = await runDomain("example.com"); // no request
const receipt = await runDomain("example.com", { live: true }); // check, then buy if available

// Low-level methods are live-only; use them only when intentionally making a request.
const check = await checkDomain("example.com");
const purchase = await buyDomain("example.com");
```

Provide `apiToken` and `accountId` in the options to avoid environment variables. A custom `fetchFn` is supported for testing.

## MCP

```json
{
  "mcpServers": {
    "agentic-domain": { "command": "npx", "args": ["-y", "agentic-domain", "mcp"] }
  }
}
```

The `check_domain` tool accepts `{ "domain": "example.com", "live": false }`. Omit `live` for the safe preview. Setting `live` to true checks Cloudflare and purchases only if available.

## Development

```bash
npm test
npm run typecheck
npm run build
```

Tests use injected fetch fixtures and never call the network.
