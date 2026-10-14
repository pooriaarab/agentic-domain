import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

declare function createMcpServer(): McpServer;
declare function startMcp(): Promise<void>;

export { createMcpServer, startMcp };
