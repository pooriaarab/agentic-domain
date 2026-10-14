import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runDomain, VendorError } from "./core.js";
import { VERSION } from "./version.js";
const output = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }] });
export function createMcpServer(): McpServer {
  const server = new McpServer({ name: "agentic-domain", version: VERSION });
  server.registerTool("check_domain", { description: "Check a domain. Dry run by default; live checks and buys it.", inputSchema: { domain: z.string(), live: z.boolean().optional() } }, async ({ domain, live }) => {
    try { return output(await runDomain(domain, { live: live ?? false })); } catch (error) { const message = error instanceof VendorError ? error.message : String(error); return { ...output({ error: message }), isError: true }; }
  });
  return server;
}
export async function startMcp(): Promise<void> { const server = createMcpServer(); await server.connect(new StdioServerTransport()); }
