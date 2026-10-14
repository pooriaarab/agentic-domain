// src/core.ts
var VendorError = class extends Error {
  code = "VENDOR_FAILED";
  status;
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = "VendorError";
    this.status = options.status;
  }
};
function validateDomain(domain) {
  const value = domain.trim().toLowerCase();
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) {
    throw new Error(`invalid domain "${domain}"`);
  }
  return value;
}
function numberOrUndefined(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return void 0;
}
var CloudflareRegistrar = class {
  apiToken;
  accountId;
  fetchFn;
  constructor(options = {}) {
    this.apiToken = options.apiToken ?? process.env.CLOUDFLARE_API_TOKEN;
    this.accountId = options.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
    this.fetchFn = options.fetchFn ?? fetch;
  }
  credentials() {
    if (!this.apiToken) throw new VendorError("Cloudflare API token is missing. Set CLOUDFLARE_API_TOKEN.");
    if (!this.accountId) throw new VendorError("Cloudflare account ID is missing. Set CLOUDFLARE_ACCOUNT_ID.");
    return { token: this.apiToken, accountId: this.accountId };
  }
  async request(path, init = {}) {
    const { token, accountId } = this.credentials();
    let response;
    try {
      response = await this.fetchFn(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}${path}`, {
        ...init,
        headers: { authorization: `Bearer ${token}`, ...init.headers }
      });
    } catch (error) {
      throw new VendorError(`Cloudflare request failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
    const raw = await response.text();
    let body;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      throw new VendorError(`Cloudflare returned invalid JSON (${response.status}).`, { status: response.status });
    }
    if (!response.ok || body.success === false) {
      const detail = body.errors?.map((error) => error.message).filter(Boolean).join("; ") || raw || response.statusText;
      throw new VendorError(`Cloudflare request failed (${response.status}): ${detail}`, { status: response.status });
    }
    if (!body.result) throw new VendorError("Cloudflare response did not include a result.", { status: response.status });
    return body.result;
  }
  /** Check availability through Cloudflare Registrar. */
  async check(domain) {
    const name = validateDomain(domain);
    const result = await this.request(`/registrar/domains/${encodeURIComponent(name)}`);
    const available = result.available === true;
    return { domain: name, status: available ? "available" : "unavailable", available, vendor: "cloudflare", dryRun: false, price: numberOrUndefined(result.price), currency: result.currency };
  }
  /** Purchase an available domain through Cloudflare Registrar. */
  async buy(domain) {
    const name = validateDomain(domain);
    const result = await this.request("/registrar/domains", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name })
    });
    return { domain: name, status: "available", available: true, vendor: "cloudflare", dryRun: false, purchased: true, orderId: result.id ?? result.order_id, price: numberOrUndefined(result.price), currency: result.currency };
  }
};
async function checkDomain(domain, options = {}) {
  return new CloudflareRegistrar(options).check(domain);
}
async function buyDomain(domain, options = {}) {
  return new CloudflareRegistrar(options).buy(domain);
}
async function runDomain(domain, options = {}) {
  const name = validateDomain(domain);
  if (!options.live) {
    return { domain: name, status: "unknown", available: false, vendor: "cloudflare", dryRun: true, reason: "Dry run: pass --live to check and buy through Cloudflare Registrar." };
  }
  const registrar = new CloudflareRegistrar(options);
  const checked = await registrar.check(name);
  return checked.available ? registrar.buy(name) : checked;
}

export {
  VendorError,
  validateDomain,
  CloudflareRegistrar,
  checkDomain,
  buyDomain,
  runDomain
};
