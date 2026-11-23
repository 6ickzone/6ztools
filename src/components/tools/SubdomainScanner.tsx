import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Loader2,
  Globe,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Filter,
  RefreshCw,
  AlertTriangle,
  Database,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ─── Constants ───────────────────────────────────────────────────────────────

import { proxyFetch } from "@/lib/proxyFetch";

type SourceId = "crtsh" | "hackertarget" | "certspotter";

interface SourceConfig {
  id: SourceId;
  label: string;
  url: (domain: string) => string;
  parser: (raw: string) => string[];
  /** Per-source fetch budget — crt.sh is routinely slower than the default. */
  timeoutMs?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Reject HTML error pages, rate-limit blocks, empty content */
function isInvalidResponse(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (!t) return true;
  if (t.startsWith("<!doctype") || t.startsWith("<html")) return true;
  if (t.includes("<html") && t.includes("</html>")) return true;
  // Valid JSON is structured data — keyword heuristics must not reject it.
  // (Certificate serial numbers etc. routinely contain substrings like "429",
  // which made crt.sh responses get discarded as rate-limits.)
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed) && parsed !== null && typeof parsed === "object") {
        const err = (parsed as { error?: unknown }).error;
        return Boolean(err);
      }
      return false;
    } catch {
      return true;
    }
  }
  if (t.includes("rate limit") || t.includes("too many requests")) return true;
  if (t.includes("forbidden") || t.includes("access denied")) return true;
  if ((t.includes("error") || t.includes("exceed")) && t.length < 200) return true;
  if (t.includes("no dns") || t.includes("no records")) return true;
  return false;
}

/** Validate that a string looks like a real subdomain */
function isValidSubdomain(s: string, rootDomain: string): boolean {
  if (!s || s.length < 3 || s.length > 253) return false;
  if (s.includes(" ")) return false;
  if (s.includes("*.")) return false;
  // Must end with the root domain
  if (!s.endsWith(`.${rootDomain}`) && s !== rootDomain) return false;
  // Only allow valid hostname characters
  if (!/^[a-z0-9]([a-z0-9\-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]*[a-z0-9])?)*$/.test(s)) return false;
  return true;
}

/** Clean and deduplicate a raw list of subdomains */
function cleanSubdomains(raw: string[], rootDomain: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of raw) {
    const cleaned = s.trim().toLowerCase().replace(/^\*\./, "").replace(/:.*$/, "");
    if (!seen.has(cleaned) && isValidSubdomain(cleaned, rootDomain)) {
      seen.add(cleaned);
      out.push(cleaned);
    }
  }
  return out.sort();
}

