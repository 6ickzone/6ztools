import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Loader2, Globe, CheckCircle, XCircle, AlertTriangle, Pause, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { proxyFetch } from "@/lib/proxyFetch";

const COMMON_PORTS = [
  { port: 21, name: "FTP", risk: "high" },
  { port: 22, name: "SSH", risk: "info" },
  { port: 23, name: "Telnet", risk: "critical" },
  { port: 25, name: "SMTP", risk: "medium" },
  { port: 53, name: "DNS", risk: "medium" },
  { port: 80, name: "HTTP", risk: "info" },
  { port: 110, name: "POP3", risk: "medium" },
  { port: 111, name: "RPCBind", risk: "high" },
  { port: 135, name: "MSRPC", risk: "high" },
  { port: 139, name: "NetBIOS", risk: "high" },
  { port: 143, name: "IMAP", risk: "medium" },
  { port: 443, name: "HTTPS", risk: "info" },
  { port: 445, name: "SMB", risk: "critical" },
  { port: 993, name: "IMAPS", risk: "info" },
  { port: 995, name: "POP3S", risk: "info" },
  { port: 1433, name: "MSSQL", risk: "critical" },
  { port: 1521, name: "Oracle", risk: "critical" },
  { port: 2049, name: "NFS", risk: "high" },
  { port: 3306, name: "MySQL", risk: "critical" },
  { port: 3389, name: "RDP", risk: "critical" },
  { port: 5432, name: "PostgreSQL", risk: "critical" },
  { port: 5900, name: "VNC", risk: "critical" },
  { port: 6379, name: "Redis", risk: "critical" },
  { port: 8080, name: "HTTP-Alt", risk: "medium" },
  { port: 8443, name: "HTTPS-Alt", risk: "info" },
  { port: 8888, name: "HTTP-Proxy", risk: "medium" },
  { port: 9200, name: "Elasticsearch", risk: "high" },
  { port: 9300, name: "ES-Transport", risk: "high" },
  { port: 11211, name: "Memcached", risk: "critical" },
  { port: 27017, name: "MongoDB", risk: "critical" },
];

const RISK_COLORS: Record<string, string> = {
  critical: "text-red",
  high: "text-amber",
  medium: "text-cyan",
  info: "text-emerald",
  low: "text-muted-foreground",
};

interface ScanResult {
  port: number;
  name: string;
  risk: string;
  status: "open" | "closed" | "filtered" | "pending";
  responseTime?: number;
}

interface PortScannerProps { onBack: () => void; }

export function PortScanner({ onBack }: PortScannerProps) {
  const [host, setHost] = useState("");
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [scanTime, setScanTime] = useState<number | null>(null);
  const abortRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  const cleanHost = (input: string) => input.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");

  const probePort = async (target: string, port: number): Promise<"open" | "closed" | "filtered"> => {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      // Try to connect via HTTP proxy - if it responds, port is open
      const res = await proxyFetch(`http://${target}:${port}`, { signal: controller.signal });
      clearTimeout(timer);
      const elapsed = Date.now() - start;
      if (res.ok || res.status === 403 || res.status === 404 || res.status === 500) return "open";
      if (res.status === 502 || res.status === 503) return "closed";
      return elapsed < 2000 ? "open" : "filtered";
    } catch {
      return "filtered";
    }
  };

  const handleScan = useCallback(async () => {
    if (!host.trim()) return;
    const target = cleanHost(host);
    setHost(target);
    setScanning(true);
    setPaused(false);
    setResults([]);
    setScanTime(null);
    abortRef.current = false;
    startTimeRef.current = Date.now();
    setProgress({ current: 0, total: COMMON_PORTS.length });

    const allResults: ScanResult[] = COMMON_PORTS.map((p) => ({ ...p, status: "pending" }));
    setResults([...allResults]);

    for (let i = 0; i < COMMON_PORTS.length; i++) {
      if (abortRef.current) break;
      while (paused) { await new Promise((r) => setTimeout(r, 200)); if (abortRef.current) break; }
      setProgress({ current: i + 1, total: COMMON_PORTS.length });
      const start = Date.now();
      const status = await probePort(target, COMMON_PORTS[i].port);
      allResults[i] = { ...allResults[i], status, responseTime: Date.now() - start };
      setResults([...allResults]);
    }
    setScanTime(Date.now() - startTimeRef.current);
    setScanning(false);
  }, [host, paused]);

  const handleStop = () => { abortRef.current = true; setScanning(false); setPaused(false); };
  const openPorts = results.filter((r) => r.status === "open");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10">
            <Search className="size-8 text-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Port Scanner</h1>
            <p className="text-muted-foreground text-base">Scan {COMMON_PORTS.length} common ports for open services. Detects critical services like SSH, RDP, databases, and management panels.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 mb-6">
          <label className="text-sm font-medium mb-3 block">Target Host</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="example.com or IP address" value={host} onChange={(e) => setHost(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()} className="pl-10" disabled={scanning} />
            </div>
            <Button onClick={handleScan} disabled={scanning || !host.trim()} className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold">
              {scanning ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {scanning ? "Scanning..." : "Scan"}
            </Button>
          </div>
        </div>
        {scanning && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Scanning port {progress.current}/{progress.total}...</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPaused(!paused)} className="gap-1 text-xs h-7">
                  {paused ? <><Play className="size-3" />Resume</> : <><Pause className="size-3" />Pause</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleStop} className="text-red text-xs h-7">Stop</Button>
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-cyan rounded-full" animate={{ width: `${(progress.current / progress.total) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        )}
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Target: <code className="text-cyan">{host}</code></span>
              {scanTime && <span>Time: {(scanTime / 1000).toFixed(1)}s</span>}
              {openPorts.length > 0 && <span className="text-emerald"><CheckCircle className="size-3 inline mr-1" />{openPorts.length} open</span>}
            </div>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card z-10"><tr className="border-b border-border/50">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Port</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Service</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Risk</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Response</th>
                  </tr></thead>
                  <tbody>
                    {results.filter((r) => r.status !== "pending").map((r) => (
                      <tr key={r.port} className={`border-b border-border/30 last:border-0 ${r.status === "open" ? "bg-emerald/5" : ""}`}>
                        <td className="px-5 py-2.5 font-mono text-xs font-bold">{r.port}</td>
                        <td className="px-5 py-2.5 text-xs">{r.name}</td>
                        <td className="px-5 py-2.5">
                          {r.status === "open" ? <span className="flex items-center gap-1 text-emerald text-xs font-medium"><CheckCircle className="size-3" />Open</span>
                            : r.status === "closed" ? <span className="text-red text-xs font-medium">Closed</span>
                            : <span className="text-muted-foreground text-xs">Filtered</span>}
                        </td>
                        <td className="px-5 py-2.5"><span className={`text-xs font-medium capitalize ${RISK_COLORS[r.risk]}`}>{r.risk}</span></td>
                        <td className="px-5 py-2.5 text-xs text-muted-foreground">{r.responseTime ? `${r.responseTime}ms` : "—"}</td>
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
              <strong className="text-foreground">Note:</strong> Port scanning via CORS proxy is limited. Open/closed detection may not be 100% accurate. For full port scanning, use dedicated tools like Nmap on your local machine.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
