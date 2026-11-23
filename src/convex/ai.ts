"use node";

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { createHash } from "node:crypto";

/**
 * 6ztools AI — one backend for the whole AI cluster.
 *
 * Powers AI Assistant, AI Code Generator, AI Shell Command Generator and
 * AI Vulnerability Analyst: same action, different system prompt (`mode`).
 * The model can call real tools (crt.sh, CMS fingerprinting, NVD, hashing)
 * so the assistant actually scans instead of only chatting.
 *
 * The Groq API key lives in Convex env (`GROQ_API_KEY`) and never reaches
 * the browser bundle.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const FALLBACK_MODEL = "openai/gpt-oss-20b";
const MAX_TOOL_ROUNDS = 4;
/** Per Groq call. */
const GROQ_TIMEOUT_MS = 45_000;
/** Whole action budget — keeps us safely under the Convex action timeout. */
const REQUEST_DEADLINE_MS = 240_000;

/** Error with the upstream HTTP status attached (undefined = network/timeout). */
class GroqCallError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GroqCallError";
    this.status = status;
  }
}

/* ─── System prompts per mode ─────────────────────────────────────────────── */

const SYSTEM_PROMPTS: Record<string, string> = {
  assistant: `You are 6ztools AI, the built-in assistant of the 6ztools ethical-hacking dashboard.
You help professional security researchers and penetration testers with recon, vulnerability analysis, payload crafting, and remediation advice.
Use the provided tools when a live lookup (subdomains, CMS detection, CVE data, hashing) makes your answer concrete; otherwise answer from knowledge.
Be direct and technical. Use short paragraphs and markdown. When code or commands are central, put them in fenced code blocks.
You only assist with targets the user is authorized to test. If asked for destructive/unauthorized activity, refuse briefly and offer the legitimate alternative.`,

  codegen: `You are the 6ztools AI Code Generator — an expert security tooling engineer.
Generate complete, runnable code (Python, PHP, Bash, JavaScript, Go) for security research tooling: scanners, fuzzers, payload generators, parsers, automation scripts.
Always return a single fenced code block with the full program, then a short usage note. No placeholder comments like "add your logic here" — implement everything.
Assume the caller has authorization to test their targets.`,

  shellcmd: `You are the 6ztools AI Shell Command Generator — a CLI expert for pentesting.
Given a goal, produce the exact shell command(s) to achieve it (nmap, sqlmap, gobuster, ffuf, hydra, nikto, wpscommon tooling, curl tricks, netcat, openssl, dig...).
Answer format: one fenced block with the command, then 1-2 lines explaining the key flags. Prefer the most efficient modern invocation. Never invent flags — if unsure, use the safest well-known form.`,

  vulnanalyst: `You are the 6ztools AI Vulnerability Analyst — a senior appsec/vuln-management analyst.
Analyze CVEs, scan results, HTTP responses, and code for vulnerabilities. Rate severity (CVSS-style), explain exploitability, impact, and give prioritized remediation.
Use the CVE search tool whenever a specific CVE ID or product vulnerability is discussed so your data is current.
Structure: Summary → Severity → Evidence → Exploit path → Remediation.`,
};

/* ─── Tools the model can call ────────────────────────────────────────────── */

interface ToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "subdomain_enum",
      description:
        "Enumerate subdomains of a domain via crt.sh certificate transparency logs. Returns up to 60 unique hostnames.",
      parameters: {
        type: "object",
        properties: { domain: { type: "string", description: "Root domain, e.g. example.com" } },
        required: ["domain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cms_detect",
      description:
        "Fetch a website homepage and fingerprint the CMS/framework (WordPress, Joomla, Drupal, Laravel, Shopify...) via meta generator and HTML markers.",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "Full URL, e.g. https://example.com" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cve_search",
      description:
        "Search the NVD CVE database by keyword. Returns top 5 CVEs with id, published date, CVSS score and description snippet.",
      parameters: {
        type: "object",
        properties: { keyword: { type: "string", description: "e.g. 'apache log4j' or 'wordpress sql injection'" } },
        required: ["keyword"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "hash_text",
      description: "Compute MD5/SHA1/SHA256/SHA512 hex digest of a text string.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string" },
          algorithm: { type: "string", enum: ["md5", "sha1", "sha256", "sha512"] },
        },
        required: ["text", "algorithm"],
      },
    },
  },
];

/* ─── Tool implementations (server-side, no CORS) ─────────────────────────── */

/** Minimal SSRF guard — tools fetch user-supplied URLs. */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "metadata.google.internal" || h === "instance-data") return true;
  if (h === "::1" || h === "::") return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) {
      return true;
    }
  }
  return false;
}

async function safeFetch(url: string, timeoutMs = 20000): Promise<Response> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https targets are allowed.");
  }
  if (isBlockedHost(parsed.hostname)) {
    throw new Error("Target refused by SSRF guard (internal address).");
  }
  return fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) 6ickzone-ai/1.0" },
  });
}

