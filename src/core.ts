/** Cloudflare Registrar implementation. Network access occurs only for `live: true`. */
export type DomainStatus = "available" | "unavailable" | "unknown";
export type Vendor = "cloudflare";

export interface DomainCheck {
  domain: string;
  status: DomainStatus;
  available: boolean;
  vendor: Vendor;
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
  /** Cloudflare API token; defaults to CLOUDFLARE_API_TOKEN. */
  apiToken?: string;
  /** Cloudflare account ID; defaults to CLOUDFLARE_ACCOUNT_ID. */
  accountId?: string;
  /** Injectable transport, intended for tests. */
  fetchFn?: typeof fetch;
}

interface CloudflareEnvelope<T> { success?: boolean; errors?: Array<{ message?: string }>; result?: T }
interface CheckResult { available?: boolean; price?: number | string; currency?: string }
interface PurchaseResult { id?: string; order_id?: string; price?: number | string; currency?: string }

export function validateDomain(domain: string): string {
  const value = domain.trim().toLowerCase();
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) {
    throw new Error(`invalid domain "${domain}"`);
  }
  return value;
}

function numberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return undefined;
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

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const { token, accountId } = this.credentials();
    let response: Response;
    try {
      response = await this.fetchFn(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}${path}`, {
        ...init,
        headers: { authorization: `Bearer ${token}`, ...init.headers },
      });
    } catch (error) {
      throw new VendorError(`Cloudflare request failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
    const raw = await response.text();
    let body: CloudflareEnvelope<T>;
    try { body = raw ? JSON.parse(raw) as CloudflareEnvelope<T> : {}; }
    catch { throw new VendorError(`Cloudflare returned invalid JSON (${response.status}).`, { status: response.status }); }
    if (!response.ok || body.success === false) {
      const detail = body.errors?.map((error) => error.message).filter(Boolean).join("; ") || raw || response.statusText;
      throw new VendorError(`Cloudflare request failed (${response.status}): ${detail}`, { status: response.status });
    }
    if (!body.result) throw new VendorError("Cloudflare response did not include a result.", { status: response.status });
    return body.result;
  }

  /** Check availability through Cloudflare Registrar. */
  async check(domain: string): Promise<DomainCheck> {
    const name = validateDomain(domain);
    const result = await this.request<CheckResult>(`/registrar/domains/${encodeURIComponent(name)}`);
    const available = result.available === true;
    return { domain: name, status: available ? "available" : "unavailable", available, vendor: "cloudflare", dryRun: false, price: numberOrUndefined(result.price), currency: result.currency };
  }

  /** Purchase an available domain through Cloudflare Registrar. */
  async buy(domain: string): Promise<DomainPurchase> {
    const name = validateDomain(domain);
    const result = await this.request<PurchaseResult>("/registrar/domains", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return { domain: name, status: "available", available: true, vendor: "cloudflare", dryRun: false, purchased: true, orderId: result.id ?? result.order_id, price: numberOrUndefined(result.price), currency: result.currency };
  }
}

/** Live-only availability check. Use `runDomain` for the safe default workflow. */
export async function checkDomain(domain: string, options: CloudflareOptions = {}): Promise<DomainCheck> {
  return new CloudflareRegistrar(options).check(domain);
}

/** Live-only purchase. This deliberately never performs an availability check. */
export async function buyDomain(domain: string, options: CloudflareOptions = {}): Promise<DomainPurchase> {
  return new CloudflareRegistrar(options).buy(domain);
}

/**
 * Safe end-to-end domain workflow. No network request or purchase happens unless
 * `live` is explicitly true. In live mode an unavailable domain is never bought.
 */
export async function runDomain(domain: string, options: CloudflareOptions & { live?: boolean } = {}): Promise<DomainCheck | DomainPurchase> {
  const name = validateDomain(domain);
  if (!options.live) {
    return { domain: name, status: "unknown", available: false, vendor: "cloudflare", dryRun: true, reason: "Dry run: pass --live to check and buy through Cloudflare Registrar." };
  }
  const registrar = new CloudflareRegistrar(options);
  const checked = await registrar.check(name);
  return checked.available ? registrar.buy(name) : checked;
}
