import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Copy, Check, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs h-7">
      {copied ? <><Check className="size-3 text-emerald" />Copied!</> : <><Copy className="size-3" />Copy</>}
    </Button>
  );
}

const CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}|;:',.<>?/`~",
  hex: "0123456789abcdef",
};

const COMMON_PATTERNS = [
  { label: "Common Passwords", words: ["password", "123456", "admin", "letmein", "welcome", "monkey", "master", "qwerty", "login", "abc123", "111111", "1234567", "1234", "12345", "dragon", "baseball", "iloveyou", "trustno1", "sunshine", "princess"] },
  { label: "Admin Words", words: ["admin", "administrator", "root", "toor", "superuser", "sysadmin", "webadmin", "admin123", "pass", "password1", "changeme", "default"] },
  { label: "Months & Numbers", words: ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "monday", "tuesday", "wednesday", "thursday", "friday"] },
  { label: "Backup Extensions", words: [".bak", ".old", ".orig", ".save", ".tmp", ".backup", ".sql", ".zip", ".tar.gz", ".rar", ".7z", ".log", ".swp", ".config"] },
];

interface WordlistGeneratorProps { onBack: () => void; }

export function WordlistGenerator({ onBack }: WordlistGeneratorProps) {
  const [mode, setMode] = useState<"pattern" | "charset" | "custom">("charset");
  const [charset, setCharset] = useState<string[]>(["lowercase", "digits"]);
  const [minLen, setMinLen] = useState(4);
  const [maxLen, setMaxLen] = useState(6);
  const [customWords, setCustomWords] = useState("");
  const [selectedPattern, setSelectedPattern] = useState<string[]>([]);
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateCharset = () => {
    setGenerating(true);
    let charsetStr = "";
    for (const cs of charset) { charsetStr += CHARSETS[cs as keyof typeof CHARSETS] || ""; }
    if (!charsetStr) { setOutput("Error: Select at least one character set."); setGenerating(false); return; }
    if (maxLen > 8) { setOutput("Error: Max length limited to 8 to prevent browser hang (would generate " + Math.pow(charsetStr.length, maxLen).toLocaleString() + "+ combinations)."); setGenerating(false); return; }

    const lines: string[] = [];
    function generate(current: string, remaining: number) {
      if (remaining === 0) { lines.push(current); return; }
      for (const char of charsetStr) {
        if (lines.length >= 50000) return; // safety limit
        generate(current + char, remaining - 1);
      }
    }
    for (let len = minLen; len <= maxLen; len++) {
      if (lines.length >= 50000) break;
      generate("", len);
    }
    setOutput(lines.join("\n"));
    setGenerating(false);
  };

  const generatePattern = () => {
    const allWords: string[] = [];
    for (const pat of selectedPattern) {
      const found = COMMON_PATTERNS.find((p) => p.label === pat);
      if (found) allWords.push(...found.words);
    }
    setOutput([...new Set(allWords)].join("\n"));
  };

  const handleGenerate = () => {
    if (mode === "charset") generateCharset();
    else if (mode === "pattern") generatePattern();
    else setOutput(customWords);
  };

  const lineCount = output ? output.split("\n").length : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-amber/10"><BookOpen className="size-8 text-amber" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Wordlist Generator</h1>
            <p className="text-muted-foreground text-base">Generate custom wordlists for security testing with charset combinations, patterns, or manual input.</p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex gap-3 mb-6">
          {[{ id: "charset" as const, label: "Charset", desc: "Generate by character set" }, { id: "pattern" as const, label: "Patterns", desc: "Common word lists" }, { id: "custom" as const, label: "Custom", desc: "Manual word list" }].map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex-1 p-3 rounded-xl border text-left transition-all ${mode === m.id ? "border-amber bg-amber/10" : "border-border/50 bg-card hover:border-border"}`}>
              <div className="text-sm font-medium">{m.label}</div>
              <div className="text-[10px] text-muted-foreground">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Options */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          {mode === "charset" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Character Sets</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(CHARSETS).map((cs) => (
                    <button key={cs} onClick={() => setCharset((p) => p.includes(cs) ? p.filter((c) => c !== cs) : [...p, cs])}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${charset.includes(cs) ? "bg-amber/10 text-amber border border-amber/30" : "bg-muted/30 text-muted-foreground border border-border/50"}`}>
                      {charset.includes(cs) ? "✓" : "○"} {cs}
                    </button>
                  ))}
                </div>
                {charset.length > 0 && <p className="text-[10px] text-muted-foreground mt-2">Charset: {charset.map((c) => CHARSETS[c as keyof typeof CHARSETS]).join("").slice(0, 40)}... ({charset.reduce((sum, c) => sum + CHARSETS[c as keyof typeof CHARSETS].length, 0)} chars)</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-muted-foreground mb-1 block">Min Length</label><Input type="number" min={1} max={8} value={minLen} onChange={(e) => setMinLen(parseInt(e.target.value) || 1)} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Max Length</label><Input type="number" min={1} max={8} value={maxLen} onChange={(e) => setMaxLen(Math.min(8, parseInt(e.target.value) || 8))} /></div>
              </div>
            </div>
          )}
          {mode === "pattern" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Select Patterns</label>
              {COMMON_PATTERNS.map((p) => (
                <button key={p.label} onClick={() => setSelectedPattern((prev) => prev.includes(p.label) ? prev.filter((x) => x !== p.label) : [...prev, p.label])}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-left transition-all ${selectedPattern.includes(p.label) ? "border-amber bg-amber/10" : "border-border/50 bg-card hover:border-border"}`}>
                  <div>
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground">{p.words.length} words</div>
                  </div>
                  {selectedPattern.includes(p.label) && <span className="text-amber text-xs">✓ Selected</span>}
                </button>
              ))}
            </div>
          )}
          {mode === "custom" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Enter words (one per line)</label>
              <Textarea value={customWords} onChange={(e) => setCustomWords(e.target.value)} placeholder={"password\nadmin\n123456\nroot"} className="min-h-[150px] font-mono text-sm" />
            </div>
          )}
        </div>

        <Button onClick={handleGenerate} disabled={generating || (mode === "pattern" && selectedPattern.length === 0)} className="w-full gap-2 bg-amber hover:bg-amber/90 text-black font-semibold mb-6">
          {generating ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
          {generating ? "Generating..." : "Generate Wordlist"}
        </Button>

        {output && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{lineCount.toLocaleString()} words</span>
              <div className="flex gap-2">
                <CopyButton text={output} />
                <Button variant="ghost" size="sm" onClick={() => {
                  const blob = new Blob([output], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "wordlist.txt"; a.click();
                  URL.revokeObjectURL(url);
                }} className="gap-1 text-xs h-7"><Download className="size-3" />Download .txt</Button>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <Textarea readOnly value={output} className="min-h-[250px] max-h-[400px] font-mono text-xs bg-muted/30 border-border/50" />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