async function toolSubdomainEnum(args: { domain: string }): Promise<unknown> {
  const domain = args.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const res = await safeFetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, 30000);
  if (!res.ok) throw new Error(`crt.sh returned ${res.status}`);
  const data = (await res.json()) as Array<{ name_value?: string }>;
  const set = new Set<string>();
  for (const entry of data) {
    for (const name of (entry.name_value ?? "").split("\n")) {
      const host = name.trim().toLowerCase().replace(/^\*\./, "");
      if (host.endsWith(`.${domain}`) || host === domain) set.add(host);
    }
  }
  const hosts = [...set].sort().slice(0, 60);
  return { domain, count: hosts.length, hosts };
}

const CMS_PATTERNS: Array<[string, RegExp]> = [
  ["WordPress", /wp-content|wp-includes|wordpress/i],
  ["Joomla", /joomla|com_content/i],
  ["Drupal", /drupal|sites\/all|Drupal\.settings/i],
  ["Laravel", /laravel|csrf-token|XSRF-TOKEN/i],
  ["Shopify", /cdn\.shopify\.com|Shopify\.theme/i],
  ["Wix", /wixstatic|wix\.com/i],
  ["Squarespace", /squarespace/i],
  ["Magento", /magento|skin\/frontend|Mage\//i],
  ["Ghost", /ghost-|content\/ghost/i],
  ["Next.js", /__next|_next\/static/i],
];

async function toolCmsDetect(args: { url: string }): Promise<unknown> {
  const res = await safeFetch(args.url);
  if (!res.ok) throw new Error(`Target returned ${res.status}`);
  const html = (await res.text()).slice(0, 500_000);
  const detected: string[] = [];
  for (const [name, pattern] of CMS_PATTERNS) {
    if (pattern.test(html)) detected.push(name);
  }
  const generator = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i)?.[1];
  return { url: args.url, generator: generator ?? null, detected, bytes: html.length };
}

interface NvdResponse {
  vulnerabilities?: Array<{
    cve: {
      id: string;
      published: string;
      descriptions?: Array<{ lang: string; value: string }>;
      metrics?: {
        cvssMetricV31?: Array<{ cvssData: { baseScore: number; baseSeverity: string } }>;
        cvssMetricV30?: Array<{ cvssData: { baseScore: number; baseSeverity: string } }>;
        cvssMetricV2?: Array<{ cvssData: { baseScore: number } }>;
      };
    };
  }>;
}

async function toolCveSearch(args: { keyword: string }): Promise<unknown> {
  const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(args.keyword)}&resultsPerPage=5`;
  const res = await safeFetch(url, 30000);
  if (!res.ok) throw new Error(`NVD API returned ${res.status}`);
  const data = (await res.json()) as NvdResponse;
  const items = (data.vulnerabilities ?? []).map((v) => {
    const cve = v.cve;
    const score =
      cve.metrics?.cvssMetricV31?.[0]?.cvssData ??
      cve.metrics?.cvssMetricV30?.[0]?.cvssData ??
      (cve.metrics?.cvssMetricV2?.[0]?.cvssData ? { baseScore: cve.metrics.cvssMetricV2[0].cvssData.baseScore, baseSeverity: "" } : undefined);
    const desc = cve.descriptions?.find((d) => d.lang === "en")?.value ?? "";
    return {
      id: cve.id,
      published: (cve.published ?? "").slice(0, 10),
      score: score?.baseScore ?? null,
      severity: score && "baseSeverity" in score ? score.baseSeverity : null,
      summary: desc.slice(0, 300),
    };
  });
  return { keyword: args.keyword, count: items.length, items };
}

function toolHashText(args: { text: string; algorithm: string }): unknown {
  const allowed = ["md5", "sha1", "sha256", "sha512"];
  if (!allowed.includes(args.algorithm)) throw new Error(`Algorithm must be one of ${allowed.join(", ")}`);
  return { algorithm: args.algorithm, digest: createHash(args.algorithm).update(args.text).digest("hex") };
}

async function runTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "subdomain_enum":
      return toolSubdomainEnum(args as { domain: string });
    case "cms_detect":
      return toolCmsDetect(args as { url: string });
    case "cve_search":
      return toolCveSearch(args as { keyword: string });
    case "hash_text":
      return toolHashText(args as { text: string; algorithm: string });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/* ─── Groq chat with tool loop ────────────────────────────────────────────── */

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: unknown;
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  function: { name: string; arguments: string };
}

async function callGroq(apiKey: string, model: string, messages: ChatMessage[]): Promise<{
  content: string | null;
  toolCalls: ToolCall[];
}> {
  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: messages as unknown[], tools: TOOLS, tool_choice: "auto" }),
      signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
    });
  } catch (err) {
    // Network failure / timeout — carries no HTTP status.
    throw new GroqCallError(
      `Groq unreachable: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GroqCallError(`Groq API ${res.status}: ${body.slice(0, 200)}`, res.status);
  }
  let data: {
    choices?: Array<{ message?: { content?: string | null; tool_calls?: ToolCall[] } }>;
  };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    throw new GroqCallError("Groq returned a non-JSON response");
  }
  const message = data.choices?.[0]?.message;
  return { content: message?.content ?? null, toolCalls: message?.tool_calls ?? [] };
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Retry transient failures (network, 429, 5xx) with a short backoff. Other
 * 4xx responses are deterministic — retrying them only burns quota.
 */
