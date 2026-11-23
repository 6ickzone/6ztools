import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Link, Loader2, Globe, Copy, Check, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { proxyFetch } from "@/lib/proxyFetch";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-cyan transition-colors">
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

interface ScrapedLink {
  url: string;
  text: string;
  type: "internal" | "external" | "resource";
}

interface LinkScraperProps { onBack: () => void; }

export function LinkScraper({ onBack }: LinkScraperProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<ScrapedLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "internal" | "external">("all");
  const [scrapedUrl, setScrapedUrl] = useState("");

  const handleScrape = async () => {
    if (!url.trim()) return;
    const target = url.trim();
    setUrl(target);
    setLoading(true);
    setError(null);
    setLinks([]);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await proxyFetch(target, { signal: controller.signal });
      clearTimeout(timer);
      const html = await res.text();
      const baseHost = new URL(target.startsWith("http") ? target : `https://${target}`).hostname;
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const anchors = parsed.querySelectorAll("a[href]");
      const images = parsed.querySelectorAll("img[src]");
      const scripts = parsed.querySelectorAll("script[src]");
      const stylesheets = parsed.querySelectorAll("link[href]");

      const allLinks: ScrapedLink[] = [];
      anchors.forEach((a) => {
        const href = a.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
        const fullUrl = href.startsWith("http") ? href : new URL(href, target).href;
        const isExternal = !new URL(fullUrl).hostname.includes(baseHost);
        allLinks.push({ url: fullUrl, text: a.textContent?.trim() || "(no text)", type: isExternal ? "external" : "internal" });
      });
      images.forEach((img) => {
        const src = img.getAttribute("src");
        if (src && !src.startsWith("data:")) {
          const fullUrl = src.startsWith("http") ? src : new URL(src, target).href;
          allLinks.push({ url: fullUrl, text: "(image)", type: "resource" });
        }
      });
      scripts.forEach((s) => {
        const src = s.getAttribute("src");
        if (src) {
          const fullUrl = src.startsWith("http") ? src : new URL(src, target).href;
          allLinks.push({ url: fullUrl, text: "(script)", type: "resource" });
        }
      });
      stylesheets.forEach((l) => {
        const href = l.getAttribute("href");
        if (href) {
          const fullUrl = href.startsWith("http") ? href : new URL(href, target).href;
          allLinks.push({ url: fullUrl, text: "(stylesheet)", type: "resource" });
        }
      });

      // Deduplicate
      const seen = new Set<string>();
      const unique = allLinks.filter((l) => { if (seen.has(l.url)) return false; seen.add(l.url); return true; });
      setLinks(unique);
      setScrapedUrl(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape page");
    }
    setLoading(false);
  };

  const filtered = filter === "all" ? links : links.filter((l) => l.type === filter);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-amber/10"><Link className="size-8 text-amber" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Link Scraper</h1>
            <p className="text-muted-foreground text-base">Extract all links, images, scripts, and stylesheets from a web page. Classifies as internal/external.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleScrape()} className="pl-10" disabled={loading} />
            </div>
            <Button onClick={handleScrape} disabled={loading || !url.trim()} className="gap-2 bg-amber hover:bg-amber/90 text-black font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Link className="size-4" />}
              {loading ? "Scraping..." : "Scrape"}
            </Button>
          </div>
        </div>
        {error && <div className="glass-card rounded-xl p-4 border border-red/20 mb-6"><p className="text-sm text-red">{error}</p></div>}
        {links.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground">{links.length} links found on <code className="text-amber">{scrapedUrl}</code></span>
              <div className="flex gap-1.5">
                {(["all", "internal", "external"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${filter === f ? "bg-amber text-black" : "bg-muted/30 text-muted-foreground"}`}>
                    {f} ({f === "all" ? links.length : links.filter((l) => l.type === f).length})
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(filtered.map((l) => l.url).join("\n"))} className="text-xs h-6 gap-1"><Copy className="size-3" />Copy All</Button>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card z-10"><tr className="border-b border-border/50">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">URL</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Text</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase"></th>
                  </tr></thead>
                  <tbody>
                    {filtered.map((link, i) => (
                      <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-2.5">
                          <Badge variant="outline" className={`text-[10px] ${link.type === "internal" ? "border-emerald/30 text-emerald" : link.type === "external" ? "border-cyan/30 text-cyan" : "border-amber/30 text-amber"}`}>
                            {link.type}
                          </Badge>
                        </td>
                        <td className="px-5 py-2.5 font-mono text-xs text-emerald break-all max-w-[300px] truncate" title={link.url}>{link.url}</td>
                        <td className="px-5 py-2.5 text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{link.text}</td>
                        <td className="px-5 py-2.5"><div className="flex items-center gap-2"><CopyButton text={link.url} />
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan"><ExternalLink className="size-3" /></a>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
