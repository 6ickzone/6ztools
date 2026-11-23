import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Code, Copy, Check, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ObfuscationMethod = "char-codes" | "hex-escape" | "base64" | "variable-renaming" | "dead-code" | "string-array";

const SAMPLE_CODE = `function greet(name) {
  console.log("Hello, " + name + "!");
  return true;
}
greet("World");`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs h-7">
      {copied ? <><Check className="size-3 text-emerald" />Copied!</> : <><Copy className="size-3" />Copy</>}
    </Button>
  );
}

function obfuscateCharCodes(code: string): string {
  const chars = Array.from(code);
  const encoded = chars.map((c) => c.charCodeAt(0));
  return `eval(String.fromCharCode(${encoded.join(",")}))`;
}

function obfuscateHexEscape(code: string): string {
  return code.split("").map((c) => {
    if (/^[a-zA-Z0-9_{}();,.\s=+\-*/<>!&|?:\[\]"'\\]+$/.test(c) && Math.random() > 0.5) return c;
    return "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0");
  }).join("");
}

function obfuscateBase64(code: string): string {
  const encoded = btoa(unescape(encodeURIComponent(code)));
  return `eval(atob("${encoded}"))`;
}

function obfuscateVariableRenaming(code: string): string {
  const varNames = new Set<string>();
  const nameMap: Record<string, string> = {};
  const varRegex = /\b(?:function|let|var|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = varRegex.exec(code)) !== null) {
    const name = match[1];
    if (!nameMap[name]) {
      const newName = `_0x${(idx++).toString(16).padStart(4, "0")}`;
      nameMap[name] = newName;
      varNames.add(name);
    }
  }
  let result = code;
  for (const [original, renamed] of Object.entries(nameMap)) {
    result = result.replace(new RegExp(`\\b${original}\\b`, "g"), renamed);
  }
  return `/* Variables renamed: ${Object.entries(nameMap).map(([o, n]) => `${o}->${n}`).join(", ")} */\n${result}`;
}

function obfuscateDeadCode(code: string): string {
  const deadCode = `
  var _0xdead = Math.random();
  if (_0xdead > 2) { var _0xunreachable = []; }
  var _0xnull = null; if (_0xnull) { void(0); }
  `;
  return `${code}\n${deadCode}`;
}

function obfuscateStringArray(code: string): string {
  const strings: string[] = [];
  const regex = /["']([^"']{2,})["']/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(code)) !== null) strings.push(m[1]);
  const unique = [...new Set(strings)];
  if (unique.length === 0) return code;
  const arrName = "_0x" + Math.random().toString(16).slice(2, 8);
  const fnName = "_0x" + Math.random().toString(16).slice(2, 8);
  let result = code;
  const decoder = `var ${arrName}=[${unique.map((s) => `"${s}"`).join(",")}];\nfunction ${fnName}(i){return ${arrName}[i];}\n`;
  unique.forEach((s, i) => {
    result = result.replace(new RegExp(`["']${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "g"), `${fnName}(${i})`);
  });
  return `${decoder}\n${result}`;
}

const OBFUSCATION_METHODS: Array<{ id: ObfuscationMethod; name: string; description: string; level: string }> = [
  { id: "char-codes", name: "Char Code Encoding", description: "Converts all characters to String.fromCharCode() calls", level: "High" },
  { id: "hex-escape", name: "Hex Escape", description: "Replaces characters with \\xHH hex escape sequences", level: "Medium" },
  { id: "base64", name: "Base64 + eval", description: "Encodes code in Base64 and wraps with atob() + eval()", level: "High" },
  { id: "variable-renaming", name: "Variable Renaming", description: "Renames all function/variable names to _0x prefixed hex", level: "Low" },
  { id: "dead-code", name: "Dead Code Injection", description: "Adds unreachable code branches to confuse analysis", level: "Low" },
  { id: "string-array", name: "String Array", description: "Extracts strings into an array with decoder function", level: "Medium" },
];

interface JsObfuscatorProps {
  onBack: () => void;
}

export function JsObfuscator({ onBack }: JsObfuscatorProps) {
  const [input, setInput] = useState(SAMPLE_CODE);
  const [method, setMethod] = useState<ObfuscationMethod>("char-codes");
  const [output, setOutput] = useState("");

  const handleObfuscate = () => {
    if (!input.trim()) return;
    switch (method) {
      case "char-codes": setOutput(obfuscateCharCodes(input)); break;
      case "hex-escape": setOutput(obfuscateHexEscape(input)); break;
      case "base64": setOutput(obfuscateBase64(input)); break;
      case "variable-renaming": setOutput(obfuscateVariableRenaming(input)); break;
      case "dead-code": setOutput(obfuscateDeadCode(input)); break;
      case "string-array": setOutput(obfuscateStringArray(input)); break;
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "obfuscated.js";
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedMethod = OBFUSCATION_METHODS.find((m) => m.id === method)!;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10">
            <Code className="size-8 text-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">JavaScript Obfuscator</h1>
            <p className="text-muted-foreground text-base">Transform JavaScript code using multiple obfuscation techniques to hinder reverse engineering.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1 space-y-3">
            <label className="text-sm font-medium block">Obfuscation Method</label>
            {OBFUSCATION_METHODS.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${method === m.id ? "border-cyan bg-cyan/10" : "border-border/50 bg-card hover:border-border"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    m.level === "High" ? "bg-red/10 text-red" : m.level === "Medium" ? "bg-amber/10 text-amber" : "bg-emerald/10 text-emerald"
                  }`}>{m.level}</span>
                </div>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Input JavaScript</label>
                <Button variant="ghost" size="sm" onClick={() => setInput("")} className="text-xs h-6 gap-1"><RotateCcw className="size-3" />Clear</Button>
              </div>
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[200px] font-mono text-sm bg-muted/30 border-border/50" placeholder="Paste your JavaScript code here..." />
            </div>

            <Button onClick={handleObfuscate} disabled={!input.trim()} className="w-full gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold">
              <Code className="size-4" /> Obfuscate ({selectedMethod.name})
            </Button>

            {output && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Output <span className="text-muted-foreground font-normal">({output.length.toLocaleString()} chars)</span></label>
                  <div className="flex gap-2">
                    <CopyButton text={output} />
                    <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1.5 text-xs h-7"><Download className="size-3" />Download</Button>
                  </div>
                </div>
                <Textarea readOnly value={output} className="min-h-[200px] font-mono text-xs bg-muted/30 border-border/50 break-all" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
