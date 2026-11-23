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
  FolderTree,
  Pause,
  Play,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { proxyFetch } from "@/lib/proxyFetch";

const COMMON_PATHS = [
  // Directories
  "/admin/", "/login/", "/dashboard/", "/panel/", "/cp/",
  "/cpanel/", "/webmail/", "/mail/", "/phpmyadmin/", "/pma/",
  "/manager/", "/console/", "/debug/", "/test/", "/dev/",
  "/staging/", "/beta/", "/api/", "/v1/", "/v2/",
  "/graphql/", "/swagger/", "/docs/", "/api-docs/",
  // Common files
  "/robots.txt", "/sitemap.xml", "/.htaccess", "/.htpasswd",
  "/.env", "/config.php", "/config.inc.php", "/config.json",
  "/wp-config.php", "/wp-config.php.bak", "/wp-config.php.old",
  "/web.config", "/server-status", "/server-info",
  "/phpinfo.php", "/info.php", "/test.php", "/readme.html",
  "/readme.txt", "/LICENSE", "/CHANGELOG", "/INSTALL",
  // WordPress
  "/wp-admin/", "/wp-login.php", "/wp-content/", "/wp-includes/",
  "/wp-json/", "/xmlrpc.php", "/wp-cron.php",
  "/wp-content/debug.log", "/wp-content/uploads/",
  // Git/Version control
  "/.git/config", "/.git/HEAD", "/.gitignore",
  "/.svn/entries", "/.svn/wc.db",
  "/.DS_Store", "/.DS_Store?A",
  // Backup patterns
  "/backup/", "/backups/", "/bak/", "/old/", "/tmp/",
  "/temp/", "/dump.sql", "/db.sql", "/database.sql",
  "/backup.zip", "/site.zip", "/www.zip", "/html.zip",
  // Common frameworks
  "/.well-known/security.txt", "/favicon.ico",
  "/crossdomain.xml", "/clientaccesspolicy.xml",
  "/elmah.axd", "/trace.axd", "/web.config.bak",
  // Config files
  "/config/database.yml", "/config.yml", "/config.yaml",
  "/.env.local", "/.env.production", "/.env.backup",
  "/application.properties", "/application.yml",
  // Misc sensitive
  "/license.txt", "/changelog.txt", "/version.txt",
  "/status", "/health", "/healthcheck", "/ping",
];

interface DirResult {
  path: string;
  status: "found" | "forbidden" | "not-found" | "error" | "pending";
  statusCode?: number;
  size?: string;
}

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

interface DirectoryBruteForcerProps {
  onBack: () => void;
}

