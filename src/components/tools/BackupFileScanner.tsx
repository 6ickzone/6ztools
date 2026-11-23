import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Loader2, Globe, CheckCircle, XCircle, Copy, Check, ExternalLink, AlertTriangle, Archive, Pause, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { proxyFetch } from "@/lib/proxyFetch";

const BACKUP_PATTERNS: Record<string, string[]> = {
  "SQL Databases": [".sql", ".sql.gz", ".sql.bak", ".sql.old", ".sql.dump", "dump.sql", "db.sql", "database.sql", "backup.sql", "export.sql", ".sql.1"],
  "Archive Files": [".zip", ".zip.bak", ".tar", ".tar.gz", ".tgz", ".rar", ".7z", ".bak.zip", "backup.zip", "site.zip", "www.zip", "html.zip", "public.zip", "source.zip"],
  "Config Backups": [".conf", ".conf.bak", ".conf.old", ".config.bak", ".config.old", "config.php.bak", "wp-config.php.bak", "settings.py.bak", "web.config.bak", ".env.bak", ".env.old", ".env.backup", "config.json.bak", "config.inc.php.bak"],
  "Source Code Backups": [".bak", ".old", ".orig", ".save", ".swp", ".tmp", "index.php.bak", "index.html.bak", "index.php.old", "login.php.bak", "admin.php.bak", "config.php.old", "functions.php.bak"],
  "Log Files": [".log", "error.log", "access.log", "debug.log", "application.log", "php_errors.log", "wp-errors.log", "debug.log.bak", "server.log", "auth.log"],
  "Version Control": ["HEAD", "config", "index", "packed-refs", ".gitignore", "FETCH_HEAD", "ORIG_HEAD", "COMMIT_EDITMSG"],
  "Web Server": [".htaccess", ".htpasswd", ".htaccess.bak", ".htpasswd.bak", "web.config", "crossdomain.xml", ".user.ini", ".user.ini.bak"],
  "Temp/Cache": ["cache.php", "temp.php", "tmp.php", "test.php.bak", "debug.php", "phpinfo.php", "info.php", "test.php.old"],
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-cyan transition-colors">
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

interface BackupResult {
  path: string;
  status: "found" | "forbidden" | "not-found" | "error" | "pending";
  statusCode?: number;
  category: string;
}

interface BackupFileScannerProps {
  onBack: () => void;
}

export function BackupFileScanner({ onBack }: BackupFileScannerProps) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [results, setResults] = useState<BackupResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [scanTime, setScanTime] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const abortRef = useRef(false);
  const startTimeRef = useRef(0);

  const cleanUrl = (input: string) => {
    let u = input.trim();
    if (!u.startsWith("http")) u = `https://${u}`;
    return u.replace(/\/+$/, "");
  };

  const allPaths = activeCategory
    ? BACKUP_PATTERNS[activeCategory]?.map((p) => ({ path: p, category: activeCategory })) ?? []
    : Object.entries(BACKUP_PATTERNS).flatMap(([cat, paths]) => paths.map((p) => ({ path: p, category: cat })));

  const scanPath = async (baseUrl: string, path: string): Promise<BackupResult> => {
    const category = Object.entries(BACKUP_PATTERNS).find(([, paths]) => paths.includes(path))?.[0] ?? "Other";
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await proxyFetch(`${baseUrl}/${path}`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return { path, status: "found", statusCode: res.status, category };
      if (res.status === 403) return { path, status: "forbidden", statusCode: 403, category };
      return { path, status: "not-found", statusCode: res.status, category };
    } catch {
      return { path, status: "error", category };
    }
  };

  const handleScan = useCallback(async () => {
    if (!url.trim()) return;
    const target = cleanUrl(url);
    setUrl(target);
    setScanning(true);
    setPaused(false);
    setResults([]);
    setScanTime(null);
    abortRef.current = false;
    startTimeRef.current = Date.now();
    setProgress({ current: 0, total: allPaths.length });

    const allResults: BackupResult[] = allPaths.map((p) => ({ ...p, status: "pending" }));
    setResults([...allResults]);

    for (let i = 0; i < allPaths.length; i++) {
      if (abortRef.current) break;
      while (paused) { await new Promise((r) => setTimeout(r, 200)); if (abortRef.current) break; }
      setProgress({ current: i + 1, total: allPaths.length });
      const scanResult = await scanPath(target, allPaths[i].path);
      allResults[i] = { ...scanResult, category: allPaths[i].category };
      setResults([...allResults]);
      await new Promise((r) => setTimeout(r, 150));
    }
    setScanTime(Date.now() - startTimeRef.current);
    setScanning(false);
  }, [url, paused, activeCategory]);

  const handleStop = () => { abortRef.current = true; setScanning(false); setPaused(false); };
  const foundCount = results.filter((r) => r.status === "found").length;
  const forbiddenCount = results.filter((r) => r.status === "forbidden").length;
  const categories = Object.keys(BACKUP_PATTERNS);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-amber/10">
            <Archive className="size-8 text-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Backup File Scanner</h1>
            <p className="text-muted-foreground text-base">Discovers exposed backup files, old versions, database dumps, and configuration backups on the target server.</p>
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
            <Button onClick={handleScan} disabled={scanning || !url.trim()} className="gap-2 bg-amber hover:bg-amber/90 text-black font-semibold">
              {scanning ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {scanning ? "Scanning..." : "Scan"}
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Filter by Category (optional)</label>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveCategory(null)} className={`px-3 py-1 rounded-full text-xs transition-all ${!activeCategory ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}>All ({Object.values(BACKUP_PATTERNS).flat().length})</button>
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${activeCategory === cat ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}>
                {cat} ({BACKUP_PATTERNS[cat].length})
              </button>
            ))}
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
              <motion.div className="h-full bg-amber rounded-full" animate={{ width: `${(progress.current / progress.total) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        )}

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Target: <code className="text-amber">{url}</code></span>
              {scanTime && <span>Time: {(scanTime / 1000).toFixed(1)}s</span>}
              {foundCount > 0 && <span className="text-emerald"><CheckCircle className="size-3 inline mr-1" />{foundCount} accessible</span>}
              {forbiddenCount > 0 && <span className="text-amber"><XCircle className="size-3 inline mr-1" />{forbiddenCount} restricted (403)</span>}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border/50">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">File</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Category</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">HTTP</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.filter((r) => r.status === "found" || r.status === "forbidden").map((r) => (
                      <tr key={r.path} className={`border-b border-border/30 last:border-0 transition-colors ${r.status === "found" ? "bg-emerald/5" : "bg-amber/5"}`}>
                        <td className="px-5 py-2.5"><code className="text-xs font-mono">/{r.path}</code></td>
                        <td className="px-5 py-2.5"><span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{r.category}</span></td>
                        <td className="px-5 py-2.5">
                          {r.status === "found" ? <span className="flex items-center gap-1.5 text-emerald text-xs font-medium"><CheckCircle className="size-3" />Accessible</span>
                            : <span className="text-amber text-xs font-medium">Restricted</span>}
                        </td>
                        <td className="px-5 py-2.5 text-xs font-mono">{r.statusCode}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <CopyButton text={`${url}/${r.path}`} />
                            <a href={`${url}/${r.path}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan transition-colors"><ExternalLink className="size-3" /></a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        <div className="glass-card rounded-xl p-4 border border-amber/20 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> Checks {Object.values(BACKUP_PATTERNS).flat().length} backup file patterns across {categories.length} categories: SQL dumps, archive files, config backups, source code backups, log files, version control artifacts, and web server configs.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
