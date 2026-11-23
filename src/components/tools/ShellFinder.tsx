import { useState, useCallback, useRef } from "react";
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
  ExternalLink,
  AlertTriangle,
  Terminal,
  Pause,
  Play,
  Skull,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { proxyFetch } from "@/lib/proxyFetch";

const SHELL_PATHS = [
  // Common PHP Shells
  "/shell.php",
  "/wso.php",
  "/wso1337.php",
  "/b374k.php",
  "/c99.php",
  "/r57.php",
  "/cmd.php",
  "/c2007.php",
  "/c2008.php",
  "/u.php",
  "/backdoor.php",
  "/xor.php",
  "/webshell.php",
  "/v.php",
  "/angel.php",
  // Common hidden variants
  "/images/shell.php",
  "/uploads/shell.php",
  "/tmp/shell.php",
  "/wp-content/shell.php",
  "/wp-includes/shell.php",
  "/config/shell.php",
  "/backup/shell.php",
  // Obfuscated names
  "/sh.php",
  "/shell2.php",
  "/1.php",
  "/test.php",
  "/x.php",
  "/a.php",
  "/e.php",
  "/shell.phtml",
  "/shell.phps",
  // Other extensions
  "/shell.asp",
  "/shell.aspx",
  "/shell.jsp",
  "/cmd.aspx",
  "/cmd.jsp",
  // Common backdoors
  "/db.php",
  "/xmlrpc.php",
  "/api.php",
  "/debug.php",
  "/config.php.bak",
  "/wp-config.php.bak",
  // Admin-related shells
  "/admin/shell.php",
  "/login/shell.php",
  // Double extensions
  "/shell.php.jpg",
  "/shell.php.png",
  "/.htaccess",
];

interface ShellResult {
  path: string;
  status: "found" | "not-found" | "error" | "pending";
  statusCode?: number;
}

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
      className="text-xs text-muted-foreground hover:text-red transition-colors"
    >
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

interface ShellFinderProps {
  onBack: () => void;
}

