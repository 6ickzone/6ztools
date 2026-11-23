import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Loader2,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { proxyFetch } from "@/lib/proxyFetch";

const cmsPatterns: Record<string, { pattern: RegExp; name: string; versionPattern: RegExp; desc: string }> = {
  wordpress: {
    pattern: /wp-content|wp-includes|wordpress|\/wp-json\/|wp-emoji|wp-login|wp-version/i,
    name: "WordPress",
    versionPattern: /wp-version=([0-9.]+)|"WordPress\s+([0-9.]+)"|content="WordPress\s+([0-9.]+)"/i,
    desc: "Most popular CMS — powers 43% of the web",
  },
  joomla: {
    pattern: /joomla|com_content|\/components\/com_|Joomla!|joomla\.org/i,
    name: "Joomla",
    versionPattern: /Joomla!\s+([0-9.]+)|content="Joomla!\s+([0-9.]+)"/i,
    desc: "Open-source CMS with MVC architecture",
  },
  drupal: {
    pattern: /drupal|sites\/all|core\/|Drupal\.settings|drupal\.js|drupal\.min\.js/i,
    name: "Drupal",
    versionPattern: /Drupal\s+([0-9.]+)|content="Drupal\s+([0-9.]+)"/i,
    desc: "Enterprise-grade open-source CMS",
  },
  magento: {
    pattern: /magento|skin\/frontend|Mage\/|magentocommerce|MAGE_CORS/i,
    name: "Magento",
    versionPattern: /Magento\/([0-9.]+)/i,
    desc: "E-commerce platform for online stores",
  },
  laravel: {
    pattern: /laravel|csrf-token|_token|XSRF-TOKEN|laravel_session|laravel\/framework/i,
    name: "Laravel",
    versionPattern: /Laravel\s+v([0-9.]+)/i,
    desc: "PHP web application framework",
  },
  codeigniter: {
    pattern: /ci_session|CodeIgniter|\/system\/core/i,
    name: "CodeIgniter",
    versionPattern: /CodeIgniter\s+v([0-9.]+)/i,
    desc: "Lightweight PHP MVC framework",
  },
  shopify: {
    pattern: /shopify|cdn\.shopify\.com|Shopify\.theme/i,
    name: "Shopify",
    versionPattern: /Shopify\s+([0-9.]+)/i,
    desc: "Hosted e-commerce platform",
  },
  wix: {
    pattern: /wix\.com|wixstatic|static\.wixstatic|wix\.com\/ugc/i,
    name: "Wix",
    versionPattern: /Wix\s+([0-9.]+)/i,
    desc: "Website builder with drag-and-drop",
  },
  squarespace: {
    pattern: /squarespace|static\.squarespace|squarespace\.com/i,
    name: "Squarespace",
    versionPattern: /Squarespace\s+([0-9.]+)/i,
    desc: "Website builder and hosting platform",
  },
  prestashop: {
    pattern: /prestashop|psthemes|\/presta\/|prestashop\.com/i,
    name: "PrestaShop",
    versionPattern: /PrestaShop\s+([0-9.]+)/i,
    desc: "Open-source e-commerce solution",
  },
  opencart: {
    pattern: /opencart|route=common|\/catalog\/view/i,
    name: "OpenCart",
    versionPattern: /OpenCart\s+([0-9.]+)/i,
    desc: "PHP-based e-commerce platform",
  },
  typo3: {
    pattern: /typo3|t3-|TYPO3|typo3\.org/i,
    name: "Typo3",
    versionPattern: /TYPO3\s+([0-9.]+)/i,
    desc: "Enterprise open-source CMS",
  },
};

