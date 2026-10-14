import { describe, expect, it } from "vitest";
import { createMcpServer } from "./mcp.js";
describe("mcp", () => { it("creates a server", () => expect(createMcpServer()).toBeDefined()); });
