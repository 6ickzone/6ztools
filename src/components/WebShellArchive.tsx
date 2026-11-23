import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  AlertTriangle,
  Key,
  FileCode,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const shells = [
  { id: 1, name: "Yurai1337", url: "https://gist.githubusercontent.com/6ickzone/37b2d8106801f01b0f3889cd4db05560/raw/d7a09d73f74e9d3988fe9a56be9c23a3c03863ce/yurai.php", desc: "Alternative shells for backup access", note: "Login: yurai" },
  { id: 2, name: "Ayanami Shell", url: "https://raw.githubusercontent.com/adilhyz/webshells/master/PHP/me/ayanami.php", desc: "Stylized PHP shell with dark theme" },
  { id: 3, name: "Alfa Shell v3.0.2", url: "https://raw.githubusercontent.com/adilhyz/webshells/master/PHP/alf4.php", desc: "Feature-rich PHP shell", note: "Pass: ehsan" },
  { id: 4, name: "Simple Bypass", url: "https://raw.githubusercontent.com/6ickzone/0x6NyxWebShell/refs/heads/main/random/simple.php", desc: "Copy & Bypass features" },
  { id: 5, name: "AnonGhost Shell v2", url: "https://gist.githubusercontent.com/ARJUN-X001/eb9799bda62b2205e06e283888735851/raw/c8aa613b8bc48778a8d6f2b1090729cd481b403e/AnonGhost", desc: "Gist hosted archive" },
  { id: 6, name: "WTF Explorer", url: "https://gist.githubusercontent.com/6ickzone/5bf6674ca393ba1967dfd4b4a0fa299a/raw/98eb9988a7b7e31ffd6cd9a9b8f12fbc6b058de2/wtf.php", desc: "Custom file manager" },
  { id: 7, name: "YamiRoot DX", url: "https://raw.githubusercontent.com/6ickzone/0x6NyxWebShell/main/YamiRoot_Series/YR_VoidGateDX.php", desc: "Ultimate edition with 30KB features" },
  { id: 8, name: "YamiRoot Mini", url: "https://raw.githubusercontent.com/6ickzone/0x6NyxWebShell/main/YamiRoot_Series/YR_VGmini.php", desc: "Lightweight edition" },
  { id: 9, name: "YamiRoot Bypass", url: "https://raw.githubusercontent.com/6ickzone/0x6NyxWebShell/main/YamiRoot_Series/YR_bypass.php", desc: "Obfuscated mode for WAF evasion" },
  { id: 10, name: "B374k Mini", url: "https://raw.githubusercontent.com/adilhyz/webshells/master/PHP/mini/b374km.php", desc: "Lightweight version of B374K shell" },
  { id: 11, name: "C99 Shell", url: "https://raw.githubusercontent.com/tennc/webshell/master/php/c99.php", desc: "Classic PHP shell with extensive features" },
  { id: 12, name: "R57 Shell", url: "https://raw.githubusercontent.com/r57shell/r57-shell/refs/heads/master/r57.php", desc: "Classic PHP shell with security tools" },
  { id: 13, name: "WSO Shell", url: "https://raw.githubusercontent.com/RootShelll/WSO-Shell/refs/heads/main/WSO-Shell.php", desc: "Web Shell by R00t-Shell", note: "Pass: R00t" },
  { id: 14, name: "B374K Original", url: "https://raw.githubusercontent.com/adilhyz/webshells/master/PHP/b374k.php", desc: "Full version with all features" },
  { id: 15, name: "0x1337 Shell", url: "https://raw.githubusercontent.com/6ickzone/0x6NyxWebShell/main/random/0x1337.php", desc: "Minimalist web shell" },
  { id: 16, name: "April C0de Mini", url: "https://0x01.yn.lt/gabut.css", desc: "Stealth shell with .css extension" },
  { id: 17, name: "P0wny Shell", url: "https://raw.githubusercontent.com/flozz/p0wny-shell/master/shell.php", desc: "Modern AJAX file manager, no login" },
  { id: 18, name: "Choko's Shell", url: "https://raw.githubusercontent.com/adilhyz/webshells/master/PHP/chokos.php", desc: "Heavyweight all-in-one manager" },
  { id: 19, name: "Kamvret Shell", url: "https://raw.githubusercontent.com/adilhyz/webshells/master/PHP/kamvret.php", desc: "Classic eval-encoded shell" },
  { id: 20, name: "77 Shell", url: "https://raw.githubusercontent.com/adilhyz/webshells/master/PHP/77shell.php", desc: "Priv shell with silent error mode" },
  { id: 21, name: "Alfa Loader L", url: "https://raw.githubusercontent.com/adilhyz/webshells/master/PHP/alf4L.php", desc: "Alfa Team loader edition (alf4L)" },
  { id: 22, name: "G6 Shell", url: "https://raw.githubusercontent.com/adilhyz/webshells/master/PHP/G6.php", desc: "G6 PHP webshell v1.1 Beta" },
  { id: 23, name: "Mass Uploader", url: "https://raw.githubusercontent.com/6ickzone/0x6NyxWebShell/main/random/mass.php", desc: "Mass file uploader by 0x6ick" },
];

const credentials = [
  { shell: "Alfa Shell", user: "admin", pass: "ehsan" },
  { shell: "WSO Shell", user: "default", pass: "R00t" },
  { shell: "Yurai1337", user: "login", pass: "—" },
];

