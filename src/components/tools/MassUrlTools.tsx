import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Link, FileCode, Mail, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs h-7">
      {copied ? <><Check className="size-3 text-emerald" />Copied!</> : <><Copy className="size-3" />Copy</>}
    </Button>
  );
}

function downloadTxt(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ToolShell({ onBack, icon, title, description, color, children }: {
  onBack: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className={`flex size-16 items-center justify-center rounded-2xl shrink-0 bg-${color}/10`}>{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
            </div>
            <p className="text-muted-foreground text-base">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

const parseLines = (raw: string) => raw.split("\n").map((l) => l.trim()).filter(Boolean);

/* ── Mass Add HTTP/S ── */
export function MassAddHttp({ onBack }: { onBack: () => void }) {
  const [input, setInput] = useState("");
  const [protocol, setProtocol] = useState<"https" | "http" | "both">("https");
  const [mode, setMode] = useState<"add" | "strip" | "upgrade">("add");
  const [value, setValue] = useState("");

  const process = () => {
    const lines = parseLines(input);
    const out = lines.map((line) => {
      let v = line;
      if (mode === "add") {
        if (/^https?:\/\//i.test(v)) return v;
        return `${protocol === "both" ? "https" : protocol}://${v.replace(/^\/+/, "")}`;
      }
      if (mode === "strip") {
        return v.replace(/^https?:\/\//i, "").replace(/^\/+/, "");
      }
      // upgrade: http -> https
      if (/^http:\/\//i.test(v)) return v.replace(/^http:/i, "https:");
      if (/^\/\//.test(v)) return `https:${v}`;
      if (!/^https?:\/\//i.test(v)) return `https://${v.replace(/^\/+/, "")}`;
      return v;
    });
    setValue(out.join("\n"));
  };

  return (
    <ToolShell onBack={onBack} icon={<Link className="size-8 text-cyan" />} color="cyan"
      title="Mass Add HTTP/S" description="Add, strip, or upgrade URL protocols across a list of domains in bulk.">
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {([["add", "Add Protocol"], ["strip", "Strip Protocol"], ["upgrade", "HTTP → HTTPS"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === id ? "bg-cyan/10 text-cyan border border-cyan/30" : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"}`}>
              {label}
            </button>
          ))}
          {mode === "add" && (
            <>
              <div className="h-6 w-px bg-border" />
              {(["https", "http", "both"] as const).map((p) => (
                <button key={p} onClick={() => setProtocol(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${protocol === p ? "bg-amber/10 text-amber border border-amber/30" : "bg-muted/30 text-muted-foreground border border-border/50"}`}>
                  {p}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Input (one per line)</label>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10}
              placeholder={"example.com\nwww.site.org\nhttp://legacy.net"} className="font-mono text-sm bg-muted/30 border-border/50" />
            <div className="text-[10px] text-muted-foreground mt-1">{parseLines(input).length} lines</div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Output</label>
            <Textarea readOnly value={value} rows={10} placeholder="Output appears here..." className="font-mono text-sm bg-muted/30 border-border/50" />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">{parseLines(value).length} lines</span>
              {value && <div className="flex gap-2"><CopyButton text={value} />
                <Button variant="ghost" size="sm" onClick={() => downloadTxt(value, "urls.txt")} className="gap-1 text-xs h-7"><Download className="size-3" />.txt</Button></div>}
            </div>
          </div>
        </div>

        <Button onClick={process} disabled={!input.trim()} className="mt-4 gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold">
          <Link className="size-4" /> Process {parseLines(input).length} URLs
        </Button>
      </div>
    </ToolShell>
  );
}

/* ── Mass Add File Name ── */
export function MassAddFileName({ onBack }: { onBack: () => void }) {
  const [input, setInput] = useState("");
  const [filename, setFilename] = useState("index.php");
  const [position, setPosition] = useState<"append" | "prepend" | "replace">("append");
  const [value, setValue] = useState("");

  const process = () => {
    const lines = parseLines(input);
    const fn = filename.replace(/^\/+/, "");
    const out = lines.map((line) => {
      let base = line.replace(/\/+$/, "");
      if (position === "append") return `${base}/${fn}`;
      if (position === "prepend") return `${fn}/${base}`;
      // replace trailing segment
      return `${base.replace(/\/[^/]*$/, "")}/${fn}`;
    });
    setValue(out.join("\n"));
  };

  return (
    <ToolShell onBack={onBack} icon={<FileCode className="size-8 text-purple" />} color="purple"
      title="Mass Add File Name" description="Append, prepend, or replace filenames across a list of URLs or directories.">
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-2">
            {([["append", "Append"], ["prepend", "Prepend"], ["replace", "Replace Last Segment"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setPosition(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${position === id ? "bg-purple/10 text-purple border border-purple/30" : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Filename</label>
            <Input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="index.php"
              className="w-48 h-8 text-xs font-mono" />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {["index.php", "shell.php", "config.php", "wp-login.php", "admin.php", ".env", "backup.sql"].map((f) => (
            <button key={f} onClick={() => setFilename(f)}
              className="px-2.5 py-1 rounded text-[10px] font-mono bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50 hover:text-foreground transition-all">
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Input URLs (one per line)</label>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10}
              placeholder={"https://site.com/\nhttps://site.com/blog\nhttps://site.com/admin"} className="font-mono text-sm bg-muted/30 border-border/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Output</label>
            <Textarea readOnly value={value} rows={10} placeholder="Output appears here..." className="font-mono text-sm bg-muted/30 border-border/50" />
            <div className="flex items-center justify-end mt-1">
              {value && <div className="flex gap-2"><CopyButton text={value} />
                <Button variant="ghost" size="sm" onClick={() => downloadTxt(value, "filenames.txt")} className="gap-1 text-xs h-7"><Download className="size-3" />.txt</Button></div>}
            </div>
          </div>
        </div>

        <Button onClick={process} disabled={!input.trim() || !filename.trim()} className="mt-4 gap-2 bg-purple hover:bg-purple/90 text-black font-semibold">
          <FileCode className="size-4" /> Generate
        </Button>
      </div>
    </ToolShell>
  );
}

/* ── Mass Add Subdomain Mail ── */
export function MassAddSubdomainMail({ onBack }: { onBack: () => void }) {
  const [input, setInput] = useState("");
  const [subdomain, setSubdomain] = useState("mail");
  const [mode, setMode] = useState<"add" | "strip" | "custom">("add");
  const [customSub, setCustomSub] = useState("");
  const [value, setValue] = useState("");

  const process = () => {
    const lines = parseLines(input);
    const out = lines.map((line) => {
      let host = line.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^\.+/, "");
      if (mode === "add") {
        if (/^([a-z0-9-]+\.)+/i.test(host.split(".").slice(0, -2).join("."))) return host; // already has subdomain
        return `${subdomain}.${host}`;
      }
      if (mode === "strip") {
        const parts = host.split(".");
        return parts.length > 2 ? parts.slice(1).join(".") : host;
      }
      // custom: replace first label
      const parts = host.split(".");
      if (parts.length > 2) return [customSub, ...parts.slice(1)].join(".");
      return `${customSub}.${host}`;
    });
    setValue([...new Set(out)].join("\n"));
  };

  return (
    <ToolShell onBack={onBack} icon={<Mail className="size-8 text-emerald" />} color="emerald"
      title="Mass Add Subdomain Mail" description="Add or remove subdomains (mail, webmail, cpanel) across a domain list.">
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {([["add", "Add Subdomain"], ["strip", "Strip Subdomain"], ["custom", "Replace First Label"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setMode(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === id ? "bg-emerald/10 text-emerald border border-emerald/30" : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {mode === "add" ? (
            <>
              <div className="flex gap-1.5">
                {["mail", "webmail", "cpanel", "smtp", "imap", "mx", "remote"].map((s) => (
                  <button key={s} onClick={() => setSubdomain(s)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${subdomain === s ? "bg-emerald/10 text-emerald border border-emerald/30" : "bg-muted/30 text-muted-foreground border border-border/50"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <Input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="custom" className="w-36 h-8 text-xs font-mono" />
            </>
          ) : mode === "custom" ? (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">New label</label>
              <Input value={customSub} onChange={(e) => setCustomSub(e.target.value)} placeholder="webmail" className="w-40 h-8 text-xs font-mono" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Removes the first label: <code className="text-emerald">mail.site.com</code> → <code className="text-foreground">site.com</code></p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Domains (one per line)</label>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10}
              placeholder={"site.com\nexample.org\ntest.net"} className="font-mono text-sm bg-muted/30 border-border/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Output (deduplicated)</label>
            <Textarea readOnly value={value} rows={10} placeholder="Output appears here..." className="font-mono text-sm bg-muted/30 border-border/50" />
            <div className="flex items-center justify-end mt-1">
              {value && <div className="flex gap-2"><CopyButton text={value} />
                <Button variant="ghost" size="sm" onClick={() => downloadTxt(value, "subdomains.txt")} className="gap-1 text-xs h-7"><Download className="size-3" />.txt</Button></div>}
            </div>
          </div>
        </div>

        <Button onClick={process} disabled={!input.trim()} className="mt-4 gap-2 bg-emerald hover:bg-emerald/90 text-black font-semibold">
          <Mail className="size-4" /> Generate
        </Button>
      </div>
    </ToolShell>
  );
}
