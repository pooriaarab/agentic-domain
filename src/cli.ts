#!/usr/bin/env node
import { runDomain, VendorError } from "./core.js";
import { VERSION } from "./version.js";

function help(): string {
  return `agentic-domain ${VERSION}\n\nUsage: agentic-domain <domain> [--live]\n\nDry run is the default and makes no network request.\n--live checks availability and buys an available domain through Cloudflare Registrar.\nCredentials: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.`;
}

export async function runCli(argv: string[]): Promise<number> {
  if (argv[0] === "--help" || argv[0] === "-h") { console.log(help()); return 0; }
  if (argv[0] === "--version" || argv[0] === "-V") { console.log(VERSION); return 0; }
  if (argv.length === 0) { console.error(help()); return 2; }
  const [domain, ...flags] = argv;
  if (flags.some((flag) => flag !== "--live") || flags.filter((flag) => flag === "--live").length > 1) {
    console.error("Usage: agentic-domain <domain> [--live]");
    return 2;
  }
  try {
    console.log(JSON.stringify(await runDomain(domain, { live: flags.includes("--live") })));
    return 0;
  } catch (error) {
    console.error(error instanceof VendorError || error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    return 1;
  }
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  runCli(process.argv.slice(2)).then((code) => { if (code) process.exitCode = code; });
}
