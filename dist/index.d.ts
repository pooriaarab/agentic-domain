/** Cloudflare Registrar implementation. Network access occurs only for `live: true`. */
type DomainStatus = "available" | "unavailable" | "unknown";
type Vendor = "cloudflare";
interface DomainCheck {
    domain: string;
    status: DomainStatus;
    available: boolean;
    vendor: Vendor;
    dryRun: boolean;
    price?: number;
    currency?: string;
    reason?: string;
}
interface DomainPurchase extends DomainCheck {
    purchased: boolean;
    orderId?: string;
}
declare class VendorError extends Error {
    readonly code = "VENDOR_FAILED";
    readonly status?: number;
    constructor(message: string, options?: {
        status?: number;
        cause?: unknown;
    });
}
interface CloudflareOptions {
    /** Cloudflare API token; defaults to CLOUDFLARE_API_TOKEN. */
    apiToken?: string;
    /** Cloudflare account ID; defaults to CLOUDFLARE_ACCOUNT_ID. */
    accountId?: string;
    /** Injectable transport, intended for tests. */
    fetchFn?: typeof fetch;
}
declare function validateDomain(domain: string): string;
declare class CloudflareRegistrar {
    private readonly apiToken?;
    private readonly accountId?;
    private readonly fetchFn;
    constructor(options?: CloudflareOptions);
    private credentials;
    private request;
    /** Check availability through Cloudflare Registrar. */
    check(domain: string): Promise<DomainCheck>;
    /** Purchase an available domain through Cloudflare Registrar. */
    buy(domain: string): Promise<DomainPurchase>;
}
/** Live-only availability check. Use `runDomain` for the safe default workflow. */
declare function checkDomain(domain: string, options?: CloudflareOptions): Promise<DomainCheck>;
/** Live-only purchase. This deliberately never performs an availability check. */
declare function buyDomain(domain: string, options?: CloudflareOptions): Promise<DomainPurchase>;
/**
 * Safe end-to-end domain workflow. No network request or purchase happens unless
 * `live` is explicitly true. In live mode an unavailable domain is never bought.
 */
declare function runDomain(domain: string, options?: CloudflareOptions & {
    live?: boolean;
}): Promise<DomainCheck | DomainPurchase>;

export { type CloudflareOptions, CloudflareRegistrar, type DomainCheck, type DomainPurchase, type DomainStatus, type Vendor, VendorError, buyDomain, checkDomain, runDomain, validateDomain };
