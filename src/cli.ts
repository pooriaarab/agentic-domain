#!/usr/bin/env node
import { runDomain, VendorError } from "./core.js";
import { VERSION } from "./version.js";

function help(): string { return `agentic-domain ${VERSION}\n\nUsage: agentic-domain <domain> [--live]\n\nChecks a domain name. Dry run is the default.\n--live checks and buys through Cloudflare Registrar.`; }
export async function runCli(argv: string[]): Promise<number> {
  if (argv[0] === "--help" || argv[0] === "-h" || argv.length === 0) { console.log(help()); return argv.length ? 0 : 2; }
  if (argv[0] === "--version" || argv[0] === "-V") { console.log(VERSION); return 0; }
  const [domain, ...flags] = argv;
  if (flags.some((flag) => flag !== "--live")) { console.error("unknown flag"); return 2; }
  try { console.log(JSON.stringify(await runDomain(domain, { live: flags.includes("--live") }))); return 0; }
  catch (error) { console.error(error instanceof VendorError ? `${error.name}: ${error.message}` : String(error)); return 1; }
}
if (import.meta.url === new URL(process.argv[1], "file:").href) runCli(process.argv.slice(2)).then((code) => { if (code) process.exit(code); });