/** Fetch through CORS proxy with timeout and HTML rejection */
async function safeFetch(url: string, timeoutMs = 15000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await proxyFetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (isInvalidResponse(text)) throw new Error("Invalid HTML/error response");
    return text;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Source Definitions ──────────────────────────────────────────────────────

const SOURCES: SourceConfig[] = [
  {
    id: "crtsh",
    label: "crt.sh",
    url: (d) => `https://crt.sh/?q=%25.${d}&output=json`,
    // Certificate Transparency lookups can take 15–30s on busy domains.
    timeoutMs: 25000,
    parser: (raw) => {
      try {
        const arr = JSON.parse(raw) as Array<{ name_value?: string }>;
        return arr.map((e) => e.name_value ?? "").filter(Boolean).flatMap((v) => v.split("\n"));
      } catch {
        return [];
      }
    },
  },
  {
    id: "hackertarget",
    label: "HackerTarget",
    // `subdomainlookup` was retired by HackerTarget (404) — `hostsearch`
    // still answers with `hostname,ip` lines for the free tier.
    url: (d) => `https://api.hackertarget.com/hostsearch/?q=${d}`,
    parser: (raw) =>
      raw
        .split("\n")
        .map((l) => l.trim().split(",")[0].trim())
        .filter((h) => h && !h.toLowerCase().startsWith("error") && !h.includes("No DNS") && !isInvalidResponse(h)),
  },
  {
    id: "certspotter",
    label: "CertSpotter",
    // SSLMate CT API — works unauthenticated, replaces BufferOver (now 403/key).
    url: (d) => `https://api.certspotter.com/v1/issuances?domain=${d}&include_subdomains=true&expand=dns_names`,
    parser: (raw) => {
      try {
        const arr = JSON.parse(raw) as Array<{ dns_names?: string[] }>;
        return arr.flatMap((e) => (Array.isArray(e.dns_names) ? e.dns_names : []));
      } catch {
        return [];
      }
    },
  },
];

// ─── Source Status Tracking ──────────────────────────────────────────────────

interface SourceStatus {
  state: "idle" | "loading" | "done" | "error";
  count: number;
  error?: string;
}

// ─── UI Components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-xs text-muted-foreground hover:text-cyan transition-colors"
    >
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

function SourceChip({
  config,
  status,
}: {
  config: SourceConfig;
  status: SourceStatus;
}) {
  const color =
    status.state === "done" && status.count > 0
      ? "text-emerald border-emerald/30 bg-emerald/5"
      : status.state === "error"
        ? "text-red border-red/30 bg-red/5"
        : status.state === "loading"
          ? "text-cyan border-cyan/30 bg-cyan/5"
          : "text-muted-foreground border-border/50";

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${color}`}>
      {status.state === "loading" ? (
        <Loader2 className="size-3 animate-spin" />
      ) : status.state === "done" && status.count > 0 ? (
        <CheckCircle className="size-3" />
      ) : status.state === "error" ? (
        <XCircle className="size-3" />
      ) : (
        <Database className="size-3" />
      )}
      <span className="font-medium">{config.label}</span>
      {status.state === "done" && (
        <Badge variant="outline" className="text-[9px] ml-1">
          {status.count}
        </Badge>
      )}
      {status.state === "error" && (
        <span className="text-[10px] text-red truncate max-w-[120px]" title={status.error}>
          failed
        </span>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface SubdomainResult {
  hostname: string;
  sources: SourceId[];
  isLive: boolean | null;
}

interface SubdomainScannerProps {
  onBack: () => void;
}

export function SubdomainScanner({ onBack }: SubdomainScannerProps) {
  const [domain, setDomain] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<SubdomainResult[]>([]);
  const [sourceStatuses, setSourceStatuses] = useState<Record<SourceId, SourceStatus>>({
    crtsh: { state: "idle", count: 0 },
    hackertarget: { state: "idle", count: 0 },
    certspotter: { state: "idle", count: 0 },
  });
  const [scanTime, setScanTime] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "live" | "dead">("all");
  const [checkingLiveness, setCheckingLiveness] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const abortRef = useRef(false);

  const cleanDomain = (input: string) => {
    let d = input.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return d;
  };

  const updateStatus = (id: SourceId, status: SourceStatus) => {
    setSourceStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const handleScan = useCallback(async () => {
    if (!domain.trim()) return;
    const target = cleanDomain(domain);
    setDomain(target);
    setScanning(true);
    setResults([]);
    setErrors([]);
    setScanTime(null);
    abortRef.current = false;

    // Reset all source statuses
    const initial: Record<SourceId, SourceStatus> = {
      crtsh: { state: "idle", count: 0 },
      hackertarget: { state: "idle", count: 0 },
      certspotter: { state: "idle", count: 0 },
    };
    setSourceStatuses(initial);

    const startTime = Date.now();
    const merged = new Map<string, SubdomainResult>();

    // Run all sources concurrently
    const fetchSource = async (config: SourceConfig) => {
      updateStatus(config.id, { state: "loading", count: 0 });
      try {
        const url = config.url(target);
        const raw = await safeFetch(url, config.timeoutMs);
        const parsed = config.parser(raw);
        const cleaned = cleanSubdomains(parsed, target);

        for (const sub of cleaned) {
          const existing = merged.get(sub);
          if (existing) {
            existing.sources.push(config.id);
          } else {
            merged.set(sub, { hostname: sub, sources: [config.id], isLive: null });
          }
        }

        updateStatus(config.id, { state: "done", count: cleaned.length });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        updateStatus(config.id, { state: "error", count: 0, error: msg });
        setErrors((prev) => [...prev, `${config.label}: ${msg}`]);
      }
    };

    await Promise.all(SOURCES.map(fetchSource));

    const sorted = Array.from(merged.values()).sort((a, b) =>
      a.hostname.localeCompare(b.hostname)
    );

    setResults(sorted);
    setScanTime(Date.now() - startTime);
    setScanning(false);
  }, [domain]);

  // ─── Live/Dead Checker ───────────────────────────────────────────────────

  const checkLiveSubdomains = useCallback(async () => {
    if (results.length === 0) return;
    setCheckingLiveness(true);

    const BATCH_SIZE = 10;
    const updated = [...results];

    for (let i = 0; i < updated.length; i += BATCH_SIZE) {
      if (abortRef.current) break;
      const batch = updated.slice(i, i + BATCH_SIZE);
      const checks = await Promise.all(
        batch.map(async (r) => {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 6000);
            const res = await proxyFetch(`https://${r.hostname}`, { signal: controller.signal });
            clearTimeout(timer);
            return { ...r, isLive: res.ok };
          } catch {
            // Try HTTP as fallback
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 6000);
              const res = await proxyFetch(`http://${r.hostname}`, { signal: controller.signal });
              clearTimeout(timer);
              return { ...r, isLive: res.ok };
            } catch {
              return { ...r, isLive: false };
            }
          }
        })
      );
      for (let j = 0; j < checks.length; j++) {
        updated[i + j] = checks[j];
      }
      setResults([...updated]);
    }

    setCheckingLiveness(false);
  }, [results]);

  // ─── Computed Stats ──────────────────────────────────────────────────────

  const liveCount = results.filter((r) => r.isLive === true).length;
  const deadCount = results.filter((r) => r.isLive === false).length;
  const uncheckedCount = results.filter((r) => r.isLive === null).length;
  const totalSources = Object.values(sourceStatuses).filter((s) => s.state === "done" && s.count > 0).length;

  const filteredResults = results.filter((r) => {
    if (filter === "live") return r.isLive === true;
    if (filter === "dead") return r.isLive === false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10">
            <Search className="size-8 text-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Subdomain Scanner
            </h1>
            <p className="text-muted-foreground text-base">
              Multi-source subdomain enumeration using crt.sh, HackerTarget,
              and CertSpotter. Merge and deduplicate results, then verify live
              status.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <label className="text-sm font-medium mb-3 block">Target Domain</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()}
                className="pl-10"
                disabled={scanning}
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={scanning || !domain.trim()}
              className="gap-2 bg-purple hover:bg-purple/90 text-white font-semibold"
            >
              {scanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {scanning ? "Scanning..." : "Enumerate"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Queries 3 intelligence sources in parallel — crt.sh (certificate
            transparency), HackerTarget (host search), and CertSpotter (CT
            certificates).
          </p>
        </div>

        {/* Source Chips — show during/after scan */}
        {(scanning || results.length > 0 || errors.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {SOURCES.map((src) => (
              <SourceChip
                key={src.id}
                config={src}
                status={sourceStatuses[src.id]}
              />
            ))}
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="glass-card rounded-xl p-4 border border-amber/20 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber mb-1">
                  Some sources failed
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {errors.map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>
                Domain: <code className="text-purple">{domain}</code>
              </span>
              <span>
                Found: <strong className="text-foreground">{results.length}</strong>{" "}
                subdomains from {totalSources} source{totalSources !== 1 ? "s" : ""}
              </span>
              {scanTime && <span>Scan time: {(scanTime / 1000).toFixed(1)}s</span>}
              {liveCount > 0 && (
                <span className="text-emerald">
                  <Wifi className="size-3 inline mr-1" />
                  {liveCount} live
                </span>
              )}
              {deadCount > 0 && (
                <span className="text-red">
                  <WifiOff className="size-3 inline mr-1" />
                  {deadCount} dead
                </span>
              )}
              {uncheckedCount > 0 && (
                <span>{uncheckedCount} unchecked</span>
              )}
            </div>

            {/* Filters & Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="size-3 text-muted-foreground" />
                {(["all", "live", "dead"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filter === f
                        ? f === "live"
                          ? "bg-emerald/10 text-emerald border border-emerald/30"
                          : f === "dead"
                            ? "bg-red/10 text-red border border-red/30"
                            : "bg-purple/10 text-purple border border-purple/30"
                        : "text-muted-foreground hover:text-foreground border border-border/50"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkLiveSubdomains}
                  disabled={checkingLiveness}
                  className="gap-2 text-xs"
                >
                  {checkingLiveness ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Wifi className="size-3" />
                  )}
                  {checkingLiveness ? "Checking..." : "Check Live"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScan}
                  disabled={scanning}
                  className="gap-2 text-xs"
                >
                  <RefreshCw className="size-3" />
                  Rescan
                </Button>
              </div>
            </div>

            {/* Results Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Discovered Subdomains</h3>
                <Badge variant="outline" className="text-[10px]">
                  {filteredResults.length} / {results.length}
                </Badge>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border/50">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        #
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        Subdomain
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        Sources
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredResults.map((r, i) => (
                        <motion.tr
                          key={r.hostname}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i * 0.02, 0.5) }}
                          className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-5 py-2.5 text-muted-foreground text-xs">
                            {i + 1}
                          </td>
                          <td className="px-5 py-2.5">
                            <code className="text-purple font-mono text-xs">
                              {r.hostname}
                            </code>
                          </td>
                          <td className="px-5 py-2.5">
                            <div className="flex gap-1 flex-wrap">
                              {r.sources.map((sid) => {
                                const cfg = SOURCES.find((s) => s.id === sid);
                                return (
                                  <Badge
                                    key={sid}
                                    variant="outline"
                                    className="text-[9px] text-muted-foreground"
                                  >
                                    {cfg?.label}
                                  </Badge>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-2.5">
                            {r.isLive === true ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-emerald/40 text-emerald gap-1"
                              >
                                <CheckCircle className="size-2.5" /> Live
                              </Badge>
                            ) : r.isLive === false ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-red/40 text-red gap-1"
                              >
                                <XCircle className="size-2.5" /> Dead
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <CopyButton text={r.hostname} />
                              <a
                                href={`https://${r.hostname}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-cyan transition-colors"
                              >
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    filteredResults.map((r) => r.hostname).join("\n")
                  );
                }}
                className="gap-2 text-xs"
              >
                <Copy className="size-3" />
                Copy All ({filteredResults.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = filteredResults.map((r) => r.hostname).join("\n");
                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `subdomains-${domain}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="gap-2 text-xs"
              >
                <ExternalLink className="size-3" />
                Export .txt
              </Button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!scanning && results.length === 0 && errors.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Database className="size-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Enter a domain and click <strong>Enumerate</strong> to search across
              3 intelligence sources.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="glass-card rounded-xl p-4 border border-amber/20 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong className="text-foreground">Data Sources:</strong>
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>
                  <strong>crt.sh</strong> — Certificate Transparency logs
                </li>
                <li>
                  <strong>HackerTarget</strong> — Passive DNS lookup
                </li>
                <li>
                  <strong>CertSpotter</strong> — SSLMate CT certificate records
                </li>
              </ul>
              <p className="mt-1">
                All responses are validated to reject HTML error pages. Results
                are deduplicated and sorted alphabetically. Live check probes
                each subdomain via HTTPS/HTTP through CORS proxy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
