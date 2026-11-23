import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2, Globe, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

interface MetaData {
  title: string;
  description: string;
  keywords: string;
  author: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonical: string;
  robots: string;
  viewport: string;
  charset: string;
  themeColor: string;
  favicons: string[];
  links: Array<{ rel: string; href: string }>;
  scripts: string[];
  canonicalUrl: string;
}

interface MetaDataExtractorProps { onBack: () => void; }

export function MetaDataExtractor({ onBack }: MetaDataExtractorProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MetaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!url.trim()) return;
    const target = url.trim();
    setUrl(target);
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await proxyFetch(target.startsWith("http") ? target : `https://${target}`, { signal: controller.signal });
      clearTimeout(timer);
      const html = await res.text();
      const parsed = new DOMParser().parseFromString(html, "text/html");

      const getMeta = (name: string): string => {
        const el = parsed.querySelector(`meta[name="${name}"], meta[property="${name}"], meta[name="${name.toLowerCase()}"], meta[property="${name.toLowerCase()}"]`);
        return el?.getAttribute("content") || "";
      };

      const links: Array<{ rel: string; href: string }> = [];
      parsed.querySelectorAll("link[href]").forEach((l) => {
        links.push({ rel: l.getAttribute("rel") || "", href: l.getAttribute("href") || "" });
      });

      const favicons = links.filter((l) => l.rel === "icon" || l.rel === "shortcut icon" || l.href.includes("favicon")).map((l) => l.href);
      const scripts = [...new Set([...parsed.querySelectorAll("script[src]")].map((s) => s.getAttribute("src") || ""))].filter(Boolean).slice(0, 20);

      setData({
        title: parsed.querySelector("title")?.textContent || "",
        description: getMeta("description"),
        keywords: getMeta("keywords"),
        author: getMeta("author"),
        ogTitle: getMeta("og:title"),
        ogDescription: getMeta("og:description"),
        ogImage: getMeta("og:image"),
        ogUrl: getMeta("og:url"),
        ogType: getMeta("og:type"),
        twitterCard: getMeta("twitter:card"),
        twitterTitle: getMeta("twitter:title"),
        twitterDescription: getMeta("twitter:description"),
        twitterImage: getMeta("twitter:image"),
        canonical: parsed.querySelector("link[rel='canonical']")?.getAttribute("href") || "",
        robots: getMeta("robots"),
        viewport: getMeta("viewport"),
        charset: parsed.querySelector("meta[charset]")?.getAttribute("charset") || "",
        themeColor: getMeta("theme-color"),
        favicons, links, scripts,
        canonicalUrl: target.startsWith("http") ? target : `https://${target}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract metadata");
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
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10"><FileText className="size-8 text-purple" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Meta Data Extractor</h1>
            <p className="text-muted-foreground text-base">Extract OpenGraph, Twitter Cards, SEO tags, favicons, scripts, and all meta information from any page.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleExtract()} className="pl-10" disabled={loading} />
            </div>
            <Button onClick={handleExtract} disabled={loading || !url.trim()} className="gap-2 bg-purple hover:bg-purple/90 text-white font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              {loading ? "Extracting..." : "Extract"}
            </Button>
          </div>
        </div>
        {error && <div className="glass-card rounded-xl p-4 border border-red/20 mb-6"><p className="text-sm text-red">{error}</p></div>}
        {data && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Basic SEO */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">🔍 Basic SEO</h3>
              <div className="space-y-2">
                {[
                  { label: "Title", value: data.title },
                  { label: "Description", value: data.description },
                  { label: "Keywords", value: data.keywords },
                  { label: "Author", value: data.author },
                  { label: "Canonical", value: data.canonical },
                  { label: "Robots", value: data.robots },
                  { label: "Charset", value: data.charset },
                  { label: "Viewport", value: data.viewport },
                  { label: "Theme Color", value: data.themeColor },
                ].filter((f) => f.value).map((f) => (
                  <div key={f.label} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">{f.label}</span>
                    <span className="text-sm text-right flex-1 truncate ml-4" title={f.value}>{f.value}</span>
                    <CopyButton text={f.value} />
                  </div>
                ))}
              </div>
            </div>
            {/* OpenGraph */}
            {(data.ogTitle || data.ogDescription || data.ogImage) && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">📱 OpenGraph</h3>
                <div className="space-y-2">
                  {[
                    { label: "og:title", value: data.ogTitle },
                    { label: "og:description", value: data.ogDescription },
                    { label: "og:image", value: data.ogImage },
                    { label: "og:url", value: data.ogUrl },
                    { label: "og:type", value: data.ogType },
                  ].filter((f) => f.value).map((f) => (
                    <div key={f.label} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                      <span className="text-xs text-cyan font-mono w-28 shrink-0">{f.label}</span>
                      <span className="text-sm text-right flex-1 truncate ml-4" title={f.value}>{f.value}</span>
                    </div>
                  ))}
                </div>
                {data.ogImage && <div className="mt-3 rounded-lg overflow-hidden border border-border/50"><img src={data.ogImage} alt="OG Image" className="w-full max-h-48 object-cover" /></div>}
              </div>
            )}
            {/* Twitter Card */}
            {(data.twitterCard || data.twitterTitle) && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-3">🐦 Twitter Card</h3>
                <div className="space-y-2">
                  {[
                    { label: "twitter:card", value: data.twitterCard },
                    { label: "twitter:title", value: data.twitterTitle },
                    { label: "twitter:description", value: data.twitterDescription },
                    { label: "twitter:image", value: data.twitterImage },
                  ].filter((f) => f.value).map((f) => (
                    <div key={f.label} className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                      <span className="text-xs text-purple font-mono w-28 shrink-0">{f.label}</span>
                      <span className="text-sm text-right flex-1 truncate ml-4" title={f.value}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* External Scripts */}
            {data.scripts.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-3">📜 External Scripts ({data.scripts.length})</h3>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {data.scripts.map((src, i) => (
                    <div key={i} className="text-xs font-mono text-muted-foreground bg-muted/20 rounded px-3 py-1.5 break-all truncate" title={src}>{src}</div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
