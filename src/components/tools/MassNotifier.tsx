import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, Inbox, Rocket, Shield, Layers, Zap, Check, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { proxyFetch } from "@/lib/proxyFetch";

type Target = "defacerid" | "zoneh";
type Platform = Target | "both";
type LogStatus = "pending" | "success" | "duplicate" | "failed";

interface LogEntry {
  id: number;
  platform: string;
  url: string;
  status: LogStatus;
  msg: string;
}

const DELAY_BETWEEN_URLS = 300;
const DELAY_DOUBLE_STRIKE = 500;

/**
 * Every outbound POST goes through the 6ickzone backend proxy: no CORS, no
 * mixed-content block for plain-http targets like zone-h.com, and the upstream
 * status code comes back intact. `proxyFetch` falls back to public relays on its
 * own if the backend is unreachable.
 */
async function postWithFallback(url: string, init: RequestInit): Promise<Response> {
  return proxyFetch(url, {
    method: init.method ?? "GET",
    headers: init.headers,
    body: init.body,
    timeoutMs: 25000,
  });
}

async function notifyDefacerId(url: string, notifier: string, team: string): Promise<{ ok: boolean; msg: string }> {
  const payload = JSON.stringify({
    notifier,
    team,
    url,
    poc: "Not available",
    reason: "Not available",
  });
  const attempt = async () => {
    const res = await postWithFallback("https://api.defacer.id/v2/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 6ickzone-Notifier/3.0" },
      body: payload,
    });
    const text = await res.text();
    let apiMsg = "Invalid Response";
    try {
      const data = JSON.parse(text) as { message?: string };
      if (data?.message) apiMsg = data.message;
    } catch { /* non-JSON response */ }

    if (/success/i.test(apiMsg)) return { ok: true, msg: "✅ SUCCESS" };
    if (/already|added|duplicate/i.test(apiMsg)) return { ok: false, msg: "⚠️ DUPLICATE" };
    return { ok: false, msg: `❌ ERROR — ${apiMsg.slice(0, 80)}` };
  };

  try {
    return await attempt();
  } catch {
    try {
      return await attempt(); // one auto-retry on network failure
    } catch {
      return { ok: false, msg: "❌ Connection failed" };
    }
  }
}

