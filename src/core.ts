export type DomainStatus = "available" | "unavailable" | "unknown";

export interface DomainCheck {
  domain: string;
  status: DomainStatus;
  available: boolean;
  vendor: "cloudflare";
  dryRun: boolean;
  price?: number;
  currency?: string;
  reason?: string;
}

export interface DomainPurchase extends DomainCheck {
  purchased: boolean;
  orderId?: string;
}

export class VendorError extends Error {
  readonly code = "VENDOR_FAILED";
  readonly status?: number;
  constructor(message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = "VendorError";
    this.status = options.status;
  }
}

export interface CloudflareOptions {
  apiToken?: string;
  zoneId?: string;
  accountId?: string;
  fetchFn?: typeof fetch;
}

function validateDomain(domain: string): string {
  const value = domain.trim().toLowerCase();
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) {
    throw new Error(`invalid domain "${domain}"`);
  }
  return value;
}

export class CloudflareRegistrar {
  private readonly apiToken?: string;
  private readonly accountId?: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: CloudflareOptions = {}) {
    this.apiToken = options.apiToken ?? process.env.CLOUDFLARE_API_TOKEN;
    this.accountId = options.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  private credentials(): { token: string; accountId: string } {
    if (!this.apiToken) throw new VendorError("Cloudflare API token is missing. Set CLOUDFLARE_API_TOKEN.");
    if (!this.accountId) throw new VendorError("Cloudflare account ID is missing. Set CLOUDFLARE_ACCOUNT_ID.");
    return { token: this.apiToken, accountId: this.accountId };
  }

  async check(domain: string): Promise<DomainCheck> {
    const name = validateDomain(domain);
    const { token, accountId } = this.credentials();
    let response: Response;
    try {
      response = await this.fetchFn(`https://api.cloudflare.com/client/v4/accounts/${accountId}/registrar/domains/${encodeURIComponent(name)}`, {
        headers: { authorization: `Bearer ${token}` },
      });
    } catch (error) {
      throw new VendorError(`Cloudflare request failed: ${String(error)}`, { cause: error });
    }
    const body = await response.text();
    if (!response.ok) throw new VendorError(`Cloudflare check failed (${response.status}): ${body}`, { status: response.status });
    const data = JSON.parse(body) as { result?: { available?: boolean; price?: number; currency?: string } };
    const available = data.result?.available === true;
    return { domain: name, status: available ? "available" : "unavailable", available, vendor: "cloudflare", dryRun: false, price: data.result?.price, currency: data.result?.currency };
  }

  async buy(domain: string): Promise<DomainPurchase> {
    const name = validateDomain(domain);
    const { token, accountId } = this.credentials();
    let response: Response;
    try {
      response = await this.fetchFn(`https://api.cloudflare.com/client/v4/accounts/${accountId}/registrar/domains`, {
        method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ name }),
      });
    } catch (error) {
      throw new VendorError(`Cloudflare purchase request failed: ${String(error)}`, { cause: error });
    }
    const body = await response.text();
    if (!response.ok) throw new VendorError(`Cloudflare purchase failed (${response.status}): ${body}`, { status: response.status });
    const data = JSON.parse(body) as { result?: { id?: string; price?: number; currency?: string } };
    return { domain: name, status: "available", available: true, vendor: "cloudflare", dryRun: false, purchased: true, orderId: data.result?.id, price: data.result?.price, currency: data.result?.currency };
  }
}

export async function checkDomain(domain: string, options: CloudflareOptions = {}): Promise<DomainCheck> {
  const name = validateDomain(domain);
  if (!options.apiToken && !process.env.CLOUDFLARE_API_TOKEN) return { domain: name, status: "unknown", available: false, vendor: "cloudflare", dryRun: true, reason: "Dry run. Set --live and CLOUDFLARE_API_TOKEN to check Cloudflare." };
  return new CloudflareRegistrar(options).check(name);
}

export async function buyDomain(domain: string, options: CloudflareOptions = {}): Promise<DomainPurchase> {
  return new CloudflareRegistrar(options).buy(domain);
}

export async function runDomain(domain: string, options: CloudflareOptions & { live?: boolean } = {}): Promise<DomainCheck | DomainPurchase> {
  const name = validateDomain(domain);
  if (!options.live) return { domain: name, status: "unknown", available: false, vendor: "cloudflare", dryRun: true, reason: "Dry run. Pass --live to check and buy through Cloudflare Registrar." };
  const registrar = new CloudflareRegistrar(options);
  const checked = await registrar.check(name);
  if (!checked.available) return checked;
  return registrar.buy(name);
}
