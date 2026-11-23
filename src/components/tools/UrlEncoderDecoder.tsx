import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpDown,
  Copy,
  Check,
  AlertTriangle,
  Link,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UrlEncoderDecoderProps {
  onBack: () => void;
}

export function UrlEncoderDecoder({ onBack }: UrlEncoderDecoderProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [componentMode, setComponentMode] = useState<"full" | "component">("full");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const process = () => {
    setError(null);
    if (!input.trim()) {
      setOutput("");
      return;
    }
    try {
      if (mode === "encode") {
        const encoded =
          componentMode === "full"
            ? encodeURI(input)
            : encodeURIComponent(input);
        setOutput(encoded);
      } else {
        const decoded =
          componentMode === "full"
            ? decodeURI(input)
            : decodeURIComponent(input);
        setOutput(decoded);
      }
    } catch {
      setError(
        mode === "decode"
          ? "Invalid encoded string. Check for malformed percent-encoding sequences."
          : "Encoding failed."
      );
      setOutput("");
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swap = () => {
    setInput(output);
    setOutput("");
    setMode(mode === "encode" ? "decode" : "encode");
  };

  const difference = input ? Math.abs(output.length - input.length) : 0;
  const ratio = input && output ? ((output.length / input.length) * 100).toFixed(1) : "0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
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
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10">
            <Link className="size-8 text-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                URL Encoder / Decoder
              </h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">
                Active
              </Badge>
            </div>
            <p className="text-muted-foreground text-base">
              Encode or decode URLs and URL components for safe transport and parsing.
            </p>
          </div>
        </div>

        {/* Mode & Component Toggle */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMode("encode");
                  setOutput("");
                  setError(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "encode"
                    ? "bg-cyan/10 text-cyan border border-cyan/30"
                    : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => {
                  setMode("decode");
                  setOutput("");
                  setError(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === "decode"
                    ? "bg-purple/10 text-purple border border-purple/30"
                    : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"
                }`}
              >
                Decode
              </button>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setComponentMode("full")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  componentMode === "full"
                    ? "bg-amber/10 text-amber border border-amber/30"
                    : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"
                }`}
              >
                <Globe className="size-3 inline mr-1" />
                encodeURI
              </button>
              <button
                onClick={() => setComponentMode("component")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  componentMode === "component"
                    ? "bg-amber/10 text-amber border border-amber/30"
                    : "bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50"
                }`}
              >
                encodeURIComponent
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                {mode === "encode" ? "Raw URL / Text" : "Encoded URL"}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "encode"
                    ? "https://example.com/path?q=hello world&lang=en"
                    : "https%3A//example.com/path%3Fq%3Dhello%20world%26lang%3Den"
                }
                rows={8}
                className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 text-sm font-mono outline-none focus:border-cyan/40 focus:ring-2 focus:ring-cyan/10 resize-y placeholder:text-muted-foreground"
              />
              <div className="text-[10px] text-muted-foreground mt-1">
                {input.length} characters
              </div>
            </div>

            {/* Output */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                {mode === "encode" ? "Encoded Output" : "Decoded Output"}
              </label>
              <textarea
                readOnly
                value={output}
                placeholder="Output will appear here..."
                rows={8}
                className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 text-sm font-mono outline-none resize-y placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {output.length} characters
                  {output && ` · ${ratio}% of input`}
                </span>
                {output && (
                  <button
                    onClick={copyOutput}
                    className="text-xs text-muted-foreground hover:text-cyan transition-colors flex items-center gap-1"
                  >
                    {copied ? (
                      <Check className="size-3 text-emerald" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={process}
              disabled={!input.trim()}
              className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold"
            >
              {mode === "encode" ? "Encode" : "Decode"}
            </Button>
            <Button
              variant="outline"
              onClick={swap}
              disabled={!output}
              className="gap-2"
            >
              <ArrowUpDown className="size-4" />
              Swap
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red/10 border border-red/20 text-sm text-red">
              {error}
            </div>
          )}
        </div>

        {/* Reference */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold mb-3">Common URL Encodings</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { char: " ", encoded: "%20" },
              { char: "!", encoded: "%21" },
              { char: "#", encoded: "%23" },
              { char: "&", encoded: "%26" },
              { char: "/", encoded: "%2F" },
              { char: "=", encoded: "%3D" },
              { char: "?", encoded: "%3F" },
              { char: "@", encoded: "%40" },
            ].map((item) => (
              <div
                key={item.char}
                className="bg-muted/30 rounded-lg p-2 text-center border border-border/30"
              >
                <span className="text-sm font-mono font-bold text-cyan">
                  {item.char}
                </span>
                <span className="text-muted-foreground mx-1">→</span>
                <span className="text-xs font-mono text-amber">{item.encoded}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-amber/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">encodeURI</strong> encodes a full URI,
              preserving <code className="text-cyan bg-cyan/10 px-1 rounded">:/?#[]@!$&'()*+,;=</code>.
              <strong className="text-foreground ml-2">encodeURIComponent</strong> encodes
              all special characters and is safer for query parameter values.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
