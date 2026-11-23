import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Loader2, Globe, AlertTriangle, Eye, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { proxyFetch } from "@/lib/proxyFetch";

interface Finding {
  pattern: string;
  matches: string[];
  category: string;
  severity: "critical" | "high" | "medium" | "low";
}

const SENSITIVE_PATTERNS: Array<{ name: string; regex: RegExp; category: string; severity: Finding["severity"] }> = [
  { name: "API Key", regex: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"]([A-Za-z0-9_\-]{16,})['"]/gi, category: "Credentials", severity: "critical" },
  { name: "AWS Access Key", regex: /(?:AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, category: "Cloud Credentials", severity: "critical" },
  { name: "AWS Secret Key", regex: /(?:aws[_-]?secret[_-]?access[_-]?key|secret[_-]?key)\s*[:=]\s*['"]([A-Za-z0-9/+=]{40})['"]/gi, category: "Cloud Credentials", severity: "critical" },
  { name: "GitHub Token", regex: /gh[pousr]_[A-Za-z0-9_]{36,255}/g, category: "API Tokens", severity: "critical" },
  { name: "GitLab Token", regex: /glpat-[A-Za-z0-9\-_]{20,}/g, category: "API Tokens", severity: "critical" },
  { name: "Slack Token", regex: /xox[baprs]-[0-9]{10,}-[a-zA-Z0-9\-]+/g, category: "API Tokens", severity: "critical" },
  { name: "Stripe Key", regex: /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{24,}/g, category: "Payment Keys", severity: "critical" },
  { name: "Private Key", regex: /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/g, category: "Encryption", severity: "critical" },
  { name: "JWT Token", regex: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g, category: "Auth Tokens", severity: "high" },
  { name: "Password in Config", regex: /(?:password|passwd|pwd)\s*[:=]\s*['"]([^'"]{4,})['"]/gi, category: "Credentials", severity: "high" },
  { name: "Database URL", regex: /(?:mysql|postgres|mongodb|redis|sqlite):\/\/[^\s'"]+/gi, category: "Database", severity: "high" },
  { name: "Email Address", regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, category: "PII", severity: "medium" },
  { name: "IP Address", regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, category: "Network", severity: "low" },
  { name: "Phone Number", regex: /(?:\+?[0-9]{1,4}[\s-]?)?(?:\([0-9]{2,4}\)[\s-]?)?[0-9]{3,4}[\s-]?[0-9]{3,4}/g, category: "PII", severity: "medium" },
  { name: "Credit Card", regex: /\b(?:[0-9]{4}[\s-]?){3}[0-9]{4}\b/g, category: "Payment", severity: "critical" },
  { name: "SSN", regex: /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/g, category: "PII", severity: "critical" },
  { name: "Bitcoin Address", regex: /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g, category: "Crypto", severity: "low" },
  { name: "Ethereum Address", regex: /\b0x[0-9a-fA-F]{40}\b/g, category: "Crypto", severity: "low" },
  { name: "SSH Key Fingerprint", regex: /(?:ssh-rsa|ssh-dss|ssh-ed25519|ecdsa-sha2-[0-9]+)\s+[A-Za-z0-9+/=]{40,}/g, category: "Encryption", severity: "high" },
  { name: "Access Token", regex: /(?:access[_-]?token|auth[_-]?token|bearer)\s*[:=]\s*['"]([A-Za-z0-9_\-\.]+)['"]/gi, category: "Auth Tokens", severity: "high" },
  { name: "Google API Key", regex: /AIza[A-Za-z0-9_\-]{35}/g, category: "API Keys", severity: "high" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-cyan transition-colors">
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

const severityColors: Record<string, string> = {
  critical: "bg-red/10 text-red border-red/20",
  high: "bg-amber/10 text-amber border-amber/20",
  medium: "bg-cyan/10 text-cyan border-cyan/20",
  low: "bg-emerald/10 text-emerald border-emerald/20",
};

interface SensitiveDataFinderProps {
  onBack: () => void;
}

export function SensitiveDataFinder({ onBack }: SensitiveDataFinderProps) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [htmlSize, setHtmlSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanUrl = (input: string) => {
    let u = input.trim();
    if (!u.startsWith("http")) u = `https://${u}`;
    return u.replace(/\/+$/, "");
  };

  const handleScan = async () => {
    if (!url.trim()) return;
    const target = cleanUrl(url);
    setUrl(target);
    setScanning(true);
    setFindings([]);
    setError(null);
    setHtmlSize(null);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await proxyFetch(target, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) { setError(`HTTP ${res.status}: Could not fetch page content`); setScanning(false); return; }

      const text = await res.text();
      setHtmlSize(`${(text.length / 1024).toFixed(1)} KB`);

      const detected: Finding[] = [];
      const seenMatches = new Set<string>();

      for (const { name, regex, category, severity } of SENSITIVE_PATTERNS) {
        regex.lastIndex = 0;
        const matches: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          const value = match[0].trim();
          if (!seenMatches.has(`${name}:${value}`)) {
            seenMatches.add(`${name}:${value}`);
            matches.push(value);
          }
        }
        if (matches.length > 0) detected.push({ pattern: name, matches, category, severity });
      }

      setFindings(detected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan page");
    }
    setScanning(false);
  };

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10">
            <Eye className="size-8 text-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Sensitive Data Finder</h1>
            <p className="text-muted-foreground text-base">Scans page source for {SENSITIVE_PATTERNS.length} patterns including API keys, tokens, credentials, PII, and private keys.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <label className="text-sm font-medium mb-3 block">Target URL</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()} className="pl-10" disabled={scanning} />
            </div>
            <Button onClick={handleScan} disabled={scanning || !url.trim()} className="gap-2 bg-purple hover:bg-purple/90 text-white font-semibold">
              {scanning ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {scanning ? "Scanning..." : "Analyze"}
            </Button>
          </div>
        </div>

        {scanning && (
          <div className="glass-card rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-purple" />
              <div>
                <p className="text-sm font-medium">Scanning page source for sensitive patterns...</p>
                <p className="text-xs text-muted-foreground">Checking {SENSITIVE_PATTERNS.length} patterns including API keys, tokens, credentials, and PII</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-xl p-4 border border-red/20 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-4 text-red shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {findings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Target: <code className="text-purple">{url}</code></span>
              {htmlSize && <span>Page size: {htmlSize}</span>}
              <span>{findings.length} pattern(s) matched</span>
              {criticalCount > 0 && <span className="text-red font-semibold">{criticalCount} CRITICAL</span>}
              {highCount > 0 && <span className="text-amber font-semibold">{highCount} HIGH</span>}
            </div>

            {criticalCount > 0 && (
              <div className="glass-card rounded-xl p-4 border border-red/30 bg-red/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-4 text-red shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red mb-1">Critical Findings Detected</p>
                    <p className="text-xs text-muted-foreground">Exposed credentials and private keys found in page source. Rotate immediately if this is a production environment.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {findings.map((finding) => (
                <div key={finding.pattern} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{finding.pattern}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${severityColors[finding.severity]}`}>
                        {finding.severity.toUpperCase()}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{finding.category}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{finding.matches.length} match(es)</span>
                  </div>
                  <div className="space-y-1">
                    {finding.matches.map((match, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                        <code className="text-xs font-mono break-all flex-1 truncate" title={match}>{match}</code>
                        <CopyButton text={match} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {findings.length === 0 && !scanning && !error && (
          <div className="glass-card rounded-xl p-8 text-center">
            <Eye className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Enter a URL and click Analyze to scan for sensitive data patterns.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Detects: API keys, tokens, passwords, emails, private keys, credit cards, and more.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
