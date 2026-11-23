import { httpAction } from "./_generated/server";

/**
 * Universal outbound proxy — 6ickzone dashboard.
 *
 * Every tool that needs to reach a third-party API or a scan target calls
 * `proxyFetch()` in `src/lib/proxyFetch.ts`, which hits this route. Running the
 * request server-side means:
 *
 *   - no CORS restrictions (the browser only talks to `*.convex.site`),
 *   - the upstream HTTP **status code and headers** are relayed faithfully, so
 *     scanners can tell 200 / 403 / 404 apart,
 *   - GET **and** POST/PUT bodies + custom headers work,
 *   - API keys live in Convex env vars and never reach the browser.
 *
 * Registered in `src/convex/http.ts` for every method, including OPTIONS.
 */

/* ------------------------------------------------------------------ *
 * CORS
 * ------------------------------------------------------------------ */

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);

/** The Convex runtime has 64 MiB of memory — never buffer more than this. */
const MAX_UPSTREAM_BYTES = 8 * 1024 * 1024;

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 6ickzone-proxy/1.0";

/**
 * Allow-list of headers passed back to the browser. Everything else (CSP, HSTS,
 * Set-Cookie, upstream CSP frames, etc.) stays on the server so it can never be
 * applied to our own origin.
 */
const RELAY_HEADERS = [
  "content-type",
  "content-disposition",
  "cache-control",
  "etag",
  "last-modified",
  "expires",
  "age",
  "date",
  "location",
  "www-authenticate",
  "retry-after",
  "server",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "x-ratelimit-retry-after",
  "x-rate-limit-limit",
  "x-rate-limit-remaining",
  "x-request-id",
  "x-runtime",
  "cf-ray",
];

/** Never forwarded from the caller to the target host. */
const STRIP_REQUEST_HEADERS = [
  "host",
  "content-length",
  "connection",
  "cookie",
  "origin",
  "referer",
  "accept-encoding",
  "transfer-encoding",
  "sec-fetch-mode",
  "sec-fetch-site",
  "sec-fetch-dest",
  "x-forwarded-for",
  "x-forwarded-host",
  "cf-connecting-ip",
];

/* ------------------------------------------------------------------ *
 * API key injection — keys are read from Convex env vars at runtime
 *
 *   npx convex env set SECURITYTRAILS_API_KEY "..."
 *
 * A rule only fires when the matching env var is set, and it never overrides a
 * credential the caller already supplied (so users can still paste their own).
 * ------------------------------------------------------------------ */

interface KeyRule {
  /** Matches the hostname itself or any subdomain of it. */
  host: string;
  env: string;
  header?: string;
  query?: string;
  prefix?: string;
}

const API_KEY_RULES: KeyRule[] = [
  { host: "securitytrails.com", env: "SECURITYTRAILS_API_KEY", header: "APIKEY" },
  { host: "shodan.io", env: "SHODAN_API_KEY", query: "key" },
  { host: "api.github.com", env: "GITHUB_TOKEN", header: "Authorization", prefix: "Bearer " },
  { host: "virustotal.com", env: "VIRUSTOTAL_API_KEY", header: "x-apikey" },
  { host: "hunter.io", env: "HUNTER_API_KEY", query: "api_key" },
  { host: "hackertarget.com", env: "HACKERTARGET_API_KEY", query: "apikey" },
  // ip-api.com: the free tier is HTTP-only and rate-limited; a Pro key unlocks
  // HTTPS, injected here so it never reaches the browser bundle.
  { host: "ip-api.com", env: "IP_API_KEY", query: "key" },
  // ipstack (apilayer): free plan is HTTP-only, key injected server-side.
  { host: "ipstack.com", env: "IPSTACK_ACCESS_KEY", query: "access_key" },
];

function hostMatches(hostname: string, rule: string): boolean {
  return hostname === rule || hostname.endsWith(`.${rule}`);
}

function applyApiKeys(url: URL, headers: Headers): void {
  const hostname = url.hostname.toLowerCase();
  for (const rule of API_KEY_RULES) {
    if (!hostMatches(hostname, rule.host)) continue;
    const secret = process.env[rule.env];
    if (!secret) continue;
    if (rule.header && !headers.has(rule.header)) {
      headers.set(rule.header, `${rule.prefix ?? ""}${secret}`);
    }
    if (rule.query && !url.searchParams.has(rule.query)) {
      url.searchParams.set(rule.query, secret);
    }
  }
}

