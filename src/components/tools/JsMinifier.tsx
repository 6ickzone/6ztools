import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileCode, Copy, Check, Download } from "lucide-react";
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

function minifyJs(js: string, options: { removeComments: boolean; removeWhitespace: boolean; removeConsoleLogs: boolean; shortenVariables: boolean }): string {
  let result = js;
  if (options.removeComments) {
    result = result.replace(/\/\*[\s\S]*?\*\//g, "");
    result = result.replace(/\/\/.*$/gm, "");
  }
  if (options.removeConsoleLogs) {
    result = result.replace(/console\.(log|warn|error|info|debug)\s*\([^)]*\)\s*;?/g, "");
  }
  if (options.removeWhitespace) {
    // Remove leading/trailing whitespace per line
    result = result.replace(/^\s+|\s+$/gm, "");
    // Collapse multiple newlines
    result = result.replace(/\n{3,}/g, "\n\n");
    // Remove spaces around operators (careful — simple approach)
    result = result.replace(/\s*([{}();,=+\-*/<>!&|?:\[\]])\s*/g, "$1");
    // But keep spaces after keywords for valid syntax
    result = result.replace(/(var|let|const|return|if|else|for|while|do|switch|case|break|continue|function|new|typeof|instanceof|in|of)\b/g, "$1 ");
    result = result.replace(/\s+/g, " ");
    result = result.trim();
  }
  if (options.shortenVariables) {
    // Simple: replace common verbose patterns
    result = result.replace(/var\s+/g, "let ");
    result = result.replace(/===\s*true/g, "");
    result = result.replace(/===\s*false/g, "===!1");
    result = result.replace(/!==\s*false/g, "");
    result = result.replace(/===\s*null/g, "==null");
    result = result.replace(/===\s*undefined/g, "==void 0");
  }
  return result;
}

const SAMPLE_JS = `// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');

    // Get all buttons
    var buttons = document.querySelectorAll('.btn');

    // Add click handlers
    buttons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            console.log('Button clicked:', event.target);
            event.preventDefault();

            // Toggle active class
            if (button.classList.contains('active')) {
                button.classList.remove('active');
            } else {
                button.classList.add('active');
            }

            // Send analytics
            var data = {
                action: 'click',
                target: event.target.id,
                timestamp: Date.now()
            };

            fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            }).then(function(response) {
                return response.json();
            }).then(function(result) {
                console.log('Analytics sent:', result);
            }).catch(function(error) {
                console.error('Analytics error:', error);
            });
        });
    });

    console.log('Event listeners attached');
});

// Utility function
function formatDate(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return year + '-' + month + '-' + day;
}`;

interface JsMinifierProps { onBack: () => void; }

export function JsMinifier({ onBack }: JsMinifierProps) {
  const [input, setInput] = useState(SAMPLE_JS);
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState({
    removeComments: true, removeWhitespace: true, removeConsoleLogs: true, shortenVariables: false,
  });
  const [stats, setStats] = useState<{ original: number; minified: number; saved: number; percent: number } | null>(null);

  const handleMinify = () => {
    const minified = minifyJs(input, options);
    setOutput(minified);
    const original = new Blob([input]).size;
    const minifiedSize = new Blob([minified]).size;
    setStats({ original, minified: minifiedSize, saved: original - minifiedSize, percent: ((original - minifiedSize) / original * 100) });
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "minified.js"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-emerald/10"><FileCode className="size-8 text-emerald" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">JS Minifier</h1>
            <p className="text-muted-foreground text-base">Compress JavaScript by removing comments, whitespace, console logs, and shortening patterns.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Options</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "removeComments" as const, label: "Remove Comments" },
              { key: "removeWhitespace" as const, label: "Remove Whitespace" },
              { key: "removeConsoleLogs" as const, label: "Remove Console Logs" },
              { key: "shortenVariables" as const, label: "Shorten Patterns" },
            ].map((opt) => (
              <button key={opt.key} onClick={() => setOptions((p) => ({ ...p, [opt.key]: !p[opt.key] }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${options[opt.key] ? "bg-emerald/10 text-emerald border border-emerald/30" : "bg-muted/30 text-muted-foreground border border-border/50"}`}>
                {options[opt.key] ? "✓" : "○"} {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Input JS</label>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[300px] font-mono text-xs bg-muted/30 border-border/50" placeholder="Paste JavaScript here..." />
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
        <Button onClick={handleMinify} disabled={!input.trim()} className="w-full gap-2 bg-emerald hover:bg-emerald/90 text-black font-semibold mb-6">
          <FileCode className="size-4" /> Minify JavaScript
        </Button>
        {stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Original</div><div className="text-sm font-bold">{stats.original.toLocaleString()} bytes</div></div>
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Minified</div><div className="text-sm font-bold text-emerald">{stats.minified.toLocaleString()} bytes</div></div>
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Saved</div><div className="text-sm font-bold text-cyan">{stats.saved.toLocaleString()} bytes</div></div>
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Reduction</div><div className="text-sm font-bold text-amber">{stats.percent.toFixed(1)}%</div></div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
