import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, ExternalLink, Copy, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Platform {
  name: string;
  color: string;
  buildUrl: (u: string) => string;
  directUrl?: (u: string) => string;
  category: "social" | "dev" | "crypto" | "forum";
}

const PLATFORMS: Platform[] = [
  { name: "Twitter / X", color: "#1DA1F2", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:twitter.com "${u}"`)}`, directUrl: (u) => `https://x.com/${u}` },
  { name: "Instagram", color: "#E4405F", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${u}"`)}`, directUrl: (u) => `https://www.instagram.com/${u}` },
  { name: "Facebook", color: "#1877F2", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:facebook.com "${u}"`)}`, directUrl: (u) => `https://www.facebook.com/${u}` },
  { name: "TikTok", color: "#000000", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:tiktok.com "${u}"`)}`, directUrl: (u) => `https://www.tiktok.com/@${u}` },
  { name: "LinkedIn", color: "#0A66C2", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${u}"`)}` },
  { name: "Reddit", color: "#FF4500", category: "forum", buildUrl: (u) => `https://www.reddit.com/search/?q=${encodeURIComponent(u)}`, directUrl: (u) => `https://www.reddit.com/user/${u}` },
  { name: "Pinterest", color: "#BD081C", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:pinterest.com "${u}"`)}` },
  { name: "Snapchat", color: "#FFFC00", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:snapchat.com/add "${u}"`)}` },
  { name: "YouTube", color: "#FF0000", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:youtube.com "${u}"`)}` },
  { name: "Twitch", color: "#9146FF", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:twitch.tv "${u}"`)}`, directUrl: (u) => `https://www.twitch.tv/${u}` },
  { name: "GitHub", color: "#8b5cf6", category: "dev", buildUrl: (u) => `https://github.com/search?q=${encodeURIComponent(u)}&type=users`, directUrl: (u) => `https://github.com/${u}` },
  { name: "GitLab", color: "#FC6D26", category: "dev", buildUrl: (u) => `https://gitlab.com/search?search=${encodeURIComponent(u)}` },
  { name: "Stack Overflow", color: "#F48024", category: "dev", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:stackoverflow.com/users "${u}"`)}` },
  { name: "HackerOne", color: "#494649", category: "dev", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:hackerone.com "${u}"`)}` },
  { name: "Keybase", color: "#33a0ff", category: "dev", buildUrl: (u) => `https://keybase.io/${u}` },
  { name: "Steam", color: "#66C0F4", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:steamcommunity.com "${u}"`)}` },
  { name: "Medium", color: "#00AB6C", category: "forum", buildUrl: (u) => `https://medium.com/search?q=${encodeURIComponent(u)}` },
  { name: "Quora", color: "#B92B27", category: "forum", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:quora.com "${u}"`)}` },
  { name: "Telegram", color: "#26A5E4", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:t.me "${u}"`)}`, directUrl: (u) => `https://t.me/${u}` },
  { name: "Mastodon", color: "#6364FF", category: "social", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:mastodon.social "${u}"`)}` },
  { name: "Pastebin", color: "#2965B1", category: "forum", buildUrl: (u) => `https://www.google.com/search?q=${encodeURIComponent(`site:pastebin.com "${u}"`)}` },
  { name: "About.me", color: "#00A98F", category: "social", buildUrl: (u) => `https://about.me/${u}` },
  { name: "Ethereum ENS", color: "#f59e0b", category: "crypto", buildUrl: (u) => `https://app.ens.domains/${u}.eth` },
  { name: "Keyoxide", color: "#22c55e", category: "crypto", buildUrl: (u) => `https://keyoxide.org/${u}` },
];

const CATEGORIES = [
  { id: "all", label: "All Platforms" },
  { id: "social", label: "Social" },
  { id: "dev", label: "Developer" },
  { id: "crypto", label: "Crypto" },
  { id: "forum", label: "Forums" },
] as const;

export function SocialMediaSearch({ onBack }: { onBack: () => void }) {
  const [username, setUsername] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const search = () => {
    if (!username.trim()) return;
    setQuery(username.trim().replace(/^@/, ""));
  };

  const filtered = PLATFORMS.filter((p) => category === "all" || p.category === category);

  const copyUrl = (url: string, idx: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyAll = () => {
    if (!query) return;
    const all = filtered.map((p) => `${p.name}: ${p.buildUrl(query)}`).join("\n");
    navigator.clipboard.writeText(all);
    setCopiedIdx(-1);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-amber/10"><Users className="size-8 text-amber" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Social Media Search</h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
            </div>
            <p className="text-muted-foreground text-base">Cross-platform username OSINT — search 24 platforms including social, developer, and crypto services.</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={username} onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="Enter username (e.g. johndoe or @johndoe)"
                className="pl-10 h-11" />
            </div>
            <Button onClick={search} disabled={!username.trim()} className="gap-2 bg-amber hover:bg-amber/90 text-black font-semibold h-11 px-6">
              <Search className="size-4" /> Search
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category === c.id ? "bg-amber/10 text-amber border border-amber/30" : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"}`}>
                {c.label}
              </button>
            ))}
            {query && (
              <Button variant="ghost" size="sm" onClick={copyAll} className="gap-1 text-xs h-7 ml-auto">
                {copiedIdx === -1 ? <><Check className="size-3 text-emerald" />Copied All</> : <><Copy className="size-3" />Copy All URLs</>}
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {query ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p, i) => {
              const searchUrl = p.buildUrl(query);
              const direct = p.directUrl?.(query);
              return (
                <motion.div key={p.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-xl p-4 border border-border/30 hover:border-amber/20 transition-all group">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="size-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{p.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={searchUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all">
                      <Search className="size-3" /> Search
                    </a>
                    {direct && (
                      <a href={direct} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber/10 border border-amber/30 text-xs text-amber hover:bg-amber/20 transition-all">
                        <ExternalLink className="size-3" /> Visit
                      </a>
                    )}
                    <button onClick={() => copyUrl(searchUrl, i)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                      {copiedIdx === i ? <Check className="size-3.5 text-emerald" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-10 text-center">
            <Users className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Enter a username to search across {PLATFORMS.length} platforms.</p>
            <p className="text-xs text-muted-foreground mt-1">Results open in a new tab — nothing is tracked or stored.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
