import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Server, Copy, Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { proxyFetch } from "@/lib/proxyFetch";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-cyan transition-colors">
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

const RECORD_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "SRV"];

interface DnsRecord {
  type: string;
  name: string;
  data: string;
  TTL: number;
}

async function queryDns(domain: string, type: string): Promise<DnsRecord[]> {
  const res = await proxyFetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=${type}`, {
    headers: { "Accept": "application/dns-json" },
  });
  const json = await res.json();
  if (json.Status !== 0 || !json.Answer) return [];
  return json.Answer.filter((a: { type: number }) => {
    const typeMap: Record<string, number> = { A: 1, AAAA: 28, MX: 15, TXT: 16, NS: 2, CNAME: 5, SOA: 6, SRV: 33 };
    return a.type === typeMap[type];
  }).map((a: { type: number; name: string; data: string; TTL: number }) => ({
    type: RECORD_TYPES.find((t) => {
      const typeMap: Record<string, number> = { A: 1, AAAA: 28, MX: 15, TXT: 16, NS: 2, CNAME: 5, SOA: 6, SRV: 33 };
      return typeMap[t] === a.type;
    }) || "A",
    name: a.name,
    data: a.data,
    TTL: a.TTL,
  }));
}

interface DnsLookupProps {
  onBack: () => void;
}

export function DnsLookup({ onBack }: DnsLookupProps) {
  const [domain, setDomain] = useState("");
  const [selectedType, setSelectedType] = useState("A");
  const [results, setResults] = useState<Record<string, DnsRecord[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!domain.trim()) return;
    const target = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    setDomain(target);
    setLoading(true);
    setError(null);
    setResults({});

    try {
      const allResults: Record<string, DnsRecord[]> = {};
      for (const type of RECORD_TYPES) {
        try {
          const records = await queryDns(target, type);
          if (records.length > 0) allResults[type] = records;
        } catch { /* skip failed type */ }
      }
      setResults(allResults);
      if (Object.keys(allResults).length === 0) setError("No DNS records found for this domain.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "DNS lookup failed");
    }
    setLoading(false);
  };

  const totalRecords = Object.values(results).reduce((sum, r) => sum + r.length, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10">
            <Server className="size-8 text-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">DNS Lookup</h1>
            <p className="text-muted-foreground text-base">Query all DNS record types via Cloudflare DNS over HTTPS.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Server className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleLookup()} className="pl-10" disabled={loading} />
            </div>
            <Button onClick={handleLookup} disabled={loading || !domain.trim()} className="gap-2 bg-purple hover:bg-purple/90 text-white font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Lookup
            </Button>
          </div>
        </div>

        {/* Record type tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {RECORD_TYPES.map((type) => {
            const count = results[type]?.length || 0;
            return (
              <button key={type} onClick={() => setSelectedType(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedType === type ? "bg-purple text-white" : count > 0 ? "bg-purple/10 text-purple hover:bg-purple/20" : "bg-muted/30 text-muted-foreground"}`}>
                {type}
                {count > 0 && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">{count}</Badge>}
              </button>
            );
          })}
        </div>

        {error && <div className="glass-card rounded-xl p-4 border border-amber/20 mb-6"><p className="text-sm text-amber">{error}</p></div>}

        {Object.keys(results).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-xs text-muted-foreground mb-3">Found {totalRecords} record(s) across {Object.keys(results).length} types</div>
            {results[selectedType] ? (
              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/50">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Data</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">TTL</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase"></th>
                  </tr></thead>
                  <tbody>
                    {results[selectedType].map((r, i) => (
                      <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-2.5"><Badge variant="outline" className="text-[10px]">{r.type}</Badge></td>
                        <td className="px-5 py-2.5 font-mono text-xs">{r.name}</td>
                        <td className="px-5 py-2.5 font-mono text-xs text-emerald break-all max-w-[300px] truncate" title={r.data}>{r.data}</td>
                        <td className="px-5 py-2.5 text-xs text-muted-foreground">{r.TTL}s</td>
                        <td className="px-5 py-2.5"><CopyButton text={r.data} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="glass-card rounded-xl p-6 text-center text-sm text-muted-foreground">No {selectedType} records found. Try another type.</div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