interface ScanResult {
  cms: string;
  name: string;
  confidence: number;
  version: string;
  detected: boolean;
  desc: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-xs text-muted-foreground hover:text-cyan transition-colors"
    >
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

interface CmsScannerProps {
  onBack: () => void;
}

export function CmsScanner({ onBack }: CmsScannerProps) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanTime, setScanTime] = useState<number | null>(null);
  const [htmlLength, setHtmlLength] = useState<number | null>(null);

  const handleScan = async () => {
    if (!url.trim()) return;
    const target = url.startsWith("http") ? url : `https://${url}`;
    setUrl(target);
    setScanning(true);
    setResults(null);
    setError(null);
    setHtmlLength(null);
    const startTime = Date.now();

    try {
      const response = await proxyFetch(target);

      // A 403/404/500 from the target still returns a fingerprintable body — only
      // a proxy-level failure means there is nothing to analyse.
      if (!response.ok && response.headers.get("x-proxy-error")) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      setHtmlLength(html.length);
      setScanTime(Date.now() - startTime);

      const detected: ScanResult[] = [];

      for (const [key, cms] of Object.entries(cmsPatterns)) {
        const allMatches = html.match(new RegExp(cms.pattern.source, "gi"));
        const matchCount = allMatches ? allMatches.length : 0;
        const confidence = Math.min(matchCount * 20, 100);

        let version = "Unknown";
        const versionMatch = html.match(cms.versionPattern);
        if (versionMatch) {
          version = versionMatch[1] || versionMatch[2] || versionMatch[3] || "Unknown";
        }

        detected.push({
          cms: key,
          name: cms.name,
          confidence,
          version,
          detected: confidence > 0,
          desc: cms.desc,
        });
      }

      // Sort: detected first, then by confidence
      detected.sort((a, b) => {
        if (a.detected !== b.detected) return a.detected ? -1 : 1;
        return b.confidence - a.confidence;
      });

      setResults(detected);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch target. The site may block proxy requests or is unreachable."
      );
      setScanTime(Date.now() - startTime);
    } finally {
      setScanning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10">
            <Globe className="size-8 text-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              CMS Scanner
            </h1>
            <p className="text-muted-foreground text-base">
              Fetches the target's HTML source and runs regex fingerprinting to
              detect CMS platform, version, and technology stack.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <label className="text-sm font-medium mb-3 block">Target URL</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                className="pl-10"
                disabled={scanning}
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={scanning || !url.trim()}
              className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold"
            >
              {scanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {scanning ? "Scanning..." : "Scan"}
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card rounded-xl p-4 border border-red/20 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="size-4 text-red shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red">Scan Failed</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Scan Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>
                Target: <code className="text-cyan">{url}</code>
              </span>
              {scanTime && <span>Scan time: {scanTime}ms</span>}
              {htmlLength !== null && (
                <span>
                  HTML size: {htmlLength.toLocaleString()} chars
                </span>
              )}
              <span>Patterns: {Object.keys(cmsPatterns).length}</span>
              <CopyButton text={url} />
            </div>

            {/* Detected CMS */}
            {results.filter((r) => r.detected).length > 0 ? (
              <div className="glass-card rounded-2xl p-5 border border-emerald/20">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="size-4 text-emerald" />
                  Detected CMS — {results.filter((r) => r.detected).length} match
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results
                    .filter((r) => r.detected)
                    .map((r) => (
                      <div
                        key={r.cms}
                        className="bg-emerald/5 rounded-lg p-4 border border-emerald/20"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{r.name}</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-emerald/40 text-emerald"
                          >
                            {r.confidence}% confidence
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mb-2">
                          {r.desc}
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground">Version:</span>
                          <code className="text-cyan font-mono">{r.version}</code>
                          <CopyButton text={r.version} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-5 border border-amber/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="size-4 text-amber" />
                  <h3 className="text-sm font-semibold">No CMS Detected</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  No known CMS patterns were found in the HTML source. The target
                  may use a custom framework, static site generator, or have
                  stripped CMS fingerprinting markers.
                </p>
              </div>
            )}

            {/* All Patterns Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50">
                <h3 className="text-sm font-semibold">All CMS Patterns — Full Scan</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        CMS
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        Confidence
                      </th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                        Version
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr
                        key={r.cms}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-2.5">
                          <div className="font-medium">{r.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {r.desc}
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                          {r.detected ? (
                            <span className="flex items-center gap-1.5 text-emerald text-xs font-medium">
                              <CheckCircle className="size-3" />
                              Detected
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <XCircle className="size-3" />
                              Not Found
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${r.confidence}%`,
                                  backgroundColor:
                                    r.confidence >= 80
                                      ? "#22c55e"
                                      : r.confidence >= 40
                                        ? "#f59e0b"
                                        : r.confidence > 0
                                          ? "#06b6d4"
                                          : "#334155",
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10">
                              {r.confidence}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-muted-foreground font-mono">
                          {r.version}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rescan */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleScan}
                disabled={scanning}
                className="gap-2"
              >
                <RefreshCw className="size-3" />
                Rescan
              </Button>
            </div>
          </motion.div>
        )}

        {/* Info Note */}
        <div className="glass-card rounded-xl p-4 border border-amber/20 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> The scanner
              fetches the target's HTML via a CORS proxy, then runs 12 CMS regex
              patterns against the source. Confidence increases with more matches (20%
              per match, max 100%). Version is extracted from meta tags and inline
              scripts.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
