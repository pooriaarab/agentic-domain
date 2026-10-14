import { describe, expect, it, vi } from "vitest";
import { runCli } from "./cli.js";

describe("CLI", () => {
  it("prints a dry-run receipt by default", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await expect(runCli(["example.com"])).resolves.toBe(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"dryRun":true'));
    log.mockRestore();
  });
  it("rejects unknown arguments", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(runCli(["example.com", "--nope"])).resolves.toBe(2);
    error.mockRestore();
  });
});