/* ------------------------------------------------------------------ *
 * SSRF guard
 *
 * The endpoint is reachable by anyone, so it must not become a door into
 * loopback / private / cloud-metadata addresses. Only string-level checks are
 * possible here (the default runtime has no DNS resolver), so decimal, hex and
 * legacy-octal IPv4 spellings are collapsed before checking and anything that
 * cannot be proven public is refused.
 * ------------------------------------------------------------------ */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "instance-data",
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".localdomain", ".home.arpa"];

/** Returns a reason string when the host must be refused, otherwise null. */
function blockedReason(rawHostname: string): string | null {
  const host = rawHostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
  if (!host) return "empty-host";
  if (BLOCKED_HOSTNAMES.has(host)) return "loopback-or-metadata";
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return "internal-name";
  if (host.includes(":")) return isPrivateIPv6(host) ? "private-ipv6" : null;
  if (/^(?:\d+|0x[0-9a-f]+|\d{1,3}(?:\.\d{1,3}){3})$/i.test(host)) {
    const ip = parseIPv4ish(host);
    if (ip === null) return "unparseable-ip";
    return isPrivateIPv4(ip) ? "private-ipv4" : null;
  }
  return null;
}

/** Parses dotted, decimal-integer and 0x-hex IPv4 spellings to a uint32. */
function parseIPv4ish(host: string): number | null {
  if (/^\d+$/.test(host)) {
    const n = Number(host);
    return n <= 0xffffffff ? n : null;
  }
  if (/^0x[0-9a-f]+$/i.test(host)) {
    const n = Number(host);
    return n <= 0xffffffff ? n : null;
  }
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  let out = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    // Leading zeros are legacy octal notation — refuse rather than guess.
    if (part.length > 1 && part.startsWith("0")) return null;
    const value = Number(part);
    if (value > 255) return null;
    out = ((out << 8) | value) >>> 0;
  }
  return out >>> 0;
}

function isPrivateIPv4(n: number): boolean {
  const a = (n >>> 24) & 0xff;
  const b = (n >>> 16) & 0xff;
  const c = (n >>> 8) & 0xff;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 255) return true; // broadcast
  return false;
}

