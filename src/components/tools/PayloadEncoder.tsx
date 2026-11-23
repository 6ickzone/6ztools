import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Binary, Copy, Check, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Format = "url" | "url-double" | "html" | "hex" | "octal" | "unicode" | "base64" | "binary" | "rot13";

const FORMATS: { id: Format; label: string; desc: string }[] = [
  { id: "url", label: "URL Encode", desc: "Percent-encoding" },
  { id: "url-double", label: "Double URL", desc: "Encoded twice" },
  { id: "html", label: "HTML Entities", desc: "&#xHH; format" },
  { id: "hex", label: "Hex", desc: "\\xHH format" },
  { id: "octal", label: "Octal", desc: "\\OOO format" },
  { id: "unicode", label: "Unicode", desc: "\\uHHHH format" },
  { id: "base64", label: "Base64", desc: "Standard b64" },
  { id: "binary", label: "Binary", desc: "8-bit binary" },
  { id: "rot13", label: "ROT13", desc: "Caesar cipher" },
];

function encodeAs(format: Format, input: string): string {
  switch (format) {
    case "url": return encodeURI(input);
    case "url-double": return encodeURIComponent(encodeURI(input));
    case "html":
      return Array.from(input).map((c) => `&#x${c.charCodeAt(0).toString(16).toUpperCase()};`).join("");
    case "hex":
      return Array.from(input).map((c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join("");
    case "octal":
      return Array.from(input).map((c) => `\\${c.charCodeAt(0).toString(8).padStart(3, "0")}`).join("");
    case "unicode":
      return Array.from(input).map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`).join("");
    case "base64":
      return btoa(unescape(encodeURIComponent(input)));
    case "binary":
      return Array.from(input).map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
    case "rot13":
      return input.replace(/[a-zA-Z]/g, (c) => {
        const base = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
      });
  }
}

function decodeAs(format: Format, input: string): string {
  switch (format) {
    case "url": return decodeURI(input);
    case "url-double": return decodeURI(decodeURIComponent(input));
    case "html":
      return input.replace(/&#x([0-9A-Fa-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
                  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));
    case "hex":
      return input.replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    case "octal":
      return input.replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)));
    case "unicode":
      return input.replace(/\\u([0-9A-Fa-f]{4})/g, (_, u) => String.fromCharCode(parseInt(u, 16)));
    case "base64":
      try { return decodeURIComponent(escape(atob(input.trim()))); } catch { throw new Error("Invalid Base64 input"); }
    case "binary":
      return input.trim().split(/\s+/).map((b) => {
        if (!/^[01]{1,8}$/.test(b)) throw new Error("Invalid binary input");
        return String.fromCharCode(parseInt(b, 2));
      }).join("");
    case "rot13":
      return rot13(input);
  }
}

// ROT13 decode is the same as encode
function rot13(input: string): string {
  return input.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export function PayloadEncoder({ onBack }: { onBack: () => void }) {
  const [input, setInput] = useState("<script>alert(1)</script>");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [format, setFormat] = useState<Format>("url");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const process = () => {
    setError(null);
    if (!input) { setOutput(""); return; }
    try {
      if (mode === "encode") {
        setOutput(encodeAs(format, input));
      } else if (format === "rot13") {
        setOutput(rot13(input));
      } else if (format === "base64") {
        setOutput(decodeAs("base64", input));
      } else {
        setOutput(decodeAs(format, input));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decoding failed");
      setOutput("");
    }
  };

  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const swap = () => { setInput(output); setOutput(""); setMode(mode === "encode" ? "decode" : "encode"); };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10"><Binary className="size-8 text-purple" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payload Encoder</h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
            </div>
            <p className="text-muted-foreground text-base">Encode or decode payloads in 9 formats — URL, HTML entities, hex, octal, unicode, base64, binary, and ROT13.</p>
          </div>
        </div>

        {/* Mode + Format */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex gap-2">
              {(["encode", "decode"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setOutput(""); setError(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${mode === m
                    ? m === "encode" ? "bg-cyan/10 text-cyan border border-cyan/30" : "bg-purple/10 text-purple border border-purple/30"
                    : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
            {FORMATS.map((f) => (
              <button key={f.id} onClick={() => { setFormat(f.id); setOutput(""); setError(null); }}
                className={`p-2 rounded-lg border text-left transition-all ${format === f.id ? "border-purple bg-purple/10" : "border-border/50 bg-card hover:border-border"}`}>
                <div className="text-xs font-medium">{f.label}</div>
                <div className="text-[9px] text-muted-foreground">{f.desc}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                {mode === "encode" ? "Raw Input" : "Encoded Input"}
              </label>
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={8}
                placeholder="Enter payload..." className="font-mono text-sm bg-muted/30 border-border/50 resize-y" />
              <div className="text-[10px] text-muted-foreground mt-1">{input.length} characters</div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                {mode === "encode" ? "Encoded Output" : "Decoded Output"}
              </label>
              <Textarea readOnly value={output} rows={8} placeholder="Output appears here..." className="font-mono text-sm bg-muted/30 border-border/50 resize-y" />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{output.length} characters</span>
                {output && (
                  <button onClick={copy} className="text-xs text-muted-foreground hover:text-purple transition-colors flex items-center gap-1">
                    {copied ? <><Check className="size-3 text-emerald" />Copied</> : <><Copy className="size-3" />Copy</>}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button onClick={process} disabled={!input} className="gap-2 bg-purple hover:bg-purple/90 text-black font-semibold">
              <Binary className="size-4" /> {mode === "encode" ? "Encode" : "Decode"}
            </Button>
            <Button variant="outline" onClick={swap} disabled={!output} className="gap-2">
              <ArrowUpDown className="size-4" /> Swap
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red/10 border border-red/20 text-sm text-red">{error}</div>
          )}
        </div>

        {/* Quick preview of all formats */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-3">Preview — All Formats</h3>
          <div className="space-y-2">
            {FORMATS.map((f) => {
              let preview = "";
              try { preview = f.id === "rot13" ? rot13(input) : encodeAs(f.id, input); } catch { preview = "—"; }
              if (preview.length > 80) preview = preview.slice(0, 80) + "…";
              return (
                <div key={f.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/20 border border-border/30">
                  <span className="text-[10px] font-medium text-purple w-24 shrink-0 pt-0.5">{f.label}</span>
                  <code className="text-[11px] font-mono text-muted-foreground break-all flex-1">{preview}</code>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
