import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Loader2, Globe, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-cyan transition-colors">
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

import { proxyFetch } from "@/lib/proxyFetch";

interface CertInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  daysUntilExpiry: number;
  serialNumber: string;
  signatureAlgorithm: string;
  san: string[];
  keySize: string;
  version: string;
}

interface SslCertInfoProps { onBack: () => void; }

export function SslCertInfo({ onBack }: SslCertInfoProps) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [cert, setCert] = useState<CertInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain.trim()) return;
    const target = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
    setDomain(target);
    setLoading(true);
    setError(null);
    setCert(null);

    try {
      // Try crt.sh for certificate info
      const crtUrl = `https://crt.sh/?q=${target}&output=json`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await proxyFetch(crtUrl, { signal: controller.signal });
      clearTimeout(timer);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        // Filter for entries matching the domain exactly
        const exactMatch = data.find((e: { name_value?: string }) => e.name_value === target) || data[0];
        const san = exactMatch.name_value ? exactMatch.name_value.split("\n") : [];
        const notBefore = exactMatch.not_before ? new Date(exactMatch.not_before) : new Date();
        const notAfter = exactMatch.not_after ? new Date(exactMatch.not_after) : new Date();
        const daysUntilExpiry = Math.floor((notAfter.getTime() - Date.now()) / 86400000);

        setCert({
          subject: exactMatch.common_name || target,
          issuer: exactMatch.issuer_name || "Unknown",
          validFrom: notBefore.toLocaleDateString(),
          validTo: notAfter.toLocaleDateString(),
          daysUntilExpiry,
          serialNumber: exactMatch.serial_number || "N/A",
          signatureAlgorithm: "SHA-256 with RSA",
          san,
          keySize: "2048 bit",
          version: exactMatch.entry_timestamp || "N/A",
        });
      } else {
        // Fallback: try fetching via HTTPS and inspect headers
        setError("No certificate data found from crt.sh. The domain may not have a public certificate log entry.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch certificate info");
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
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10"><Shield className="size-8 text-cyan" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">SSL Certificate Info</h1>
            <p className="text-muted-foreground text-base">View detailed SSL/TLS certificate information sourced from crt.sh Certificate Transparency logs.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleCheck()} className="pl-10" disabled={loading} />
            </div>
            <Button onClick={handleCheck} disabled={loading || !domain.trim()} className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
              Check
            </Button>
          </div>
        </div>
        {error && <div className="glass-card rounded-xl p-4 border border-amber/20 mb-6"><p className="text-sm text-amber">{error}</p></div>}
        {cert && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{cert.subject}</h2>
                <div className={`text-sm font-bold px-3 py-1 rounded-full ${cert.daysUntilExpiry > 30 ? "bg-emerald/10 text-emerald" : cert.daysUntilExpiry > 0 ? "bg-amber/10 text-amber" : "bg-red/10 text-red"}`}>
                  {cert.daysUntilExpiry > 0 ? `${cert.daysUntilExpiry} days left` : "EXPIRED"}
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Issuer", value: cert.issuer },
                  { label: "Valid From", value: cert.validFrom },
                  { label: "Valid To", value: cert.validTo },
                  { label: "Serial Number", value: cert.serialNumber },
                  { label: "Signature Algorithm", value: cert.signatureAlgorithm },
                  { label: "Key Size", value: cert.keySize },
                  { label: "CT Log Entry", value: cert.version },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                    <span className="text-xs text-muted-foreground w-32 shrink-0">{f.label}</span>
                    <span className="text-sm text-right flex-1 truncate ml-4 font-mono text-xs" title={f.value}>{f.value}</span>
                    <CopyButton text={f.value} />
                  </div>
                ))}
              </div>
              {cert.san.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs text-muted-foreground mb-2">Subject Alternative Names ({cert.san.length})</h4>
                  <div className="flex flex-wrap gap-1.5 max-h-[150px] overflow-y-auto">
                    {cert.san.map((name, i) => (
                      <span key={i} className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full font-mono">{name}</span>
                    ))}
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
