import { describe, expect, it, vi } from "vitest";
import { runCli } from "./cli.js";
describe("cli", () => { it("prints a dry run", async () => { const log = vi.spyOn(console, "log").mockImplementation(() => undefined); await expect(runCli(["example.com"])).resolves.toBe(0); expect(log).toHaveBeenCalledWith(expect.stringContaining('"dryRun":true')); log.mockRestore(); }); });