function isPrivateIPv6(host: string): boolean {
  if (host === "::1" || host === "::") return true;
  const mapped = host.match(/^::ffff:(.+)$/i);
  if (mapped) {
    const inner = mapped[1];
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(inner)) return true;
    const ip = parseIPv4ish(inner);
    return ip === null ? true : isPrivateIPv4(ip);
  }
  const head = parseInt(host.split(":")[0] || "0", 16);
  if (Number.isNaN(head)) return true; // unreadable form → refuse
  if ((head & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((head & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
  if ((head & 0xff00) === 0xff00) return true; // multicast
  return false;
}

/* ------------------------------------------------------------------ *
 * Response helpers
 * ------------------------------------------------------------------ */

function jsonError(
  status: number,
  error: string,
  message: string,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify({ ok: false, error, message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json", ...extra },
  });
}

/* ------------------------------------------------------------------ *
 * Handler
 * ------------------------------------------------------------------ */

interface Descriptor {
  targetUrl?: unknown;
  method?: unknown;
  headers?: unknown;
  body?: unknown;
  redirect?: unknown;
}

const handler = httpAction(async (_ctx, request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const queryTarget = url.searchParams.get("targetUrl") ?? url.searchParams.get("url");

  let target = "";
  let method = request.method.toUpperCase();
  let upstreamHeaders = new Headers();
  let body: string | undefined;
  let redirect: "follow" | "manual" = "follow";
  let incomingBodyRead = false;

  if (queryTarget) {
    /* ---- query mode: GET-friendly, everything as query params ---- */
    target = queryTarget;

    const declaredMethod = url.searchParams.get("method");
    if (declaredMethod) method = declaredMethod.toUpperCase();

    const declaredHeaders = url.searchParams.get("headers");
    if (declaredHeaders) {
      try {
        const parsed = JSON.parse(declaredHeaders) as Record<string, unknown>;
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === "string") upstreamHeaders.set(key, value);
        }
      } catch {
        return jsonError(400, "invalid_headers", "`headers` must be a JSON object of strings.");
      }
    }

    const declaredBody = url.searchParams.get("body");
    if (declaredBody !== null) {
      body = declaredBody;
      incomingBodyRead = true;
    }

    if (url.searchParams.get("redirect") === "manual") redirect = "manual";

    // Pass through caller-supplied headers (content-type, authorization, …).
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (STRIP_REQUEST_HEADERS.includes(lower)) return;
      if (lower === "content-type" && method === "GET") return;
      if (!upstreamHeaders.has(key)) upstreamHeaders.set(key, value);
    });
  } else if (request.method === "POST") {
    /* ---- descriptor mode: { targetUrl, method, headers, body } ---- */
    let descriptor: Descriptor;
    try {
      descriptor = (await request.json()) as Descriptor;
    } catch {
      return jsonError(400, "invalid_json", "Expected a JSON body containing `targetUrl`.");
    }
    incomingBodyRead = true;
    if (typeof descriptor.targetUrl !== "string" || !descriptor.targetUrl.trim()) {
      return jsonError(400, "missing_target", "Provide `targetUrl` as a string.");
    }
    target = descriptor.targetUrl.trim();

    if (typeof descriptor.method === "string" && descriptor.method.trim()) {
      method = descriptor.method.toUpperCase();
    } else {
      method = "GET";
    }
    if (descriptor.headers && typeof descriptor.headers === "object" && !Array.isArray(descriptor.headers)) {
      for (const [key, value] of Object.entries(descriptor.headers as Record<string, unknown>)) {
        if (typeof value === "string") upstreamHeaders.set(key, value);
      }
    }
    if (typeof descriptor.body === "string") body = descriptor.body;
    else if (descriptor.body !== undefined && descriptor.body !== null) {
      body = JSON.stringify(descriptor.body);
      if (!upstreamHeaders.has("content-type")) {
        upstreamHeaders.set("content-type", "application/json");
      }
    }
    if (descriptor.redirect === "manual") redirect = "manual";
  } else {
    return jsonError(
      400,
      "missing_target",
      "Pass `targetUrl` in the query string, or POST a JSON body { targetUrl, method, headers, body }.",
    );
  }

  if (!ALLOWED_METHODS.has(method)) {
    return jsonError(405, "method_not_allowed", `Upstream method ${method} is not supported.`);
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return jsonError(400, "invalid_url", `"${target}" is not a valid absolute URL.`);
  }
  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return jsonError(400, "protocol_not_allowed", "Only http:// and https:// targets are allowed.");
  }

  const reason = blockedReason(targetUrl.hostname);
  if (reason) {
    return jsonError(403, "blocked", `Target refused by SSRF guard (${reason}).`);
  }

  applyApiKeys(targetUrl, upstreamHeaders);
  for (const header of STRIP_REQUEST_HEADERS) upstreamHeaders.delete(header);
  if (!upstreamHeaders.has("user-agent")) upstreamHeaders.set("user-agent", DEFAULT_UA);
  if (!upstreamHeaders.has("accept")) upstreamHeaders.set("accept", "*/*");

  const hasBody = method !== "GET" && method !== "HEAD" && body !== undefined && body !== "";
  if (!hasBody && incomingBodyRead === false && request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl.toString(), {
      method,
      headers: upstreamHeaders,
      body: hasBody ? body : undefined,
      redirect,
    });
  } catch (error) {
    return jsonError(
      502,
      "upstream_unreachable",
      error instanceof Error ? error.message : "Could not reach the target host.",
      { "x-proxy-via": "convex-http-action", "x-proxy-error": "upstream_unreachable" },
    );
  }

  const declaredLength = Number(upstream.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPSTREAM_BYTES) {
    return jsonError(413, "response_too_large", `Upstream body is ${declaredLength} bytes; the limit is ${MAX_UPSTREAM_BYTES}.`, {
      "x-proxy-via": "convex-http-action",
    });
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await upstream.arrayBuffer();
  } catch (error) {
    return jsonError(
      502,
      "upstream_read_failed",
      error instanceof Error ? error.message : "Failed reading the upstream response.",
      { "x-proxy-via": "convex-http-action", "x-proxy-error": "upstream_unreachable" },
    );
  }
  if (buffer.byteLength > MAX_UPSTREAM_BYTES) {
    return jsonError(413, "response_too_large", `Upstream body exceeds ${MAX_UPSTREAM_BYTES} bytes.`, {
      "x-proxy-via": "convex-http-action",
    });
  }

  const relayed: Record<string, string> = { ...CORS_HEADERS, "x-proxy-via": "convex-http-action" };
  for (const header of RELAY_HEADERS) {
    const value = upstream.headers.get(header);
    if (value) relayed[header] = value;
  }

  const bodyless = method === "HEAD" || upstream.status === 204 || upstream.status === 304 || upstream.status < 200;
  return new Response(bodyless ? null : buffer, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: relayed,
  });
});

export { handler as proxyHandler };