async function callGroqRetry(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  attempts = 2,
): Promise<{ content: string | null; toolCalls: ToolCall[] }> {
  let last: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await callGroq(apiKey, model, messages);
    } catch (err) {
      last = err;
      const status = err instanceof GroqCallError ? err.status : undefined;
      const transient = status === undefined || status === 429 || status >= 500;
      if (!transient || i === attempts - 1) break;
      await sleep(1200 * (i + 1));
    }
  }
  throw last;
}

/**
 * Turn any backend failure into a message the chat UI can show verbatim.
 * Without this, Convex masks plain errors as a generic "Server Error".
 */
function friendlyError(err: unknown): string {
  const status = err instanceof GroqCallError ? err.status : undefined;
  const raw = err instanceof Error ? err.message : String(err);
  if (status === 401 || status === 403) {
    return "The AI provider rejected the backend key (GROQ_API_KEY invalid or revoked). Re-set it with: convex env set GROQ_API_KEY <key>";
  }
  if (status === 404) {
    return "The configured AI model is not available on this key (Groq: model_not_found).";
  }
  if (status === 429) {
    return "Groq rate limit hit (429) — the free tier allows 30 requests/minute and 1,000/day. Wait about a minute and try again.";
  }
  if (status !== undefined) {
    return `Groq API error ${status}: ${raw.slice(0, 180)}`;
  }
  if (raw.startsWith("Groq unreachable:") || raw.toLowerCase().includes("timeout") || raw.toLowerCase().includes("abort")) {
    return "Could not reach the AI provider (network timeout). Try again in a moment.";
  }
  return `AI backend error: ${raw.slice(0, 180)}`;
}

/* ─── Action ──────────────────────────────────────────────────────────────── */

export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
    mode: v.optional(
      v.union(
        v.literal("assistant"),
        v.literal("codegen"),
        v.literal("shellcmd"),
        v.literal("vulnanalyst"),
      ),
    ),
  },
  handler: async (_ctx, args): Promise<{
    reply: string;
    toolsUsed: Array<{ name: string; ok: boolean }>;
    model: string;
  }> => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new ConvexError({
        message: "GROQ_API_KEY is not configured on the backend. Set it in the Convex env.",
      });
    }

    const mode = args.mode ?? "assistant";
    const initial: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.assistant },
      ...args.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const started = Date.now();

    /** Full tool-calling loop for one model. Fresh message copy per attempt. */
    const runToolLoop = async (
      model: string,
    ): Promise<{ reply: string; toolsUsed: Array<{ name: string; ok: boolean }>; model: string }> => {
      const messages: ChatMessage[] = initial.map((m) => ({ ...m }));
      const toolsUsed: Array<{ name: string; ok: boolean }> = [];

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        if (Date.now() - started > REQUEST_DEADLINE_MS) {
          return {
            reply: "This request took too long — narrow it down (fewer targets or rounds) and try again.",
            toolsUsed,
            model,
          };
        }
        const { content, toolCalls } = await callGroqRetry(apiKey, model, messages);

        if (toolCalls.length === 0) {
          return {
            reply: content?.trim() || "(empty response — try again)",
            toolsUsed,
            model,
          };
        }

        messages.push({ role: "assistant", content: content ?? "", tool_calls: toolCalls as unknown });

        for (const call of toolCalls) {
          let result: unknown;
          let ok = true;
          try {
            const parsed = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
            result = await runTool(call.function.name, parsed);
          } catch (err) {
            ok = false;
            result = { error: err instanceof Error ? err.message : String(err) };
          }
          toolsUsed.push({ name: call.function.name, ok });
          messages.push({
            role: "tool",
            content: JSON.stringify(result),
            tool_call_id: call.id,
          });
        }
      }

      return {
        reply: "Tool usage limit reached — narrow the request and try again.",
        toolsUsed,
        model,
      };
    };

    // Primary model first, then the fallback. ConvexError carries a
    // human-readable message all the way to the chat UI.
    let lastError: unknown = null;
    for (const model of [DEFAULT_MODEL, FALLBACK_MODEL]) {
      if (Date.now() - started > REQUEST_DEADLINE_MS) break;
      try {
        return await runToolLoop(model);
      } catch (err) {
        lastError = err;
        const status = err instanceof GroqCallError ? err.status : undefined;
        // The fallback shares the same key — auth failures fail identically.
        if (status === 401 || status === 403) break;
      }
    }

    throw new ConvexError({
      message: friendlyError(lastError ?? new Error("AI backend unavailable")),
    });
  },
});
