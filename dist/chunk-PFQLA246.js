import {
  VERSION
} from "./chunk-4QE7E5UQ.js";
import {
  runDomain
} from "./chunk-5ZAOQRRZ.js";

// src/mcp.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
var output = (value) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });
function createMcpServer() {
  const server = new McpServer({ name: "agentic-domain", version: VERSION });
  server.registerTool("check_domain", {
    description: "Preview a Cloudflare Registrar domain workflow by default. Set live=true only to check and purchase an available domain.",
    inputSchema: { domain: z.string().describe("Fully-qualified domain name"), live: z.boolean().optional().describe("Perform the real check and purchase; defaults to false") }
  }, async ({ domain, live }) => {
    try {
      return output(await runDomain(domain, { live: live === true }));
    } catch (error) {
      return { ...output({ error: error instanceof Error ? error.message : String(error) }), isError: true };
    }
  });
  return server;
}
async function startMcp() {
  const server = createMcpServer();
  await server.connect(new StdioServerTransport());
}

export {
  createMcpServer,
  startMcp
};
