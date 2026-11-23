import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Search, Loader2, Copy, Check, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { proxyFetch } from "@/lib/proxyFetch";

interface HostEntry {
  host: string;
  ip: string;
}

function isInvalid(text: string): boolean {
  return /<!doctype|<html/i.test(text) ||
    /rate.?limit|too many requests|api count exceeded/i.test(text) ||
    text.trim().length < 3;
}

export function ReverseIpLookup({ onBack }: { onBack: () => void }) {
  const [target, setTarget] = useState("");
  const [hosts, setHosts] = useState<HostEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");

  const resolveHost = async (host: string): Promise<HostEntry> => {
    try {
      const res = await proxyFetch(`https://dns.google/resolve?name=${host}&type=A`, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      const ip = data?.Answer?.find((a: { type: number }) => a.type === 1)?.data ?? "—";
      return { host, ip };
    } catch {
      return { host, ip: "—" };
    }
  };

  const lookup = useCallback(async () => {
    let t = target.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!t) return;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(t)) {
      // reverse IP: use hackertarget reverseip
      setLoading(true);
      setError(null);
      setHosts([]);
      setQuery(t);
      try {
        const res = await proxyFetch(`https://api.hackertarget.com/reverseiplookup/?q=${t}`, { signal: AbortSignal.timeout(15000) });
        const text = await res.text();
        if (isInvalid(text)) throw new Error("API unavailable or rate-limited. Try again later.");
        const parsed: HostEntry[] = text.split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !/error|invalid|no dns/i.test(l))
          .map((l) => {
            const [host, ip] = l.split(/\s+/);
            return { host: host ?? l, ip: ip ?? "—" };
          });
        if (parsed.length === 0) throw new Error("No hostnames found for this IP.");
        setHosts(parsed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lookup failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // domain: resolve its IPs then reverse-lookup
    setLoading(true);
    setError(null);
    setHosts([]);
    setQuery(t);
    try {
      const ipRes = await proxyFetch(`https://dns.google/resolve?name=${t}&type=A`, { signal: AbortSignal.timeout(8000) });
      const ipData = await ipRes.json();
      const ip = ipData?.Answer?.find((a: { type: number }) => a.type === 1)?.data;
      if (!ip) throw new Error("Could not resolve an IP for this domain.");
      const res = await proxyFetch(`https://api.hackertarget.com/reverseiplookup/?q=${ip}`, { signal: AbortSignal.timeout(15000) });
      const text = await res.text();
      if (isInvalid(text)) throw new Error("API unavailable or rate-limited. Try again later.");
      const parsed: HostEntry[] = text.split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !/error|invalid|no dns/i.test(l))
        .map((l) => {
          const [host, ip2] = l.split(/\s+/);
          return { host: host ?? l, ip: ip2 ?? ip };
        });
      if (parsed.length === 0) throw new Error("No other hostnames found on this IP.");
      setHosts(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }, [target]);

  const copyAll = () => {
    navigator.clipboard.writeText(hosts.map((h) => `${h.host}\t${h.ip}`).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([hosts.map((h) => `${h.host}\t${h.ip}`).join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "reverse-ip-results.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10"><Globe className="size-8 text-cyan" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reverse IP Lookup</h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
            </div>
            <p className="text-muted-foreground text-base">Find all hostnames sharing an IP address — enter a domain or a raw IP.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={target} onChange={(e) => setTarget(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookup()}
                placeholder="example.com or 93.184.216.34" className="pl-10 h-11 font-mono" />
            </div>
            <Button onClick={lookup} disabled={loading || !target.trim()}
              className="gap-2 h-11 px-6 bg-cyan hover:bg-cyan/90 text-black font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
              {loading ? "Looking up…" : "Lookup"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Enter a domain to resolve + reverse-lookup its IP, or enter a raw IP to list all hosted domains (HackerTarget).
          </p>
        </div>

        {error && <div className="mb-6 p-3 rounded-lg bg-red/10 border border-red/20 text-sm text-red">{error}</div>}

        {hosts.length > 0 && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{hosts.length} hostnames on “{query}”</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={copyAll} className="gap-1 text-xs h-7">
                  {copied ? <><Check className="size-3 text-emerald" />Copied</> : <><Copy className="size-3" />Copy</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={download} className="gap-1 text-xs h-7"><Download className="size-3" />.txt</Button>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-border/30">
              {hosts.map((h, i) => (
                <div key={`${h.host}-${i}`} className="px-5 py-2.5 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                  <Globe className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-mono flex-1 min-w-0 truncate">{h.host}</span>
                  <span className="text-[11px] font-mono text-cyan shrink-0">{h.ip}</span>
                  <a href={`https://${h.host}`} target="_blank" rel="noopener noreferrer"
                    className="p-1 rounded text-muted-foreground hover:text-cyan transition-colors shrink-0">
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hosts.length && !loading && !error && (
          <div className="glass-card rounded-2xl p-10 text-center">
            <Globe className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Enter a domain or IP address to discover co-hosted websites.</p>
          </div>
        )}

        <div className="glass-card rounded-xl p-4 mt-6 border border-amber/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Note:</strong> Shared-IP results come from HackerTarget's passive database and may be incomplete. Results are limited on the free tier.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
