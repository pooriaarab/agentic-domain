import { describe, expect, it } from "vitest";
import { createMcpServer } from "./mcp.js";

describe("MCP", () => {
  it("creates a domain server", () => expect(createMcpServer()).toBeDefined());
});
