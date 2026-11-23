import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileSearch, Copy, Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs h-7">
      {copied ? <><Check className="size-3 text-emerald" />Copied!</> : <><Copy className="size-3" />Copy</>}
    </Button>
  );
}

import { proxyFetch } from "@/lib/proxyFetch";

interface WhoisResult {
  raw: string;
  parsed: Record<string, string>;
}

function parseWhois(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = raw.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([^#%][^:]+):\s*(.+)/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      const value = match[2].trim();
      if (!result[key]) result[key] = value;
    }
  }
  return result;
}

const IMPORTANT_KEYS = [
  "domain name", "registrar", "registration date", "updated date", "expiry date",
  "name server", "nameservers", "domain status", "registrant organization",
  "registrant country", "dnssec", "registry domain id",
];

interface WhoisCheckerProps { onBack: () => void; }

export function WhoisChecker({ onBack }: WhoisCheckerProps) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhoisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!domain.trim()) return;
    const target = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    setDomain(target);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?domainName=${target}&outputFormat=json&apiKey=at_demo`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await proxyFetch(url, { signal: controller.signal });
      clearTimeout(timer);
      const text = await res.text();
      if (text.includes("<!doctype") || text.includes("<html")) {
        // Fallback: try rdap
        const rdapUrl = `https://rdap.org/domain/${target}`;
        const rdapRes = await proxyFetch(rdapUrl, { signal: controller.signal });
        const rdapText = await rdapRes.text();
        const parsed = parseWhois(rdapText);
        setResult({ raw: rdapText, parsed });
      } else {
        const json = JSON.parse(text);
        const whoisData = json.WhoisRecord;
        if (whoisData) {
          const parsed: Record<string, string> = {};
          if (whoisData.domainName) parsed["domain name"] = whoisData.domainName;
          if (whoisData.registrar) parsed["registrar"] = whoisData.registrar;
          if (whoisData.createdDate) parsed["registration date"] = whoisData.createdDate;
          if (whoisData.updatedDate) parsed["updated date"] = whoisData.updatedDate;
          if (whoisData.expiresDate) parsed["expiry date"] = whoisData.expiresDate;
          if (whoisData.nameServers) parsed["name servers"] = whoisData.nameServers.join(", ");
          if (whoisData.domainStatus) parsed["domain status"] = whoisData.domainStatus.join(", ");
          if (whoisData.registrant?.organization) parsed["registrant organization"] = whoisData.registrant.organization;
          if (whoisData.registrant?.country) parsed["registrant country"] = whoisData.registrant.country;
          setResult({ raw: JSON.stringify(whoisData, null, 2), parsed });
        } else {
          setError("No WHOIS data returned for this domain.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "WHOIS lookup failed");
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-amber/10">
            <FileSearch className="size-8 text-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Whois Checker</h1>
            <p className="text-muted-foreground text-base">Domain registration details including registrar, dates, nameservers, and status.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleLookup()} className="pl-10" disabled={loading} />
            </div>
            <Button onClick={handleLookup} disabled={loading || !domain.trim()} className="gap-2 bg-amber hover:bg-amber/90 text-black font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Lookup
            </Button>
          </div>
        </div>
        {error && <div className="glass-card rounded-xl p-4 border border-red/20 mb-6"><p className="text-sm text-red">{error}</p></div>}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">WHOIS Information</h3>
                <CopyButton text={result.raw} />
              </div>
              <div className="space-y-2">
                {Object.entries(result.parsed).filter(([k]) => IMPORTANT_KEYS.includes(k)).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                    <span className="text-xs text-muted-foreground capitalize">{key}</span>
                    <span className="text-sm font-medium text-right max-w-[60%] truncate" title={value}>{value}</span>
                  </div>
                ))}
              </div>
              {Object.keys(result.parsed).length > IMPORTANT_KEYS.length && (
                <details className="mt-3">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Show all {Object.keys(result.parsed).length} fields</summary>
                  <div className="space-y-1 mt-2">
                    {Object.entries(result.parsed).filter(([k]) => !IMPORTANT_KEYS.includes(k)).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-muted/10 rounded px-3 py-1.5">
                        <span className="text-[10px] text-muted-foreground">{key}</span>
                        <span className="text-xs font-mono truncate max-w-[60%]" title={value}>{value}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
