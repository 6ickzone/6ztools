import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bug, ExternalLink, Loader2, Search, ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { proxyFetch } from "@/lib/proxyFetch";

interface KevEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  knownRansomwareCampaignUse: string;
}

const RECENT_SOURCES = [
  { label: "CISA KEV Catalog", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", desc: "Official exploited-vuln catalog" },
  { label: "Exploit-DB Recent", url: "https://www.exploit-db.com/", desc: "Newest public exploits" },
  { label: "0day.today", url: "https://0day.today/", desc: "0day exploit archive" },
  { label: "VulnCheck KEV", url: "https://vulncheck.com/", desc: "Exploit intelligence" },
];

export function ZeroDayChecker({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<KevEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  const fetchKev = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
      const res = await proxyFetch(url, { signal: AbortSignal.timeout(20000) });
      const text = await res.text();
      if (/<!doctype|<html/i.test(text)) throw new Error("Blocked response — try again shortly.");
      const data = JSON.parse(text);
      const vulns: KevEntry[] = data.vulnerabilities ?? [];
      if (vulns.length === 0) throw new Error("Catalog returned no entries.");
      setEntries(vulns.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)));
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the KEV catalog.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = entries.filter((e) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      e.cveID.toLowerCase().includes(q) ||
      e.vendorProject.toLowerCase().includes(q) ||
      e.product.toLowerCase().includes(q) ||
      e.vulnerabilityName.toLowerCase().includes(q)
    );
  });

  const ransomware = entries.filter((e) => e.knownRansomwareCampaignUse === "Known").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-red/10"><Bug className="size-8 text-red" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">0day Checker</h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
            </div>
            <p className="text-muted-foreground text-base">Check your stack against CISA's Known Exploited Vulnerabilities catalog — the definitive list of CVEs with active exploitation.</p>
          </div>
        </div>

        {/* Sources */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {RECENT_SOURCES.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
              className="glass-card rounded-xl p-4 border border-border/30 hover:border-red/30 transition-all group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium group-hover:text-red transition-colors">{s.label}</span>
                <ExternalLink className="size-3 text-muted-foreground" />
              </div>
              <div className="text-[10px] text-muted-foreground">{s.desc}</div>
            </a>
          ))}
        </div>

        {/* Fetch */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <Button onClick={fetchKev} disabled={loading}
            className="gap-2 bg-red hover:bg-red/90 text-white font-semibold w-full sm:w-auto">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldAlert className="size-4" />}
            {loading ? "Downloading CISA KEV Catalog…" : loaded ? "Refresh KEV Catalog" : "Load Known Exploited Vulnerabilities"}
          </Button>

          {loaded && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by CVE, vendor, or product…" className="pl-10 h-10 font-mono" />
              </div>
            </div>
          )}

          {error && <div className="mt-4 p-3 rounded-lg bg-red/10 border border-red/20 text-sm text-red">{error}</div>}
        </div>

        {loaded && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Catalog Entries", value: entries.length, cls: "text-red" },
                { label: "Ransomware-Linked", value: ransomware, cls: "text-amber" },
                { label: "Matching Filter", value: filtered.length, cls: "text-cyan" },
              ].map((s) => (
                <div key={s.label} className="glass-card rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${s.cls}`}>{s.value.toLocaleString()}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2">
                <Clock className="size-4 text-red" />
                <h3 className="text-sm font-semibold">Most Recently Added</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-border/30">
                {filtered.slice(0, 100).map((e) => (
                  <div key={e.cveID} className="px-5 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <a href={`https://nvd.nist.gov/vuln/detail/${e.cveID}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-mono font-semibold text-cyan hover:underline shrink-0 mt-0.5">
                        {e.cveID}
                      </a>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{e.vulnerabilityName}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {e.vendorProject} / {e.product} — added {new Date(e.dateAdded).toLocaleDateString()}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{e.shortDescription}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <Badge variant="outline" className={`text-[9px] ${e.knownRansomwareCampaignUse === "Known" ? "text-red border-red/30 bg-red/10" : "text-muted-foreground border-border/50"}`}>
                          {e.knownRansomwareCampaignUse === "Known" ? "ransomware" : "no ransomware"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">No entries match “{query}”.</div>
                )}
              </div>
            </div>
          </>
        )}

        {!loaded && !loading && (
          <div className="glass-card rounded-2xl p-10 text-center">
            <ShieldAlert className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Load the CISA Known Exploited Vulnerabilities catalog to check for actively exploited CVEs.</p>
            <p className="text-xs text-muted-foreground mt-1">{RECENT_SOURCES[0].desc} — updated continuously by CISA.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
