import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Code, Copy, Check, Download } from "lucide-react";
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

type ObfuscationMethod = "string-encode" | "hex-encode" | "var-rename" | "dead-code" | "base64-encode" | "reverse-strings";

function obfuscateStringEncode(code: string): string {
  const strings: string[] = [];
  const regex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(code)) !== null) strings.push(m[0]);
  let result = code;
  const unique = [...new Set(strings)];
  const decoderLines = ["import base64, codecs"];
  unique.forEach((s, i) => {
    const inner = s.slice(1, -1);
    const encoded = Buffer.from(inner).toString("base64");
    const varName = `_s${i}`;
    decoderLines.push(`${varName} = base64.b64decode("${encoded}").decode()`);
    result = result.split(s).join(varName);
  });
  return decoderLines.join("\n") + "\n\n" + result;
}

function obfuscateHexEncode(code: string): string {
  return code.split("").map((c) => {
    if (/^[a-zA-Z0-9_{}\s.]+$/.test(c) && Math.random() > 0.6) return c;
    return "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0");
  }).join("");
}

function obfuscateVarRename(code: string): string {
  const nameMap: Record<string, string> = {};
  let idx = 0;
  const varRegex = /\b(def|class|lambda)\s+([a-zA-Z_]\w*)/g;
  let match: RegExpExecArray | null;
  while ((match = varRegex.exec(code)) !== null) {
    const name = match[2];
    if (!nameMap[name]) {
      nameMap[name] = `_f${(idx++).toString(16).padStart(4, "0")}`;
    }
  }
  let result = code;
  for (const [original, renamed] of Object.entries(nameMap)) {
    result = result.replace(new RegExp(`\\b${original}\\b`, "g"), renamed);
  }
  return result;
}

function obfuscateDeadCode(code: string): string {
  const dead = `\n# Dead code injection
if False:
    _unused_var = [x for x in range(100) if x % 7 == 0]
    raise SystemExit("unreachable")
_ = lambda x: None
`;
  return code + dead;
}

function obfuscateBase64Encode(code: string): string {
  const encoded = Buffer.from(code).toString("base64");
  return `import base64
exec(base64.b64decode("${encoded}").decode())`;
}

function obfuscateReverseStrings(code: string): string {
  return code.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    const inner = match.slice(1, -1);
    const quote = match[0];
    return `${quote}${inner.split("").reverse().join("")}${quote}`;
  });
}

const METHODS: Array<{ id: ObfuscationMethod; name: string; description: string; level: string }> = [
  { id: "string-encode", name: "String Encoding", description: "Extract strings to base64 variables", level: "High" },
  { id: "hex-encode", name: "Hex Escape", description: "Replace chars with \\xHH hex escapes", level: "Medium" },
  { id: "base64-encode", name: "Base64 + exec", description: "Encode entire script in base64", level: "High" },
  { id: "var-rename", name: "Variable Renaming", description: "Rename functions/classes to _fXXXX", level: "Low" },
  { id: "dead-code", name: "Dead Code Injection", description: "Add unreachable code blocks", level: "Low" },
  { id: "reverse-strings", name: "Reverse Strings", description: "Reverse all string literals", level: "Medium" },
];

const SAMPLE = `def greet(name):
    message = f"Hello, {name}!"
    print(message)
    return True

def calculate(x, y):
    result = x * y + 42
    return result

greet("World")
print(calculate(5, 10))`;

interface PythonObfuscatorProps { onBack: () => void; }

export function PythonObfuscator({ onBack }: PythonObfuscatorProps) {
  const [input, setInput] = useState(SAMPLE);
  const [method, setMethod] = useState<ObfuscationMethod>("string-encode");
  const [output, setOutput] = useState("");

  const handleObfuscate = () => {
    if (!input.trim()) return;
    const fns: Record<ObfuscationMethod, (s: string) => string> = {
      "string-encode": obfuscateStringEncode,
      "hex-encode": obfuscateHexEncode,
      "base64-encode": obfuscateBase64Encode,
      "var-rename": obfuscateVarRename,
      "dead-code": obfuscateDeadCode,
      "reverse-strings": obfuscateReverseStrings,
    };
    setOutput(fns[method](input));
  };

  const selectedMethod = METHODS.find((m) => m.id === method)!;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-emerald/10"><Code className="size-8 text-emerald" /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Python Obfuscator</h1>
            <p className="text-muted-foreground text-base">Transform Python code using multiple obfuscation techniques.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="space-y-3">
            <label className="text-sm font-medium block">Method</label>
            {METHODS.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${method === m.id ? "border-emerald bg-emerald/10" : "border-border/50 bg-card hover:border-border"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.level === "High" ? "bg-red/10 text-red" : m.level === "Medium" ? "bg-amber/10 text-amber" : "bg-emerald/10 text-emerald"}`}>{m.level}</span>
                </div>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Input Python</label>
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[200px] font-mono text-sm bg-muted/30 border-border/50" placeholder="Paste Python code..." />
            </div>
            <Button onClick={handleObfuscate} disabled={!input.trim()} className="w-full gap-2 bg-emerald hover:bg-emerald/90 text-black font-semibold">
              <Code className="size-4" /> Obfuscate ({selectedMethod.name})
            </Button>
            {output && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Output</label>
                  <div className="flex gap-2">
                    <CopyButton text={output} />
                    <Button variant="ghost" size="sm" onClick={() => {
                      const blob = new Blob([output], { type: "text/x-python" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a"); a.href = url; a.download = "obfuscated.py"; a.click();
                      URL.revokeObjectURL(url);
                    }} className="gap-1 text-xs h-7"><Download className="size-3" />Download</Button>
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
