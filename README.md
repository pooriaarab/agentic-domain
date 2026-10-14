# agentic-domain

[![npm version](https://img.shields.io/npm/v/agentic-domain)](https://www.npmjs.com/package/agentic-domain)
[![npm downloads](https://img.shields.io/npm/dm/agentic-domain)](https://www.npmjs.com/package/agentic-domain)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

agentic-domain is an open-source domain registration wrapper for Node.js developers and agents, with local previews and a Cloudflare Registrar adapter.

## Install

```sh
npm install agentic-domain
```

Requires Node.js 18 or later. Includes TypeScript declarations and three runtime dependencies.

## Preview your first domain

```sh
npx agentic-domain example.com
```

Success prints JSON with `domain: "example.com"`, `dryRun: true`, and `status: "unknown"`.
This preview validates and normalizes the name. It makes no network request and needs no credentials.

## Features and coverage

- **Domain validation:** Trim and lowercase names before checking their syntax.
- **Dry-run preview:** Return an unknown status without querying availability.
- **Registrar adapter:** Send check and purchase requests to Cloudflare.
- **Purchase flow:** Attempt purchase when the check returns `available: true`.

| Integration | Status | Verification |
| --- | --- | --- |
| Cloudflare Registrar | Implemented adapter; live behavior unverified | Mocked check and purchase requests only |

One vendor adapter exists. Tests do not establish real domain availability or successful registration.

## Library and agent tools

```js
import { runDomain } from "agentic-domain";

const preview = await runDomain("Example.COM");
console.log(preview.domain, preview.status); // example.com unknown
```

The CLI accepts a domain plus `--live`, `--help`/`-h`, or `--version`/`-V`.
Run `npx --package agentic-domain agentic-domain-mcp` for the Model Context Protocol (MCP) stdio server.
Its single tool is `check_domain`. The `live` field defaults to `false`.

Export `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` before live requests.
The package does not load `.env` files; load them in your shell or application.

```sh
npx agentic-domain your-chosen-domain.com --live
```

Live mode checks the name and attempts purchase when available; it can spend money.
A returned `purchased: true` reflects the adapter's successful HTTP response handling.
Confirm registration with Cloudflare; the adapter does not verify ownership afterward.

## Limits and status

`checkDomain` can make network requests when a token exists, even without a live flag.
`buyDomain` directly attempts purchase. Use `runDomain` for the dry-run default.
No price cap, purchase confirmation, retry policy, or explicit request timeout exists.
The adapter does not inspect Cloudflare's JSON `success` flag.
Missing availability data becomes `unavailable`; a successful purchase HTTP response becomes `purchased: true`.
The Worker entry is empty scaffolding. No managed registrar service is included.
Version 0.1.1 has an API that may change.

## Links and license

[Package and releases](https://www.npmjs.com/package/agentic-domain) · [MIT license](https://opensource.org/license/mit)
