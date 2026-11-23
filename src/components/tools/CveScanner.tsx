import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert, Search, ExternalLink, Loader2, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { proxyFetch } from "@/lib/proxyFetch";

interface Cve {
  id: string;
  description: string;
  severity: string;
  score: number | null;
  published: string;
  cvss: string;
  references: string[];
}

const SEVERITY_CLS: Record<string, string> = {
  CRITICAL: "text-red border-red/30 bg-red/10",
  HIGH: "text-amber border-amber/30 bg-amber/10",
  MEDIUM: "text-cyan border-cyan/30 bg-cyan/10",
  LOW: "text-emerald border-emerald/30 bg-emerald/10",
  NONE: "text-muted-foreground border-border/50 bg-muted/30",
};

export function CveScanner({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Cve[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setLastQuery(q);
    try {
      const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(q)}&resultsPerPage=20`;
      const res = await proxyFetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`NVD API returned ${res.status}`);
      const text = await res.text();
      if (/<!doctype|<html/i.test(text)) throw new Error("Blocked response received — try again in a moment");
      const data = JSON.parse(text);
      const vulns: Cve[] = (data.vulnerabilities ?? []).map((v: { cve: Record<string, unknown> }) => {
        const cve = v.cve;
        const metrics = (cve as { metrics?: Record<string, { cvssData?: { baseScore: number; vectorString: string; baseSeverity?: string } }[]> }).metrics ?? {};
        const key = ["cvssMetricV31", "cvssMetricV30", "cvssMetricV2"].find((k) => Array.isArray(metrics[k]) && metrics[k].length > 0);
        const m = key ? metrics[key]?.[0]?.cvssData : undefined;
        const descObj = (cve as { descriptions?: { lang: string; value: string }[] }).descriptions;
        return {
          id: (cve as { id: string }).id,
          description: descObj?.find((d) => d.lang === "en")?.value ?? "No description available.",
          severity: (m?.baseSeverity as string) ?? "NONE",
          score: m?.baseScore ?? null,
          published: (cve as { published: string }).published,
          cvss: m?.vectorString ?? "—",
          references: ((cve as { references?: { url: string }[] }).references ?? []).slice(0, 4).map((r) => r.url),
        };
      });
      setResults(vulns);
      if (vulns.length === 0) setError(`No CVEs found for "${q}".`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed — the NVD API may be rate-limited.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = results.filter((r) => severityFilter === "ALL" || r.severity === severityFilter);
  const counts = results.reduce<Record<string, number>>((acc, r) => { acc[r.severity] = (acc[r.severity] ?? 0) + 1; return acc; }, {});

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-red/10"><ShieldAlert className="size-8 text-red" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">CVE Vulnerability Scanner</h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
            </div>
            <p className="text-muted-foreground text-base">Search the NVD database (250,000+ CVEs) by product, version, or keyword with CVSS severity scoring.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="Product or keyword (e.g. log4j, apache struts, fortinet ssl vpn)"
                className="pl-10 h-11 font-mono" />
            </div>
            <Button onClick={search} disabled={loading || !query.trim()}
              className="gap-2 h-11 px-6 bg-red hover:bg-red/90 text-white font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldAlert className="size-4" />}
              {loading ? "Searching…" : "Scan CVE DB"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["log4j", "apache struts", "fortinet", "windows smb", "pulse secure", "wordpress"].map((s) => (
              <button key={s} onClick={() => setQuery(s)}
                className="px-2.5 py-1 rounded text-[10px] font-mono bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50 hover:text-foreground transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red/10 border border-red/20 text-sm text-red">{error}</div>
        )}

        {results.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button onClick={() => setSeverityFilter("ALL")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${severityFilter === "ALL" ? "bg-foreground/10 text-foreground border border-border" : "bg-muted/30 text-muted-foreground border border-border/50"}`}>
                All ({results.length})
              </button>
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].filter((s) => counts[s]).map((s) => (
                <button key={s} onClick={() => setSeverityFilter(s === severityFilter ? "ALL" : s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${severityFilter === s ? SEVERITY_CLS[s] : "bg-muted/30 text-muted-foreground border-border/50"}`}>
                  {s} ({counts[s]})
                </button>
              ))}
              <span className="ml-auto text-[11px] text-muted-foreground">for “{lastQuery}”</span>
            </div>

            <div className="space-y-3">
              {filtered.map((c) => {
                const isOpen = expanded === c.id;
                return (
                  <div key={c.id} className="glass-card rounded-xl overflow-hidden border border-border/30">
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className={`text-[10px] shrink-0 mt-0.5 ${SEVERITY_CLS[c.severity] ?? SEVERITY_CLS.NONE}`}>
                          {c.severity} {c.score !== null && `· ${c.score}`}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-sm font-mono font-semibold text-cyan">{c.id}</code>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(c.published).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                            {c.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => copy(c.id)} className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors" title="Copy ID">
                            {copied === c.id ? <Check className="size-3.5 text-emerald" /> : <Copy className="size-3.5" />}
                          </button>
                          <button onClick={() => setExpanded(isOpen ? null : c.id)} className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors">
                            {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-border/30 pt-4 space-y-3">
                        <p className="text-xs leading-relaxed">{c.description}</p>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CVSS Vector</div>
                          <code className="text-[11px] font-mono text-amber break-all">{c.cvss}</code>
                        </div>
                        {c.references.length > 0 && (
                          <div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">References</div>
                            <div className="space-y-1">
                              {c.references.map((r) => (
                                <a key={r} href={r} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[11px] text-cyan hover:underline break-all">
                                  <ExternalLink className="size-3 shrink-0" /> {r}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        <a href={`https://nvd.nist.gov/vuln/detail/${c.id}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-cyan hover:underline">
                          <ExternalLink className="size-3" /> Full NVD entry
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!results.length && !loading && !error && (
          <div className="glass-card rounded-2xl p-10 text-center">
            <ShieldAlert className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Search the National Vulnerability Database for known CVEs affecting a product.</p>
            <p className="text-xs text-muted-foreground mt-1">Data source: NVD API 2.0 via CORS proxy.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
