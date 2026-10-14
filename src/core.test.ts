import { describe, expect, it, vi } from "vitest";
import { availabilityFixture, errorFixture, purchaseFixture, unavailableFixture } from "./__fixtures__/cloudflare.js";
import { CloudflareRegistrar, runDomain, VendorError } from "./core.js";

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("domain core", () => {
  it("is dry by default and does not call the network", async () => {
    const fetchFn = vi.fn();
    await expect(runDomain("Example.COM", { fetchFn: fetchFn as typeof fetch })).resolves.toMatchObject({ domain: "example.com", dryRun: true, status: "unknown" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("checks then purchases only when live using fixture responses", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(response(availabilityFixture))
      .mockResolvedValueOnce(response(purchaseFixture));
    const result = await runDomain("example.com", { live: true, apiToken: "fixture", accountId: "acct", fetchFn: fetchFn as typeof fetch });
    expect(result).toMatchObject({ purchased: true, orderId: "order-fixture-1", price: 12.34, dryRun: false });
    expect(fetchFn.mock.calls[0][0]).toContain("/accounts/acct/registrar/domains/example.com");
    expect(fetchFn.mock.calls[1][1]).toMatchObject({ method: "POST" });
  });

  it("never purchases an unavailable domain", async () => {
    const fetchFn = vi.fn().mockResolvedValue(response(unavailableFixture));
    const result = await runDomain("example.com", { live: true, apiToken: "fixture", accountId: "acct", fetchFn: fetchFn as typeof fetch });
    expect(result).toMatchObject({ available: false, status: "unavailable" });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("uses no network when credentials are missing", async () => {
    const fetchFn = vi.fn();
    const registrar = new CloudflareRegistrar({ apiToken: "", accountId: "", fetchFn: fetchFn as typeof fetch });
    await expect(registrar.check("example.com")).rejects.toBeInstanceOf(VendorError);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("surfaces Cloudflare fixture errors", async () => {
    const registrar = new CloudflareRegistrar({ apiToken: "fixture", accountId: "acct", fetchFn: vi.fn().mockResolvedValue(response(errorFixture, 400)) as typeof fetch });
    await expect(registrar.check("example.com")).rejects.toThrow("Registrar error");
  });

  it("validates domains before network access", async () => {
    const fetchFn = vi.fn();
    await expect(runDomain("not a domain", { fetchFn: fetchFn as typeof fetch })).rejects.toThrow("invalid domain");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
