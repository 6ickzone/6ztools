import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Loader2, Globe, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { proxyFetch } from "@/lib/proxyFetch";

interface DomainInfo {
  domain: string;
  firstSnapshot: string | null;
  lastSnapshot: string | null;
  totalSnapshots: number;
  ageYears: number | null;
  ageDays: number | null;
  error?: string;
}

interface DomainAgeCheckerProps { onBack: () => void; }

export function DomainAgeChecker({ onBack }: DomainAgeCheckerProps) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DomainInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain.trim()) return;
    const target = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    setDomain(target);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Wayback Machine API - CDX
      const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${target}&output=json&limit=5&fl=timestamp&sort=oldest`;
      const cdxUrl2 = `https://web.archive.org/cdx/search/cdx?url=${target}&output=json&limit=5&fl=timestamp&sort=newest`;

      const [oldestRes, newestRes] = await Promise.all([
        proxyFetch(cdxUrl).then((r) => r.json()).catch(() => []),
        proxyFetch(cdxUrl2).then((r) => r.json()).catch(() => []),
      ]);

      // Count snapshots
      const countUrl = `https://web.archive.org/cdx/search/cdx?url=${target}&output=json&fl=timestamp&showNumPages=true`;
      let totalSnapshots = 0;
      try {
        const countRes = await proxyFetch(countUrl);
        const countData = await countRes.json();
        totalSnapshots = parseInt(countData[0]) || 0;
      } catch { /* ignore */ }

      const firstTimestamp = oldestRes?.[1]?.[0] || null;
      const lastTimestamp = newestRes?.[newestRes.length - 1]?.[0] || null;

      const formatDate = (ts: string) => {
        if (!ts || ts.length < 8) return null;
        return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
      };

      const firstDate = formatDate(firstTimestamp);
      const lastDate = formatDate(lastTimestamp);
      const ageDays = firstDate ? Math.floor((Date.now() - new Date(firstDate).getTime()) / 86400000) : null;
      const ageYears = ageDays ? Math.floor(ageDays / 365) : null;

      if (!firstDate) {
        setResult({ domain: target, firstSnapshot: null, lastSnapshot: null, totalSnapshots: 0, ageYears: null, ageDays: null, error: "No snapshots found for this domain." });
      } else {
        setResult({ domain: target, firstSnapshot: firstDate, lastSnapshot: lastDate, totalSnapshots, ageYears, ageDays });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check domain age");
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-emerald/10"><Calendar className="size-8 text-emerald" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Domain Age Checker</h1>
            <p className="text-muted-foreground text-base">Find when a domain was first archived by the Wayback Machine. Tracks domain history and age.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleCheck()} className="pl-10" disabled={loading} />
            </div>
            <Button onClick={handleCheck} disabled={loading || !domain.trim()} className="gap-2 bg-emerald hover:bg-emerald/90 text-black font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}
              Check
            </Button>
          </div>
        </div>
        {error && <div className="glass-card rounded-xl p-4 border border-red/20 mb-6"><p className="text-sm text-red">{error}</p></div>}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="text-lg font-bold mb-4">{result.domain}</h2>
              {result.error ? (
                <div className="flex items-center gap-2 text-amber text-sm"><AlertTriangle className="size-4" />{result.error}</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald/5 border border-emerald/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">First Seen</div>
                    <div className="text-lg font-bold text-emerald">{result.firstSnapshot}</div>
                  </div>
                  <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Last Snapshot</div>
                    <div className="text-lg font-bold text-cyan">{result.lastSnapshot}</div>
                  </div>
                  <div className="bg-amber/5 border border-amber/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Domain Age</div>
                    <div className="text-lg font-bold text-amber">{result.ageYears} years</div>
                    <div className="text-[10px] text-muted-foreground">{result.ageDays} days</div>
                  </div>
                  <div className="bg-purple/5 border border-purple/20 rounded-xl p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Wayback Snapshots</div>
                    <div className="text-lg font-bold text-purple">{result.totalSnapshots.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
