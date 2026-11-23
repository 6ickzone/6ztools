import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-cyan transition-colors">
      {copied ? <Check className="size-3.5 text-emerald" /> : <Copy className="size-3.5" />}
    </button>
  );
}

const DORK_CATEGORIES = [
  { category: "Sensitive Files", color: "#ef4444", dorks: [
    { dork: "filename:.env", desc: "Environment files with secrets", severity: "critical" },
    { dork: "filename:.env.production", desc: "Production env files", severity: "critical" },
    { dork: "filename:.htpasswd", desc: "htpasswd files with credentials", severity: "critical" },
    { dork: "filename:id_rsa", desc: "SSH private keys", severity: "critical" },
    { dork: "filename:docker-compose.yml", desc: "Docker configs", severity: "high" },
    { dork: "filename:wp-config.php", desc: "WordPress config with DB creds", severity: "critical" },
    { dork: "filename:config.php", desc: "PHP config files", severity: "high" },
    { dork: "filename:settings.py", desc: "Django settings", severity: "high" },
    { dork: "filename:database.yml", desc: "Rails database configs", severity: "high" },
    { dork: "filename:web.config", desc: "ASP.NET configs", severity: "medium" },
  ]},
  { category: "Cloud & API Keys", color: "#8b5cf6", dorks: [
    { dork: "filename:.aws/credentials", desc: "AWS credentials", severity: "critical" },
    { dork: "filename:service-account-key.json", desc: "GCP service accounts", severity: "critical" },
    { dork: "AKIA", desc: "AWS access key IDs", severity: "critical" },
    { dork: "filename:.npmrc _auth", desc: "NPM auth tokens", severity: "critical" },
    { dork: "filename:.pypirc", desc: "PyPI tokens", severity: "high" },
    { dork: "filename:credentials.json", desc: "Google OAuth credentials", severity: "high" },
    { dork: "filename:.ssh/id_rsa", desc: "SSH keys in home dirs", severity: "critical" },
    { dork: "github_token", desc: "GitHub tokens in code", severity: "critical" },
    { dork: "filename:.netrc", desc: "Netrc auth files", severity: "high" },
    { dork: "filename:passwd /etc/shadow", desc: "Shadow files", severity: "critical" },
  ]},
  { category: "Database Leaks", color: "#06b6d4", dorks: [
    { dork: "filename:dump.sql", desc: "SQL dumps", severity: "high" },
    { dork: "filename:backup.sql", desc: "SQL backups", severity: "high" },
    { dork: "filename:db.sqlite3", desc: "SQLite databases", severity: "medium" },
    { dork: "extension:sql", desc: "All SQL files", severity: "medium" },
    { dork: "filename:mongo.dump", desc: "MongoDB dumps", severity: "high" },
    { dork: "redis filename:dump.rdb", desc: "Redis dumps", severity: "high" },
  ]},
  { category: "Secrets & Tokens", color: "#f59e0b", dorks: [
    { dork: "password =\"", desc: "Hardcoded passwords", severity: "critical" },
    { dork: "secret_key =", desc: "Secret keys in code", severity: "critical" },
    { dork: "api_key =", desc: "API keys in code", severity: "high" },
    { dork: "PRIVATE KEY-----", desc: "Private key headers", severity: "critical" },
    { dork: "BEGIN RSA PRIVATE KEY", desc: "RSA private keys", severity: "critical" },
    { dork: "token: ", desc: "Token assignments", severity: "high" },
    { dork: "jdbc:mysql://", desc: "MySQL connection strings", severity: "high" },
    { dork: "mongodb+srv://", desc: "MongoDB connection strings", severity: "high" },
  ]},
  { category: "Server Config", color: "#22c55e", dorks: [
    { dork: "filename:.htaccess", desc: "Apache .htaccess", severity: "medium" },
    { dork: "filename:server-status", desc: "Apache server status", severity: "medium" },
    { dork: "filename:phpinfo.php", desc: "PHP info pages", severity: "medium" },
    { dork: "filename:debug.log", desc: "Debug log files", severity: "high" },
    { dork: "filename:error.log", desc: "Error log files", severity: "medium" },
    { dork: "filename:.git/config", desc: "Exposed Git configs", severity: "high" },
    { dork: "filename:.DS_Store", desc: "DS_Store files", severity: "low" },
  ]},
  { category: "Custom Dork Builder", color: "#8b5cf6", dorks: [] },
];

