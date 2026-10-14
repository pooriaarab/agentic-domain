# agentic-domain

Check one domain name. Buy it only when you pass `--live`.

Cloudflare Registrar is the vendor. Dry run is the default.

## Install

```sh
npm install -g agentic-domain
```

## Quick start

This is a dry run. It does not call Cloudflare or buy anything.

```sh
agentic-domain example.com
```

```json
{"domain":"example.com","status":"unknown","available":false,"vendor":"cloudflare","dryRun":true}
```

## CLI

Check and buy only after you have reviewed the dry run.

```sh
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
agentic-domain example.com --live
```

Vendor errors are returned unchanged. A missing credential is a clear error.

## Library

```ts
import { runDomain } from "agentic-domain";

const result = await runDomain("example.com");
```

Pass `{ live: true }` to check and buy through Cloudflare Registrar.

## MCP

```sh
agentic-domain-mcp
```

Call `check_domain` with `{ "domain": "example.com" }` for a dry run. Pass
`"live": true` to check and buy.
