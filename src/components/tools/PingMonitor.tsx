import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Activity, Play, Square, Gauge, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { proxyFetch } from "@/lib/proxyFetch";

interface PingSample {
  time: number;
  ms: number;
  ok: boolean;
}

/* ═══ Ping Monitor ═══ */

export function PingMonitor({ onBack }: { onBack: () => void }) {
  const [target, setTarget] = useState("");
  const [interval, setIntervalMs] = useState(3000);
  const [samples, setSamples] = useState<PingSample[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { abortRef.current = true; if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const pingOnce = async (url: string): Promise<PingSample> => {
    const start = performance.now();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    try {
      await proxyFetch(url, { signal: controller.signal, cache: "no-store" });
      return { time: Date.now(), ms: Math.round(performance.now() - start), ok: true };
    } catch {
      return { time: Date.now(), ms: Math.round(performance.now() - start), ok: false };
    } finally {
      clearTimeout(t);
    }
  };

  const loop = useCallback(async (url: string) => {
    while (!abortRef.current) {
      const sample = await pingOnce(url);
      setSamples((prev) => [...prev.slice(-99), sample]);
      await new Promise((r) => { timerRef.current = setTimeout(r, interval); });
    }
  }, [interval]);

  const start = () => {
    let url = target.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    abortRef.current = false;
    setSamples([]);
    setRunning(true);
    loop(url);
  };

  const stop = () => { abortRef.current = true; setRunning(false); if (timerRef.current) clearTimeout(timerRef.current); };

  const okSamples = samples.filter((s) => s.ok);
  const avg = okSamples.length ? Math.round(okSamples.reduce((a, s) => a + s.ms, 0) / okSamples.length) : 0;
  const min = okSamples.length ? Math.min(...okSamples.map((s) => s.ms)) : 0;
  const max = okSamples.length ? Math.max(...okSamples.map((s) => s.ms)) : 0;
  const loss = samples.length ? Math.round(((samples.length - okSamples.length) / samples.length) * 100) : 0;
  const recent = samples.slice(-20);
  const trend = recent.length >= 4 && okSamples.length >= 2
    ? (recent.slice(-3).reduce((a, s) => a + s.ms, 0) / 3) - (recent.slice(0, 3).reduce((a, s) => a + s.ms, 0) / 3)
    : 0;

  const maxMs = Math.max(max, 1);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10"><Activity className="size-8 text-cyan" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ping Monitor</h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
            </div>
            <p className="text-muted-foreground text-base">Continuous latency monitoring with live chart, jitter, and packet-loss stats.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input value={target} onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !running && start()}
              placeholder="example.com or https://site.com" className="flex-1 h-11 font-mono" disabled={running} />
            <div className="flex gap-2">
              <select value={interval} onChange={(e) => setIntervalMs(Number(e.target.value))} disabled={running}
                className="h-11 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm outline-none focus:border-cyan/40">
                <option value={1000}>1s</option>
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
              {running ? (
                <Button onClick={stop} variant="outline" className="gap-2 h-11 text-red border-red/30"><Square className="size-4" /> Stop</Button>
              ) : (
                <Button onClick={start} disabled={!target.trim()} className="gap-2 h-11 bg-cyan hover:bg-cyan/90 text-black font-semibold">
                  <Play className="size-4" /> Start
                </Button>
              )}
            </div>
          </div>
        </div>

        {samples.length > 0 && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Last", value: `${samples[samples.length - 1]?.ms ?? 0}ms`, icon: Activity, cls: "text-cyan" },
                { label: "Avg", value: `${avg}ms`, icon: Gauge, cls: "text-purple" },
                { label: "Min / Max", value: `${min}/${max}ms`, icon: TrendingDown, cls: "text-emerald" },
                { label: "Packet Loss", value: `${loss}%`, icon: TrendingUp, cls: loss > 20 ? "text-red" : "text-amber" },
              ].map((s) => (
                <div key={s.label} className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className={`size-3.5 ${s.cls}`} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Live bar chart */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Latency Timeline</h3>
                <div className="flex items-center gap-2 text-[11px]">
                  {Math.abs(trend) > 50 && (
                    <span className={`flex items-center gap-1 ${trend > 0 ? "text-amber" : "text-emerald"}`}>
                      {trend > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {trend > 0 ? "degrading" : "improving"}
                    </span>
                  )}
                  <span className="text-muted-foreground">scale 0–{maxMs}ms</span>
                </div>
              </div>
              <div className="flex items-end gap-[3px] h-32">
                {samples.slice(-60).map((s, i, arr) => {
                  const h = s.ok ? Math.max(4, (s.ms / maxMs) * 100) : 100;
                  const color = !s.ok ? "bg-red" : s.ms < 300 ? "bg-emerald" : s.ms < 800 ? "bg-amber" : "bg-red";
                  return (
                    <div key={s.time + i} className={`flex-1 rounded-t transition-all duration-300 ${color} opacity-80 hover:opacity-100`}
                      style={{ height: `${h}%` }} title={`${s.ms}ms${!s.ok ? " (failed)" : ""} — ${new Date(s.time).toLocaleTimeString()}`} />
                  );
                })}
                {samples.length === 0 && <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Waiting for samples…</div>}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                <span>{samples.length > 60 ? `${samples.length - 60} samples earlier` : "start"}</span>
                <span>{running && <Loader2 className="size-3 inline animate-spin mr-1" />}live — {samples.length} samples</span>
                <span>now</span>
              </div>
            </div>
          </>
        )}

        <div className="glass-card rounded-xl p-4 border border-amber/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Note:</strong> Latency is measured through a public CORS proxy, so it includes proxy overhead. It's ideal for uptime and trend monitoring rather than exact ICMP ping values.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══ Bandwidth Tester ═══ */

export function BandwidthTester({ onBack }: { onBack: () => void }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ mbps: number; bytes: number; seconds: number; avgKbps: number } | null>(null);
  const [history, setHistory] = useState<{ mbps: number; at: number }[]>([]);

  const TEST_FILES = [
    { label: "Small (~100 KB)", url: "https://speed.cloudflare.com/__down?bytes=100000" },
    { label: "Medium (~1 MB)", url: "https://speed.cloudflare.com/__down?bytes=1000000" },
    { label: "Large (~10 MB)", url: "https://speed.cloudflare.com/__down?bytes=10000000" },
  ];

  const runTest = async (file: typeof TEST_FILES[number]) => {
    setRunning(true);
    setProgress(0);
    setResult(null);
    const start = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(file.url, { signal: controller.signal, cache: "no-store" });
      const reader = res.body?.getReader();
      let received = 0;
      if (reader) {
        const totalGuess = Number(res.headers.get("content-length")) || (file.label.includes("10") ? 10000000 : file.label.includes("1 MB") ? 1000000 : 100000);
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value?.length ?? 0;
          setProgress(Math.min(99, (received / totalGuess) * 100));
        }
      } else {
        const buf = await res.arrayBuffer();
        received = buf.byteLength;
      }
      const seconds = (performance.now() - start) / 1000;
      const mbps = (received * 8) / (seconds * 1_000_000);
      const avgKbps = received / seconds / 1024;
      setProgress(100);
      setResult({ mbps, bytes: received, seconds, avgKbps });
      setHistory((prev) => [{ mbps, at: Date.now() }, ...prev.slice(0, 9)]);
    } catch {
      setResult(null);
      alert("Download failed — the test file host may be blocked by the network or CORS policy. Try again or check your connection.");
    } finally {
      clearTimeout(timeout);
      setRunning(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10"><Gauge className="size-8 text-purple" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bandwidth Tester</h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
            </div>
            <p className="text-muted-foreground text-base">Measure your download throughput with three test sizes from Cloudflare's speed endpoint.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {TEST_FILES.map((f) => (
            <button key={f.label} onClick={() => runTest(f)} disabled={running}
              className="glass-card rounded-xl p-5 text-left border border-border/30 hover:border-purple/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium group-hover:text-purple transition-colors">{f.label}</span>
                {running ? <Loader2 className="size-4 animate-spin text-purple" /> : <Play className="size-4 text-muted-foreground group-hover:text-purple" />}
              </div>
              <div className="text-[10px] text-muted-foreground">speed.cloudflare.com</div>
            </button>
          ))}
        </div>

        {running && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Downloading…</span>
              <span className="text-xs text-purple font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full bg-purple transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {result && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h3 className="text-sm font-semibold mb-4">Result</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Download Speed", value: `${result.mbps.toFixed(2)} Mbps`, cls: "text-purple" },
                { label: "Throughput", value: `${result.avgKbps.toFixed(0)} KB/s`, cls: "text-cyan" },
                { label: "Transferred", value: `${(result.bytes / 1024 / 1024).toFixed(2)} MB`, cls: "text-emerald" },
                { label: "Duration", value: `${result.seconds.toFixed(2)}s`, cls: "text-amber" },
              ].map((r) => (
                <div key={r.label} className="bg-muted/30 rounded-xl p-4 border border-border/30">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{r.label}</div>
                  <div className={`text-lg font-bold ${r.cls}`}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length > 1 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4">Test History</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={h.at} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0">{new Date(h.at).toLocaleTimeString()}</span>
                  <div className="flex-1 h-4 rounded bg-muted/30 overflow-hidden">
                    <div className="h-full bg-purple/70" style={{ width: `${Math.min(100, (h.mbps / Math.max(...history.map((x) => x.mbps))) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-mono text-purple w-24 text-right">{h.mbps.toFixed(2)} Mbps</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
