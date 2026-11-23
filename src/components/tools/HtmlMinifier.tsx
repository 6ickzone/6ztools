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

function minifyHtml(html: string, options: { removeComments: boolean; removeWhitespace: boolean; removeEmptyAttributes: boolean; minifyInlineCss: boolean; minifyInlineJs: boolean }): string {
  let result = html;
  if (options.removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, "");
  }
  if (options.removeWhitespace) {
    // Remove leading/trailing whitespace between tags
    result = result.replace(/>\s+</g, "><");
    // Collapse multiple spaces to single space
    result = result.replace(/\s{2,}/g, " ");
    // Remove whitespace at start/end
    result = result.trim();
  }
  if (options.removeEmptyAttributes) {
    result = result.replace(/(\s)(class|id|style|title|alt|name|value|type|role|aria-[\w-]+)=["']["']/g, "");
  }
  if (options.minifyInlineCss) {
    result = result.replace(/style="([^"]*)"/g, (_, css) => {
      const minified = css.replace(/\s*([{:;,])\s*/g, "$1").replace(/\s+/g, " ").trim();
      return `style="${minified}"`;
    });
  }
  if (options.minifyInlineJs) {
    result = result.replace(/<(script[^>]*)>([\s\S]*?)<\/script>/g, (_, attrs, js) => {
      const minified = js.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*([{}();,=])\s*/g, "$1").replace(/\s+/g, " ").trim();
      return `<${attrs}>${minified}</script>`;
    });
  }
  return result;
}

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <!-- Main content -->
    <div class="container">
        <h1>Hello World</h1>
        <p style="color: #333; font-size: 16px;">This is a sample page.</p>
    </div>
    <script>
        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            console.log('App loaded');
        });
    </script>
</body>
</html>`;

interface HtmlMinifierProps { onBack: () => void; }

export function HtmlMinifier({ onBack }: HtmlMinifierProps) {
  const [input, setInput] = useState(SAMPLE_HTML);
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState({
    removeComments: true, removeWhitespace: true, removeEmptyAttributes: false,
    minifyInlineCss: true, minifyInlineJs: true,
  });
  const [stats, setStats] = useState<{ original: number; minified: number; saved: number; percent: number } | null>(null);

  const handleMinify = () => {
    const minified = minifyHtml(input, options);
    setOutput(minified);
    const original = new Blob([input]).size;
    const minifiedSize = new Blob([minified]).size;
    setStats({ original, minified: minifiedSize, saved: original - minifiedSize, percent: ((original - minifiedSize) / original * 100) });
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "minified.html"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10"><FileCode className="size-8 text-cyan" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">HTML Minifier</h1>
            <p className="text-muted-foreground text-base">Compress HTML by removing comments, whitespace, and inline asset optimization.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Options</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "removeComments" as const, label: "Remove Comments" },
              { key: "removeWhitespace" as const, label: "Remove Whitespace" },
              { key: "removeEmptyAttributes" as const, label: "Remove Empty Attributes" },
              { key: "minifyInlineCss" as const, label: "Minify Inline CSS" },
              { key: "minifyInlineJs" as const, label: "Minify Inline JS" },
            ].map((opt) => (
              <button key={opt.key} onClick={() => setOptions((p) => ({ ...p, [opt.key]: !p[opt.key] }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${options[opt.key] ? "bg-cyan/10 text-cyan border border-cyan/30" : "bg-muted/30 text-muted-foreground border border-border/50"}`}>
                {options[opt.key] ? "✓" : "○"} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Input HTML</label>
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[300px] font-mono text-xs bg-muted/30 border-border/50" placeholder="Paste HTML here..." />
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

        <Button onClick={handleMinify} disabled={!input.trim()} className="w-full gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold mb-6">
          <FileCode className="size-4" /> Minify HTML
        </Button>

        {stats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Original</div><div className="text-sm font-bold">{stats.original.toLocaleString()} bytes</div></div>
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Minified</div><div className="text-sm font-bold text-cyan">{stats.minified.toLocaleString()} bytes</div></div>
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Saved</div><div className="text-sm font-bold text-emerald">{stats.saved.toLocaleString()} bytes</div></div>
            <div className="glass-card rounded-xl p-3 text-center"><div className="text-[10px] text-muted-foreground mb-1">Reduction</div><div className="text-sm font-bold text-amber">{stats.percent.toFixed(1)}%</div></div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
