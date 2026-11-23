/**
 * proxyFetch — the single front door for every outbound request in the app.
 *
 * Wraps the Convex HTTP action at `/api/proxy` (see `src/convex/proxy.ts`) so
 * tools never have to think about CORS, status codes, API keys or relays:
 *
 *   const res = await proxyFetch("https://api.example.com/data");
 *   const data = await res.json();   // real upstream status + body
 *
 * Behaviour:
 *   - GET/HEAD  → query mode (`?targetUrl=…`), keeps short payloads off the URL
 *   - POST/PUT… → JSON descriptor mode, so long bodies and custom headers survive
 *   - if the backend itself is unavailable (or reports an unreachable target),
 *     GET/HEAD requests fall back to a public relay before giving up
 *   - honors an external AbortSignal (scanner stop buttons) plus its own timeout
 */

const CONVEX_URL = (import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "";
const SITE_URL = CONVEX_URL.replace(/\.convex\.cloud\/?$/, ".convex.site");

/** HTTP actions are served from `*.convex.site`, not `*.convex.cloud`. */
export const PROXY_ENDPOINT = SITE_URL ? `${SITE_URL}/api/proxy` : "/api/proxy";

/** Set by the backend on every response it produces. */
const VIA_HEADER = "x-proxy-via";
/** Set when the backend could not reach the target at all. */
const ERROR_HEADER = "x-proxy-error";

const DEFAULT_TIMEOUT_MS = 30_000;

/** Tried only when the backend is down or the target is unreachable (GET/HEAD). */
const PUBLIC_FALLBACKS: Array<(target: string) => string> = [
  (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
  (target) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
];

export interface ProxyFetchOptions {
  /** Defaults to GET. */
  method?: string;
  headers?: Record<string, string> | Headers | Array<[string, string]>;
  /** Body for POST/PUT/PATCH/DELETE. Streams and FormData are not supported. */
  body?: BodyInit | null;
  /** Caller cancellation — scanner stop buttons, component unmount. */
  signal?: AbortSignal;
  /** Milliseconds before the request is aborted. Defaults to 30000. */
  timeoutMs?: number;
  redirect?: "follow" | "manual" | "error";
  cache?: RequestCache;
}

function headersToRecord(
  headers: ProxyFetchOptions["headers"],
): Record<string, string> | undefined {
  if (!headers) return undefined;
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers };
}

async function bodyToString(body: ProxyFetchOptions["body"]): Promise<string | undefined> {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "string") return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof Blob) return body.text();
  if (body instanceof ArrayBuffer) return new TextDecoder().decode(body);
  if (ArrayBuffer.isView(body)) return new TextDecoder().decode(body);
  return String(body);
}

interface BackendCall extends ProxyFetchOptions {
  method: string;
  signal: AbortSignal;
}

async function callBackend(target: string, options: BackendCall): Promise<Response> {
  const record = headersToRecord(options.headers);

  if (options.method === "GET" || options.method === "HEAD") {
    const query = new URLSearchParams({ targetUrl: target, method: options.method });
    if (record) query.set("headers", JSON.stringify(record));
    if (options.redirect === "manual") query.set("redirect", "manual");
    return fetch(`${PROXY_ENDPOINT}?${query.toString()}`, {
      // Convex's router has no HEAD route — upstream HEAD travels as a GET that
      // carries `method=HEAD`.
      method: options.method === "HEAD" ? "GET" : options.method,
      signal: options.signal,
      cache: options.cache,
    });
  }

  const descriptor = {
    targetUrl: target,
    method: options.method,
    headers: record ?? {},
    body: await bodyToString(options.body),
    redirect: options.redirect === "manual" ? ("manual" as const) : undefined,
  };

  return fetch(PROXY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(descriptor),
    signal: options.signal,
    cache: options.cache,
  });
}

/**
 * Fetch an external URL through the 6ickzone backend proxy.
 * Returns a standard `Response` carrying the upstream status code.
 */
export async function proxyFetch(
  target: string,
  options: ProxyFetchOptions = {},
): Promise<Response> {
  const method = (options.method ?? "GET").toUpperCase();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const external = options.signal;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const relayAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", relayAbort, { once: true });
  }
  const cleanup = () => {
    clearTimeout(timer);
    external?.removeEventListener("abort", relayAbort);
  };

  try {
    let response: Response | null = null;
    let backendUnavailable = false;

    try {
      response = await callBackend(target, { ...options, method, signal: controller.signal });
      backendUnavailable = !response.headers.has(VIA_HEADER) || response.headers.has(ERROR_HEADER);
    } catch (error) {
      if (external?.aborted) throw error;
      backendUnavailable = true;
    }

    // A response produced by our own backend is authoritative: relay the target's
    // real status (404, 403, 500 …) to the tool untouched.
    if (response && !backendUnavailable) return response;

    if (method === "GET" || method === "HEAD") {
      for (const build of PUBLIC_FALLBACKS) {
        if (external?.aborted) break;
        try {
          const res = await fetch(build(target), {
            signal: controller.signal,
            redirect: options.redirect ?? "follow",
            cache: options.cache,
          });
          if (res.ok) return res;
        } catch {
          /* try the next relay */
        }
      }
    }

    if (external?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    // Keep the backend's own error payload so tools can surface the message.
    if (response) return response;

    return new Response(
      JSON.stringify({
        ok: false,
        error: "proxy_unreachable",
        message: "Backend proxy is unreachable and no fallback relay responded.",
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "x-proxy-error": "proxy_unreachable",
        },
      },
    );
  } finally {
    cleanup();
  }
}
