# agentic-domain

agentic-domain checks a domain and buys it only with `--live` through **Cloudflare Registrar**. Cloudflare Registrar is the real vendor. The default command is a dry run. It exits successfully and does not use the network.

## Install

```sh
npm install -g agentic-domain
```

## Vendors

| Brand | Environment key | Live command |
| --- | --- | --- |
| Cloudflare Registrar | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | `agentic-domain example.com --live` |

## CLI

Preview a domain safely. This command does not check availability. It does not buy a domain.

```sh
agentic-domain example.com
```

```json
{"domain":"example.com","status":"unknown","available":false,"vendor":"cloudflare","dryRun":true}
```

Check availability and buy only when the domain is available.

```sh
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... \
  agentic-domain example.com --live
```

Live mode calls the Cloudflare API. An unavailable domain is not purchased.

## Library

```ts
import { runDomain } from "agentic-domain";

const preview = await runDomain("example.com");
const receipt = await runDomain("example.com", { live: true });
```

## MCP

```sh
agentic-domain-mcp
```

Call `check_domain` with `{ "domain": "example.com" }` for a dry run. Pass
`"live": true` to check Cloudflare and buy an available domain.
