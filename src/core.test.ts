import { describe, expect, it, vi } from "vitest";
import { CloudflareRegistrar, runDomain, VendorError } from "./core.js";

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("domain core", () => {
  it("is dry by default, exits without a request, and does not report unavailable", async () => {
    const fetchFn = vi.fn();
    await expect(runDomain("Example.COM", { fetchFn: fetchFn as typeof fetch })).resolves.toMatchObject({
      domain: "example.com",
      dryRun: true,
      status: "unknown",
      available: false,
      vendor: "cloudflare",
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("calls the Cloudflare HTTPS host to check then buy in live mode", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(response({ result: { available: true, price: 12, currency: "USD" } }))
      .mockResolvedValueOnce(response({ result: { id: "order-1" } }));
    const result = await runDomain("example.com", {
      live: true,
      apiToken: "fixture",
      accountId: "acct",
      fetchFn: fetchFn as typeof fetch,
    });

    expect(result).toMatchObject({ purchased: true, orderId: "order-1", dryRun: false });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn.mock.calls[0][0]).toBe(
      "https://api.cloudflare.com/client/v4/accounts/acct/registrar/domains/example.com",
    );
    expect(fetchFn.mock.calls[1][0]).toBe(
      "https://api.cloudflare.com/client/v4/accounts/acct/registrar/domains",
    );
    expect(fetchFn.mock.calls[1][1]).toMatchObject({ method: "POST" });
  });

  it("never buys an unavailable domain in live mode", async () => {
    const fetchFn = vi.fn().mockResolvedValue(response({ result: { available: false } }));
    const result = await runDomain("example.com", {
      live: true,
      apiToken: "fixture",
      accountId: "acct",
      fetchFn: fetchFn as typeof fetch,
    });
    expect(result).toMatchObject({ available: false, status: "unavailable", dryRun: false });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("reports missing credentials without using the network", async () => {
    const fetchFn = vi.fn();
    const registrar = new CloudflareRegistrar({ apiToken: "", accountId: "", fetchFn: fetchFn as typeof fetch });
    await expect(registrar.check("example.com")).rejects.toBeInstanceOf(VendorError);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
