import { describe, expect, it } from "vitest";
import { CloudflareRegistrar, runDomain, VendorError } from "./core.js";

describe("domain core", () => {
  it("is dry by default", async () => {
    await expect(runDomain("example.com")).resolves.toMatchObject({ domain: "example.com", dryRun: true, vendor: "cloudflare" });
  });
  it("uses fixture responses for a live check and purchase", async () => {
    const calls: string[] = [];
    const fetchFn = async (url: string, init?: RequestInit) => { calls.push(`${init?.method ?? "GET"} ${url}`); return new Response(JSON.stringify({ result: init?.method === "POST" ? { id: "order-1" } : { available: true, price: 12, currency: "USD" } }), { status: 200 }); };
    const registrar = new CloudflareRegistrar({ apiToken: "fixture", accountId: "acct", fetchFn: fetchFn as typeof fetch });
    await expect(registrar.check("example.com")).resolves.toMatchObject({ available: true, price: 12 });
    await expect(registrar.buy("example.com")).resolves.toMatchObject({ purchased: true, orderId: "order-1" });
    expect(calls).toHaveLength(2);
  });
  it("reports missing keys clearly", async () => {
    const registrar = new CloudflareRegistrar({ apiToken: "", accountId: "" });
    await expect(registrar.check("example.com")).rejects.toBeInstanceOf(VendorError);
  });
});
