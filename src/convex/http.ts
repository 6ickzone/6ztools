import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { proxyHandler } from "./proxy";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Universal outbound proxy at `/api/proxy` — served from
 * `https://<deployment>.convex.site/api/proxy`. The frontend helper in
 * `src/lib/proxyFetch.ts` wraps it. Registered for every verb Convex accepts so
 * GET/POST, custom methods and CORS preflight all resolve on the same path.
 * (Convex's router does not accept HEAD; upstream HEAD is requested through the
 * `method=HEAD` query param on a GET route instead.)
 */
const PROXY_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

for (const method of PROXY_METHODS) {
  http.route({ path: "/api/proxy", method, handler: proxyHandler });
}

export default http;