const sources = [
  {
    name: "6ickzone",
    detail: "0x6NyxWebShell & official gists",
    url: "https://github.com/6ickzone/0x6NyxWebShell",
    entries: 8,
    license: "Original work",
    licenseTone: "cyan",
  },
  {
    name: "adilhyz/webshells",
    detail: "Alfa, Ayanami, B374k, Choko's, Kamvret, 77, G6",
    url: "https://github.com/adilhyz/webshells",
    entries: 9,
    license: "No license",
    licenseTone: "amber",
  },
  {
    name: "tennc/webshell",
    detail: "C99 shell archive",
    url: "https://github.com/tennc/webshell",
    entries: 1,
    license: "MIT",
    licenseTone: "emerald",
  },
  {
    name: "RootShelll/WSO-Shell",
    detail: "WSO by R00t-Shell",
    url: "https://github.com/RootShelll/WSO-Shell",
    entries: 1,
    license: "MIT",
    licenseTone: "emerald",
  },
  {
    name: "flozz/p0wny-shell",
    detail: "P0wny Shell",
    url: "https://github.com/flozz/p0wny-shell",
    entries: 1,
    license: "WTFPL",
    licenseTone: "emerald",
  },
  {
    name: "r57shell/r57-shell",
    detail: "R57 shell archive",
    url: "https://github.com/r57shell/r57-shell",
    entries: 1,
    license: "No license",
    licenseTone: "amber",
  },
  {
    name: "ARJUN-X001",
    detail: "AnonGhost Shell v2 (gist)",
    url: "https://gist.github.com/ARJUN-X001/eb9799bda62b2205e06e283888735851",
    entries: 1,
    license: "No license",
    licenseTone: "amber",
  },
  {
    name: "0x01.yn.lt",
    detail: "April C0de Mini (independent host)",
    url: "https://0x01.yn.lt",
    entries: 1,
    license: "No license",
    licenseTone: "amber",
  },
];

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
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan transition-colors"
      title="Copy URL"
    >
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
      <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

interface WebShellArchiveProps {
  onBack: () => void;
}

export function WebShellArchive({ onBack }: WebShellArchiveProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-red/10">
            <Terminal className="size-8 text-red" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Web Shell Archive
              </h1>
              <Badge variant="outline" className="text-xs border-red/40 text-red">
                {shells.length} shells
              </Badge>
            </div>
            <p className="text-muted-foreground text-base">
              <strong className="text-foreground">A collection, not a host.</strong>{" "}
              This page is an index of web shells developed by third parties and
              published on public repositories and gists — 6ztools does not
              create, modify, or serve any of these files. Every link points to
              the original upstream source. Curated for authorized penetration
              testing and security research only.
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="glass-card rounded-xl p-4 mb-6 border border-amber/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber mb-1">
                Educational & Research Purposes Only
              </p>
              <p className="text-xs text-muted-foreground">
                These tools are provided exclusively for authorized security
                testing, educational purposes, and legitimate security research.
                Unauthorized access to computer systems is illegal. This archive
                only links to files that are already publicly available —
                downloading, hosting, or deploying them against systems you do
                not own or have written permission to test is prohibited.
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Shell</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Keterangan</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Raw File URL</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {shells.map((shell) => (
                  <tr
                    key={shell.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {shell.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileCode className="size-4 text-red shrink-0" />
                        <div>
                          <span className="font-medium text-sm">{shell.name}</span>
                          {shell.note && (
                            <p className="text-[11px] text-amber mt-0.5">{shell.note}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                      {shell.desc}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <code className="text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5 break-all">
                        {shell.url}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CopyButton text={shell.url} />
                        <a
                          href={shell.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-cyan hover:text-cyan/80 transition-colors"
                        >
                          <ExternalLink className="size-3" />
                          <span className="hidden sm:inline">Open</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Credentials */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="size-4 text-amber" />
            <h3 className="text-sm font-semibold">Credential Default</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {credentials.map((c) => (
              <div key={c.shell} className="bg-muted/30 rounded-lg p-3 border border-border/30">
                <div className="text-xs font-medium mb-1.5">{c.shell}</div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>User: <code className="text-cyan bg-cyan/10 px-1 rounded">{c.user}</code></span>
                  <span>Pass: <code className="text-amber bg-amber/10 px-1 rounded">{c.pass}</code></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sources & Credits */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Award className="size-4 text-cyan" />
            <h3 className="text-sm font-semibold">Sources &amp; Credits</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            This archive only indexes and links to these projects — all credit
            belongs to their original authors. Licenses shown are those of the
            upstream repositories.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sources.map((s) => (
              <div
                key={s.name}
                className="bg-muted/30 rounded-lg p-3 border border-border/30"
              >
                <div className="flex items-center gap-2 mb-1">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-foreground hover:text-cyan transition-colors truncate"
                  >
                    {s.name}
                  </a>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {s.entries} {s.entries === 1 ? "entry" : "entries"}
                  </span>
                  <span
                    className={`ml-auto text-[9px] px-1.5 py-0.5 rounded shrink-0 border ${
                      s.licenseTone === "emerald"
                        ? "border-emerald/30 text-emerald bg-emerald/5"
                        : s.licenseTone === "cyan"
                        ? "border-cyan/30 text-cyan bg-cyan/5"
                        : "border-amber/30 text-amber bg-amber/5"
                    }`}
                  >
                    {s.license}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {s.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center">
          Educational & Research purposes only.
        </p>
      </div>
    </motion.div>
  );
}
