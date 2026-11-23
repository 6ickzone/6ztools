import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Webhook, Send, Loader2, Check, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { proxyFetch } from "@/lib/proxyFetch";

const LS_KEY = "discord_webhooks";

interface Preset {
  name: string;
  content: string;
  color: number;
}

const PRESETS: Preset[] = [
  { name: "Scan Complete", content: "✅ **Scan completed** — target: `example.com`\nFindings: 3 medium, 1 high", color: 0x22c55e },
  { name: "Vulnerability Alert", content: "🚨 **Critical vulnerability detected**\nType: SQL Injection\nEndpoint: `/api/login`\nSeverity: **CRITICAL**", color: 0xef4444 },
  { name: "New Host Found", content: "🔍 **New subdomain discovered**\nHost: `staging.example.com`\nSource: passive DNS", color: 0x06b6d4 },
  { name: "Heartbeat", content: "💓 **Agent heartbeat** — all systems operational", color: 0x8b5cf6 },
];

export function DiscordWebhookTester({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState(() => localStorage.getItem(LS_KEY) ?? "");
  const [content, setContent] = useState(PRESETS[1].content);
  const [color, setColor] = useState(PRESETS[1].color);
  const [username, setUsername] = useState("Cybersec Bot");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [history, setHistory] = useState<{ at: number; ok: boolean; msg: string }[]>([]);

  const validUrl = /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+/.test(url.trim());

  const saveUrl = () => {
    localStorage.setItem(LS_KEY, url.trim());
    setStatus({ ok: true, msg: "Webhook URL saved to this browser." });
  };

  const clearUrl = () => {
    localStorage.removeItem(LS_KEY);
    setUrl("");
    setStatus(null);
  };

  const send = async () => {
    if (!validUrl) {
      setStatus({ ok: false, msg: "Enter a valid Discord webhook URL first." });
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const res = await proxyFetch(url.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username || undefined,
          embeds: [{ description: content, color, timestamp: new Date().toISOString() }],
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok || res.status === 204) {
        const msg = "Message delivered — check your Discord channel.";
        setStatus({ ok: true, msg });
        setHistory((h) => [{ at: Date.now(), ok: true, msg }, ...h.slice(0, 19)]);
      } else if (res.status === 404) {
        setStatus({ ok: false, msg: "Webhook not found (404) — it may have been deleted." });
        setHistory((h) => [{ at: Date.now(), ok: false, msg: "404 not found" }, ...h.slice(0, 19)]);
      } else if (res.status === 429) {
        setStatus({ ok: false, msg: "Rate-limited (429) — wait a moment and retry." });
        setHistory((h) => [{ at: Date.now(), ok: false, msg: "429 rate limited" }, ...h.slice(0, 19)]);
      } else {
        setStatus({ ok: false, msg: `Discord returned HTTP ${res.status}.` });
        setHistory((h) => [{ at: Date.now(), ok: false, msg: `HTTP ${res.status}` }, ...h.slice(0, 19)]);
      }
    } catch {
      setStatus({ ok: false, msg: "Request failed — network error or blocked by CORS." });
      setHistory((h) => [{ at: Date.now(), ok: false, msg: "network error" }, ...h.slice(0, 19)]);
    } finally {
      setSending(false);
    }
  };

  const sendAll = async () => {
    if (!validUrl || sending) return;
    setSending(true);
    setStatus(null);
    let sent = 0;
    for (const p of PRESETS) {
      try {
        const res = await proxyFetch(url.trim(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username || undefined, embeds: [{ description: p.content, color: p.color, timestamp: new Date().toISOString() }] }),
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok || res.status === 204) sent++;
        await new Promise((r) => setTimeout(r, 700)); // avoid rate limit
      } catch { /* skip */ }
    }
    setStatus({ ok: sent > 0, msg: `${sent}/${PRESETS.length} test messages delivered.` });
    setSending(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10"><Webhook className="size-8 text-purple" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Discord Webhook Tester</h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
            </div>
            <p className="text-muted-foreground text-base">Send and validate Discord webhook embeds — ideal for scan alerts and bot pipelines.</p>
          </div>
        </div>

        {/* Webhook config */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Webhook URL</label>
          <div className="flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/ID/TOKEN"
              className="flex-1 h-11 font-mono text-xs" type="password" />
            <Button variant="outline" onClick={saveUrl} className="gap-2 h-11">Save</Button>
            <Button variant="outline" onClick={clearUrl} className="gap-2 h-11 text-red border-red/30"><Trash2 className="size-4" /></Button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            {url.trim() === "" ? (
              <span className="text-muted-foreground">No webhook configured.</span>
            ) : validUrl ? (
              <span className="text-emerald flex items-center gap-1"><Check className="size-3" /> Valid Discord webhook format</span>
            ) : (
              <span className="text-amber flex items-center gap-1"><AlertTriangle className="size-3" /> URL doesn't match Discord's webhook format</span>
            )}
            <span className="text-muted-foreground ml-auto">stored locally, never sent elsewhere</span>
          </div>
        </div>

        {/* Message */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Bot Username</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Cybersec Bot" className="h-10" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Embed Color</label>
              <div className="flex items-center gap-2">
                {["#22c55e", "#ef4444", "#06b6d4", "#8b5cf6", "#f59e0b"].map((c) => (
                  <button key={c} onClick={() => setColor(parseInt(c.slice(1), 16))}
                    className={`size-7 rounded-full border-2 transition-all ${color === parseInt(c.slice(1), 16) ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
                <span className="text-[11px] font-mono text-muted-foreground">#{color.toString(16).padStart(6, "0").toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => { setContent(p.content); setColor(p.color); }}
                className="px-3 py-1.5 rounded-full text-[11px] bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50 hover:text-foreground transition-all">
                {p.name}
              </button>
            ))}
          </div>

          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
            placeholder="Message content — **markdown** supported"
            className="font-mono text-sm bg-muted/30 border-border/50" />

          {/* Preview */}
          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Embed Preview</label>
            <div className="rounded-lg bg-[#2b2d31] p-4 border-l-4" style={{ borderLeftColor: `#${color.toString(16).padStart(6, "0")}` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-6 rounded-full bg-cyan/60 flex items-center justify-center text-[9px] font-bold text-black">CB</div>
                <span className="text-sm font-semibold text-white">{username || "Cybersec Bot"}</span>
                <span className="text-[9px] bg-[#5865f2] text-white px-1 rounded">APP</span>
              </div>
              <p className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words">{content || "…"}</p>
              <div className="text-[10px] text-[#949ba4] mt-2">{new Date().toLocaleString()}</div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button onClick={send} disabled={sending || !validUrl}
              className="gap-2 bg-purple hover:bg-purple/90 text-black font-semibold">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {sending ? "Sending…" : "Send Test Message"}
            </Button>
            <Button variant="outline" onClick={sendAll} disabled={sending || !validUrl} className="gap-2">
              Send All Presets
            </Button>
          </div>

          {status && (
            <div className={`mt-4 p-3 rounded-lg text-sm border ${status.ok ? "bg-emerald/10 border-emerald/20 text-emerald" : "bg-red/10 border-red/20 text-red"}`}>
              {status.msg}
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50">
              <h3 className="text-sm font-semibold">Send History</h3>
            </div>
            <div className="divide-y divide-border/30 max-h-60 overflow-y-auto">
              {history.map((h, i) => (
                <div key={`${h.at}-${i}`} className="px-5 py-2.5 flex items-center gap-3">
                  <span className={`size-1.5 rounded-full shrink-0 ${h.ok ? "bg-emerald" : "bg-red"}`} />
                  <span className="text-xs flex-1">{h.msg}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(h.at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
