import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Palette, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function minifyCss(css: string, options: { removeComments: boolean; removeWhitespace: boolean; removeEmptyRules: boolean; shortenColors: boolean; shortenUnits: boolean }): string {
  let result = css;
  if (options.removeComments) result = result.replace(/\/\*[\s\S]*?\*\//g, "");
  if (options.removeWhitespace) {
    result = result.replace(/\s*([{}:;,>~+])\s*/g, "$1");
    result = result.replace(/\s+/g, " ");
    result = result.replace(/;}/g, "}");
    result = result.trim();
  }
  if (options.removeEmptyRules) result = result.replace(/[^{}]*\{\s*\}/g, "");
  if (options.shortenColors) {
    const colorMap: Record<string, string> = {
      "#ffffff": "#fff", "#000000": "#000", "#ff0000": "#f00", "#00ff00": "#0f0",
      "#0000ff": "#00f", "#cccccc": "#ccc", "#333333": "#333", "#666666": "#666",
      "#999999": "#99", "#aaaaaa": "#aaa", "#dddddd": "#ddd", "#eeeeee": "#eee",
      "#f0f0f0": "#f0f", "#ff6600": "#f60",
    };
    for (const [full, short] of Object.entries(colorMap)) {
      result = result.replace(new RegExp(full, "gi"), short);
    }
  }
  if (options.shortenUnits) {
    result = result.replace(/(\d+(?:\.\d+)?)px/g, (_, n) => n === "0" ? "0" : `${n}px`);
    result = result.replace(/(\d+(?:\.\d+)?)0rem/g, (_, n) => `${n}rem`);
    result = result.replace(/(\d+(?:\.\d+)?)0em/g, (_, n) => `${n}em`);
  }
  return result;
}

const SAMPLE_CSS = `/* Global Styles */
body {
    font-family: Arial, sans-serif;
    margin: 0px;
    padding: 0px;
    background-color: #ffffff;
    color: #333333;
}

/* Container */
.container {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 20px;
    padding-right: 20px;
}

/* Navigation */
.nav {
    background-color: #333333;
    color: #ffffff;
    padding-top: 10px;
    padding-bottom: 10px;
}

.nav a {
    color: #ffffff;
    text-decoration: none;
    margin-left: 15px;
    margin-right: 15px;
}

/* Empty rule */
.empty {
}

/* Buttons */
.btn-primary {
    background-color: #0066cc;
    color: #ffffff;
    border: none;
    padding-top: 12px;
    padding-bottom: 12px;
    padding-left: 24px;
    padding-right: 24px;
    border-radius: 4px;
    cursor: pointer;
}`;

interface CssMinifierProps { onBack: () => void; }

export function CssMinifier({ onBack }: CssMinifierProps) {
  const [input, setInput] = useState(SAMPLE_CSS);
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState({
    removeComments: true, removeWhitespace: true, removeEmptyRules: true,
    shortenColors: true, shortenUnits: true,
  });
  const [stats, setStats] = useState<{ original: number; minified: number; saved: number; percent: number } | null>(null);

  const handleMinify = () => {
    const minified = minifyCss(input, options);
    setOutput(minified);
    const original = new Blob([input]).size;
    const minifiedSize = new Blob([minified]).size;
    setStats({ original, minified: minifiedSize, saved: original - minifiedSize, percent: ((original - minifiedSize) / original * 100) });
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "minified.css"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10"><Palette className="size-8 text-purple" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">CSS Minifier</h1>
            <p className="text-muted-foreground text-base">Compress CSS by removing comments, whitespace, empty rules, and shortening values.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Options</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "removeComments" as const, label: "Remove Comments" },
              { key: "removeWhitespace" as const, label: "Remove Whitespace" },
              { key: "removeEmptyRules" as const, label: "Remove Empty Rules" },
              { key: "shortenColors" as const, label: "Shorten Colors" },
              { key: "shortenUnits" as const, label: "Shorten Units" },
            ].map((opt) => (
              <button key={opt.key} onClick={() => setOptions((p) => ({ ...p, [opt.key]: !p[opt.key] }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${options[opt.key] ? "bg-purple/10 text-purple border border-purple/30" : "bg-muted/30 text-muted-foreground border border-border/50"}`}>
                {options[opt.key] ? "✓" : "○"} {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Input CSS</label>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[300px] font-mono text-xs bg-muted/30 border-border/50" placeholder="Paste CSS here..." />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Output</label>
              {output && <div className="flex gap-2"><CopyButton text={output} />
                <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1 text-xs h-7"><Download className="size-3" />Download</Button>
              </div>}
            </div>
            <Textarea readOnly value={output} className="min-h-[300px] font-mono text-xs bg-muted/30 border-border/50 break-all" placeholder="Minified output..." />
          </div>
        </div>
        <Button onClick={handleMinify} disabled={!input.trim()} className="w-full gap-2 bg-purple hover:bg-purple/90 text-white font-semibold mb-6">
          <Palette className="size-4" /> Minify CSS
        </Button>
        {stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Original</div><div className="text-sm font-bold">{stats.original.toLocaleString()} bytes</div></div>
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Minified</div><div className="text-sm font-bold text-purple">{stats.minified.toLocaleString()} bytes</div></div>
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Saved</div><div className="text-sm font-bold text-emerald">{stats.saved.toLocaleString()} bytes</div></div>
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Reduction</div><div className="text-sm font-bold text-amber">{stats.percent.toFixed(1)}%</div></div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