function buildGitHubUrl(dork: string, target?: string): string {
  const query = target ? `${dork} ${target}` : dork;
  return `https://github.com/search?q=${encodeURIComponent(query)}&type=code`;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red/10 text-red border-red/20",
  high: "bg-amber/10 text-amber border-amber/20",
  medium: "bg-cyan/10 text-cyan border-cyan/20",
  low: "bg-emerald/10 text-emerald border-emerald/20",
};

interface GitHubDorkerProps { onBack: () => void; }

export function GitHubDorker({ onBack }: GitHubDorkerProps) {
  const [target, setTarget] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [customDork, setCustomDork] = useState("");

  const currentCategory = DORK_CATEGORIES[selectedCategory];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10"><Search className="size-8 text-purple" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">GitHub Dorker</h1>
            <p className="text-muted-foreground text-base">{DORK_CATEGORIES.reduce((sum, c) => sum + c.dorks.length, 0)} pre-built dork queries across {DORK_CATEGORIES.length} categories for finding exposed secrets and sensitive files on GitHub.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 mb-6">
          <label className="text-sm font-medium mb-2 block">Target (optional)</label>
          <Input placeholder="e.g., org:company or specific repo name" value={target} onChange={(e) => setTarget(e.target.value)} />
          <p className="text-[10px] text-muted-foreground mt-1">Add a target org, repo, or keyword to narrow results.</p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {DORK_CATEGORIES.map((cat, i) => (
            <button key={cat.category} onClick={() => setSelectedCategory(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === i ? "text-white" : "bg-muted/30 text-muted-foreground hover:text-foreground"}`}
              style={selectedCategory === i ? { backgroundColor: cat.color } : {}}>
              {cat.category}
              {cat.dorks.length > 0 && <span className="ml-1 opacity-70">({cat.dorks.length})</span>}
            </button>
          ))}
        </div>

        {/* Custom dork builder */}
        {selectedCategory === DORK_CATEGORIES.length - 1 && (
          <div className="glass-card rounded-2xl p-5 mb-6">
            <label className="text-sm font-medium mb-2 block">Custom Dork</label>
            <div className="flex gap-3">
              <Input placeholder='filename:.env "AWS_SECRET"' value={customDork} onChange={(e) => setCustomDork(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && customDork && window.open(buildGitHubUrl(customDork, target), "_blank")} className="flex-1 font-mono text-sm" />
              <Button onClick={() => customDork && window.open(buildGitHubUrl(customDork, target), "_blank")} disabled={!customDork} className="gap-2 bg-purple hover:bg-purple/90 text-white font-semibold">
                <ExternalLink className="size-4" /> Search
              </Button>
            </div>
          </div>
        )}

        {/* Dorks list */}
        {currentCategory.dorks.length > 0 && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Dork</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Description</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Severity</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr></thead>
              <tbody>
                {currentCategory.dorks.map((dork, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-2.5"><code className="text-xs font-mono text-emerald">{dork.dork}</code></td>
                    <td className="px-5 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{dork.desc}</td>
                    <td className="px-5 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[dork.severity]}`}>{dork.severity.toUpperCase()}</span></td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <CopyButton text={buildGitHubUrl(dork.dork, target)} />
                        <a href={buildGitHubUrl(dork.dork, target)} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan transition-colors"><ExternalLink className="size-3.5" /></a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