export function DirectoryBruteForcer({ onBack }: DirectoryBruteForcerProps) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [results, setResults] = useState<DirResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [scanTime, setScanTime] = useState<number | null>(null);
  const abortRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  const cleanUrl = (input: string) => {
    let u = input.trim();
    if (!u.startsWith("http")) u = `https://${u}`;
    return u.replace(/\/+$/, "");
  };

  const scanPath = async (baseUrl: string, path: string): Promise<DirResult> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await proxyFetch(`${baseUrl}${path}`, { signal: controller.signal });
      clearTimeout(timer);
      const text = await res.text();
      const sizeKB = (text.length / 1024).toFixed(1);
      if (res.ok) return { path, status: "found", statusCode: res.status, size: `${sizeKB} KB` };
      if (res.status === 403) return { path, status: "forbidden", statusCode: 403, size: `${sizeKB} KB` };
      return { path, status: "not-found", statusCode: res.status };
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
    setProgress({ current: 0, total: COMMON_PATHS.length });
    abortRef.current = false;
    startTimeRef.current = Date.now();

    const allResults: DirResult[] = COMMON_PATHS.map((p) => ({ path: p, status: "pending" }));
    setResults([...allResults]);

    for (let i = 0; i < COMMON_PATHS.length; i++) {
      if (abortRef.current) break;
      while (paused) {
        await new Promise((r) => setTimeout(r, 200));
        if (abortRef.current) break;
      }
      setProgress({ current: i + 1, total: COMMON_PATHS.length });
      allResults[i] = await scanPath(target, COMMON_PATHS[i]);
      setResults([...allResults]);
      await new Promise((r) => setTimeout(r, 200));
    }

    setScanTime(Date.now() - startTimeRef.current);
    setScanning(false);
  }, [url, paused]);

  const handleStop = () => { abortRef.current = true; setScanning(false); setPaused(false); };

  const foundCount = results.filter((r) => r.status === "found").length;
  const forbiddenCount = results.filter((r) => r.status === "forbidden").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-emerald/10">
            <FolderTree className="size-8 text-emerald" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Directory Brute Forcer</h1>
            <p className="text-muted-foreground text-base">Discovers hidden directories and files by checking {COMMON_PATHS.length} common paths for HTTP 200/403 responses.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <label className="text-sm font-medium mb-3 block">Target URL</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()} className="pl-10" disabled={scanning} />
            </div>
            <Button onClick={handleScan} disabled={scanning || !url.trim()} className="gap-2 bg-emerald hover:bg-emerald/90 text-black font-semibold">
              {scanning ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {scanning ? "Scanning..." : "Brute Force"}
            </Button>
          </div>
        </div>

        {scanning && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Testing {progress.current}/{progress.total} paths...</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPaused(!paused)} className="gap-1 text-xs h-7">
                  {paused ? <><Play className="size-3" />Resume</> : <><Pause className="size-3" />Pause</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleStop} className="text-red text-xs h-7">Stop</Button>
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald rounded-full" animate={{ width: `${(progress.current / progress.total) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-xl p-4 border border-red/20 mb-6">
            <div className="flex items-start gap-3"><XCircle className="size-4 text-red shrink-0 mt-0.5" /><p className="text-sm text-muted-foreground">{error}</p></div>
          </div>
        )}

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Target: <code className="text-emerald">{url}</code></span>
              {scanTime && <span>Time: {(scanTime / 1000).toFixed(1)}s</span>}
              {foundCount > 0 && <span className="text-emerald"><CheckCircle className="size-3 inline mr-1" />{foundCount} found</span>}
              {forbiddenCount > 0 && <span className="text-amber"><XCircle className="size-3 inline mr-1" />{forbiddenCount} forbidden</span>}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border/50">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Path</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">HTTP</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Size</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.filter((r) => r.status !== "pending" && r.status !== "not-found").map((r, i) => (
                      <tr key={r.path} className={`border-b border-border/30 last:border-0 transition-colors ${
                        r.status === "found" ? "bg-emerald/5" : r.status === "forbidden" ? "bg-amber/5" : "hover:bg-muted/30"
                      }`}>
                        <td className="px-5 py-2.5"><code className="text-xs font-mono">{url}{r.path}</code></td>
                        <td className="px-5 py-2.5">
                          {r.status === "found" ? <span className="flex items-center gap-1.5 text-emerald text-xs font-medium"><CheckCircle className="size-3" />Found</span>
                            : r.status === "forbidden" ? <span className="text-amber text-xs font-medium">403 Forbidden</span>
                            : r.status === "error" ? <span className="text-red text-xs">Error</span>
                            : null}
                        </td>
                        <td className="px-5 py-2.5 text-xs font-mono">{r.statusCode ?? "—"}</td>
                        <td className="px-5 py-2.5 text-xs text-muted-foreground">{r.size ?? "—"}</td>
                        <td className="px-5 py-2.5">
                          {(r.status === "found" || r.status === "forbidden") && (
                            <div className="flex items-center gap-3">
                              <CopyButton text={`${url}${r.path}`} />
                              <a href={`${url}${r.path}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan transition-colors"><ExternalLink className="size-3" /></a>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => {
                const text = results.filter((r) => r.status === "found" || r.status === "forbidden").map((r) => `${r.statusCode} ${r.path}`).join("\n");
                navigator.clipboard.writeText(text);
              }} className="gap-2 text-xs"><Copy className="size-3" />Copy Results</Button>
              <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning} className="gap-2 text-xs"><RefreshCw className="size-3" />Rescan</Button>
            </div>
          </motion.div>
        )}

        <div className="glass-card rounded-xl p-4 border border-amber/20 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Checks {COMMON_PATHS.length} common directories and files including admin panels, config files, backup files, WordPress paths, .git directories, and sensitive data endpoints. HTTP 200 = accessible, 403 = exists but restricted.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