async function notifyZoneH(url: string, notifier: string): Promise<{ ok: boolean; msg: string }> {
  const body = new URLSearchParams({
    defacer: notifier,
    domain1: url,
    hackmode: "1",
    reason: "1",
  }).toString();

  const attempt = async () => {
    const res = await postWithFallback("http://www.zone-h.com/notify/single", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const html = await res.text();
    if (/color="red">OK<\/font><\/li>/.test(html)) return { ok: true, msg: "✅ SUCCESS" };
    if (/already|duplicate/i.test(html)) return { ok: false, msg: "⚠️ DUPLICATE" };
    return { ok: false, msg: "❌ FAILED" };
  };

  try {
    return await attempt();
  } catch {
    try {
      return await attempt();
    } catch {
      return { ok: false, msg: "❌ Connection failed" };
    }
  }
}

export function MassNotifier({ onBack }: { onBack: () => void }) {
  const [nickDefid, setNickDefid] = useState("0x6ick");
  const [nickZoneh, setNickZoneh] = useState("5YN15T3R_742");
  const [team, setTeam] = useState("6ickzone");
  const [platform, setPlatform] = useState<Platform>("defacerid");
  const [list, setList] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const idRef = useRef(0);
  const logRef = useRef<HTMLDivElement | null>(null);

  const urls = list.split("\n").map((l) => l.trim()).filter((l) => l !== "");

  const push = useCallback(async (url: string, target: Target) => {
    const id = idRef.current++;
    const platformTag = target === "defacerid" ? "DEFACERID" : "ZONE-H";
    setLogs((prev) => [{ id, platform: platformTag, url, status: "pending", msg: "⏳ Processing…" }, ...prev]);

    const result = target === "defacerid"
      ? await notifyDefacerId(url, nickDefid || "0x6ick", team || "6ickzone")
      : await notifyZoneH(url, nickZoneh || nickDefid || "0x6ick");

    setLogs((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, status: result.ok ? "success" : result.msg.includes("DUPLICATE") ? "duplicate" : "failed", msg: result.msg }
          : l
      )
    );
    return result;
  }, [nickDefid, nickZoneh, team]);

  const execute = useCallback(async () => {
    if (urls.length === 0 || running) return;
    setRunning(true);
    setLogs([]);
    for (const url of urls) {
      if (platform === "both") {
        await push(url, "defacerid");
        await new Promise((r) => setTimeout(r, DELAY_DOUBLE_STRIKE));
        await push(url, "zoneh");
      } else {
        await push(url, platform);
      }
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_URLS));
    }
    setRunning(false);
  }, [urls, platform, push, running]);

  // Ctrl/Cmd + Enter executes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!running && urls.length > 0) void execute();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [execute, running, urls.length]);

  const stats = {
    success: logs.filter((l) => l.status === "success").length,
    duplicate: logs.filter((l) => l.status === "duplicate").length,
    failed: logs.filter((l) => l.status === "failed").length,
    pending: logs.filter((l) => l.status === "pending").length,
  };

  const statusCls = (s: LogStatus) =>
    s === "success" ? "text-emerald bg-emerald/10"
    : s === "duplicate" ? "text-amber bg-amber/10"
    : s === "failed" ? "text-red bg-red/10"
    : "text-cyan bg-cyan/10";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-cyan/10 border border-cyan/20 mb-3">
            <Send className="size-7 text-cyan" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            Mass <span className="text-cyan">Notifier</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Bulk notify deface pages to Defacer.ID &amp; Zone-H archives.
          </p>
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan gap-1"><Zap className="size-3" /> Bulk Process</Badge>
            <Badge variant="outline" className="text-[10px] border-purple/30 text-purple gap-1"><Shield className="size-3" /> 2 Platforms</Badge>
            <Badge variant="outline" className="text-[10px] border-amber/30 text-amber gap-1"><Layers className="size-3" /> Auto-retry</Badge>
          </div>
        </div>

        {/* Form */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Defacer.ID Nick</label>
              <Input value={nickDefid} onChange={(e) => setNickDefid(e.target.value)} placeholder="0x6ick" className="h-10" disabled={running} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Zone-H Nick</label>
              <Input value={nickZoneh} onChange={(e) => setNickZoneh(e.target.value)} placeholder="5YN15T3R_742" className="h-10" disabled={running} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Team Name</label>
              <Input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="6ickzone" className="h-10" disabled={running} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} disabled={running}
                className="w-full h-10 px-3 rounded-lg bg-muted/30 border border-border/50 text-sm outline-none focus:border-cyan/40 appearance-none">
                <option value="defacerid">Defacer.ID</option>
                <option value="zoneh">Zone-H</option>
                <option value="both">Double Strike</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
              URL List <span className="normal-case font-normal">— one per line</span>
            </label>
            <Textarea value={list} onChange={(e) => setList(e.target.value)} rows={5} disabled={running}
              placeholder={"https://target.com/hacked.html\nhttps://target2.com/defaced.html"}
              className="font-mono text-sm bg-muted/30 border-border/50 min-h-[110px]"
              autoFocus />
            <div className="text-[10px] text-muted-foreground mt-1">{urls.length} URL{urls.length !== 1 && "s"} queued · Ctrl+Enter to execute</div>
          </div>

          <Button onClick={execute} disabled={running || urls.length === 0}
            className="w-full mt-4 gap-2 h-12 bg-cyan hover:bg-cyan/90 text-black font-bold text-base">
            {running ? (
              <><Loader2 className="size-4 animate-spin" /> Processing {logs.length}/{platform === "both" ? urls.length * 2 : urls.length}…</>
            ) : (
              <><Rocket className="size-4" /> Execute Notify</>
            )}
          </Button>
        </div>

        {/* Stats */}
        {logs.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Success", value: stats.success, cls: "text-emerald" },
              { label: "Duplicate", value: stats.duplicate, cls: "text-amber" },
              { label: "Failed", value: stats.failed, cls: "text-red" },
              { label: "Pending", value: stats.pending, cls: "text-cyan" },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-3 text-center">
                <div className={`text-lg font-bold ${s.cls}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Log */}
        <div className="glass-card rounded-2xl overflow-hidden" ref={logRef}>
          <div className="px-5 py-3 border-b border-border/50">
            <h3 className="text-sm font-semibold">Notification Log</h3>
          </div>
          {logs.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Inbox className="size-9 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No notifications sent yet</p>
            </div>
          ) : (
            <div className="max-h-[440px] overflow-y-auto divide-y divide-border/30">
              <AnimatePresence initial={false}>
                {logs.map((l) => (
                  <motion.div key={l.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                    <Badge variant="outline" className={`text-[9px] shrink-0 ${l.platform === "ZONE-H" ? "border-amber/30 text-amber" : "border-cyan/30 text-cyan"}`}>
                      {l.platform}
                    </Badge>
                    <span className="text-[11px] font-mono flex-1 min-w-0 truncate text-muted-foreground">{l.url}</span>
                    <span className={`text-[11px] font-medium whitespace-nowrap shrink-0 px-2.5 py-1 rounded-full ${statusCls(l.status)}`}>
                      {l.msg}
                    </span>
                    {l.status === "success" && <Check className="size-3.5 text-emerald shrink-0" />}
                    {l.status === "duplicate" && <AlertTriangle className="size-3.5 text-amber shrink-0" />}
                    {l.status === "failed" && <XCircle className="size-3.5 text-red shrink-0" />}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 mt-6 border border-amber/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Note:</strong> Requests go to the official Defacer.ID and Zone-H notify endpoints. Zone-H submissions from the browser are routed through a CORS relay because the archive serves plain HTTP. Expect 300–500ms delay between submissions to avoid rate limits — only notify defacements you are authorized to report.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