export function ShellFinder({ onBack }: ShellFinderProps) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [results, setResults] = useState<ShellResult[]>([]);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [scanTime, setScanTime] = useState<number | null>(null);
  const abortRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  const cleanUrl = (input: string) => {
    let u = input.trim();
    if (!u.startsWith("http")) u = `https://${u}`;
    u = u.replace(/\/+$/, "");
    return u;
  };

  const scanPath = async (baseUrl: string, path: string): Promise<ShellResult> => {
    const target = `${baseUrl}${path}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await proxyFetch(target, {
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);

      if (res.ok) {
        return { path, status: "found", statusCode: res.status };
      } else if (res.status === 403) {
        // 403 = exists but restricted
        return { path, status: "found", statusCode: 403 };
      } else if (res.status === 404) {
        return { path, status: "not-found", statusCode: 404 };
      } else {
        return { path, status: "not-found", statusCode: res.status };
      }
    } catch {
      return { path, status: "error" };
    }
  };

  const handleScan = useCallback(async () => {
    if (!url.trim()) return;
    const target = cleanUrl(url);
    setUrl(target);
    setScanning(true);
    setPaused(false);
    setResults([]);
    setError(null);
    setScanProgress({ current: 0, total: SHELL_PATHS.length });
    abortRef.current = false;
    startTimeRef.current = Date.now();

    const allResults: ShellResult[] = SHELL_PATHS.map((p) => ({
      path: p,
      status: "pending" as const,
    }));
    setResults([...allResults]);

    for (let i = 0; i < SHELL_PATHS.length; i++) {
      if (abortRef.current) break;

      while (paused) {
        await new Promise((r) => setTimeout(r, 200));
        if (abortRef.current) break;
      }

      setScanProgress({ current: i + 1, total: SHELL_PATHS.length });
      const result = await scanPath(target, SHELL_PATHS[i]);
      allResults[i] = result;
      setResults([...allResults]);

      await new Promise((r) => setTimeout(r, 250));
    }

    setScanTime(Date.now() - startTimeRef.current);
    setScanning(false);
  }, [url, paused]);

  const handleStop = () => {
    abortRef.current = true;
    setScanning(false);
    setPaused(false);
  };

  const foundCount = results.filter((r) => r.status === "found").length;
  const notFoundCount = results.filter((r) => r.status === "not-found").length;

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
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-red/10">
            <Skull className="size-8 text-red" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Shell Finder
            </h1>
            <p className="text-muted-foreground text-base">
              Scans for web shells and backdoors by checking {SHELL_PATHS.length}{" "}
              common paths. Identifies accessible shells via HTTP status codes.
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
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()}
                className="pl-10"
                disabled={scanning}
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={scanning || !url.trim()}
              className="gap-2 bg-red hover:bg-red/90 text-white font-semibold"
            >
              {scanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Terminal className="size-4" />
              )}
              {scanning ? "Scanning..." : "Find Shells"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Checks {SHELL_PATHS.length} common shell/backdoor paths — PHP, ASP, JSP,
            hidden directories, and obfuscated filenames.
          </p>
        </div>

        {/* Progress Bar */}
        {scanning && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Scanning {scanProgress.current}/{scanProgress.total} paths...
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaused(!paused)}
                  className="gap-1 text-xs h-7"
                >
                  {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
                  {paused ? "Resume" : "Pause"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStop}
                  className="text-red text-xs h-7"
                >
                  Stop
                </Button>
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red rounded-full"
                animate={{
                  width: `${(scanProgress.current / scanProgress.total) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
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
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>
                Target: <code className="text-red">{url}</code>
              </span>
              {scanTime && <span>Scan time: {(scanTime / 1000).toFixed(1)}s</span>}
              {foundCount > 0 ? (
                <span className="text-red font-medium">
                  <Skull className="size-3 inline mr-1" />
                  {foundCount} shell{foundCount > 1 ? "s" : ""} found!
                </span>
              ) : !scanning ? (
                <span className="text-emerald">
                  <CheckCircle className="size-3 inline mr-1" />
                  No shells detected
                </span>
              ) : null}
            </div>

            {/* Danger Banner */}
            {foundCount > 0 && !scanning && (
              <div className="rounded-xl p-4 border border-red/40 bg-red/10">
                <div className="flex items-center gap-3">
                  <Skull className="size-5 text-red" />
                  <div>
                    <p className="text-sm font-bold text-red">
                      ⚠ {foundCount} Web Shell{foundCount > 1 ? "s" : ""} Detected
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      These paths returned accessible responses. Review immediately.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Scan Results</h3>
                <Badge variant="outline" className="text-[10px]">
                  {results.length} paths
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        Path
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        HTTP Code
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr
                        key={r.path}
                        className={`border-b border-border/30 last:border-0 transition-colors ${
                          r.status === "found"
                            ? "bg-red/5"
                            : r.status === "pending"
                              ? "opacity-50"
                              : "hover:bg-muted/30"
                        }`}
                      >
                        <td className="px-5 py-2.5">
                          <code className="text-xs font-mono">
                            {url}
                            <span className={r.status === "found" ? "text-red font-semibold" : ""}>
                              {r.path}
                            </span>
                          </code>
                        </td>
                        <td className="px-5 py-2.5">
                          {r.status === "found" ? (
                            <span className="flex items-center gap-1.5 text-red text-xs font-medium">
                              <Skull className="size-3" />
                              Found
                            </span>
                          ) : r.status === "not-found" ? (
                            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <XCircle className="size-3" />
                              Not Found
                            </span>
                          ) : r.status === "error" ? (
                            <span className="text-amber text-xs">Error</span>
                          ) : (
                            <Loader2 className="size-3 animate-spin text-muted-foreground" />
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-xs font-mono">
                          {r.statusCode ? (
                            <span
                              className={
                                r.statusCode === 200
                                  ? "text-red font-semibold"
                                  : r.statusCode === 403
                                    ? "text-amber"
                                    : "text-muted-foreground"
                              }
                            >
                              {r.statusCode}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          {r.status === "found" && (
                            <div className="flex items-center gap-3">
                              <CopyButton text={`${url}${r.path}`} />
                              <a
                                href={`${url}${r.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-red transition-colors"
                              >
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Found Summary */}
            {foundCount > 0 && (
              <div className="glass-card rounded-xl p-4 border border-red/20">
                <h4 className="text-sm font-semibold text-red mb-2 flex items-center gap-2">
                  <Skull className="size-4" />
                  {foundCount} Shell{foundCount > 1 ? "s" : ""} Detected
                </h4>
                <div className="space-y-1">
                  {results
                    .filter((r) => r.status === "found")
                    .map((r) => (
                      <div key={r.path} className="flex items-center gap-2 text-xs">
                        <code className="text-red font-mono">
                          {url}{r.path}
                        </code>
                        <Badge
                          variant="outline"
                          className="text-[9px] border-red/40"
                        >
                          {r.statusCode}
                        </Badge>
                        <CopyButton text={`${url}${r.path}`} />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Info */}
        <div className="glass-card rounded-xl p-4 border border-amber/20 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Checks{" "}
              {SHELL_PATHS.length} common web shell and backdoor paths including
              well-known shells (WSO, c99, r57, b374k), hidden directory variants,
              obfuscated filenames, and double extensions. HTTP 200 or 403 indicates
              the path likely exists.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
