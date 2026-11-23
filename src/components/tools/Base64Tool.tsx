import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpDown,
  Copy,
  Check,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Base64ToolProps {
  onBack: () => void;
}

export function Base64Tool({ onBack }: Base64ToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
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
        const encoded = btoa(
          new TextEncoder()
            .encode(input)
            .reduce((s, b) => s + String.fromCharCode(b), "")
        );
        setOutput(encoded);
      } else {
        const decoded = new TextDecoder().decode(
          Uint8Array.from(atob(input), (c) => c.charCodeAt(0))
        );
        setOutput(decoded);
      }
    } catch {
      setError(
        mode === "decode"
          ? "Invalid Base64 string. Ensure the input is properly encoded."
          : "Encoding failed. Check your input."
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
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-emerald/10">
            <FileText className="size-8 text-emerald" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Base64 Encoder / Decoder
              </h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">
                Active
              </Badge>
            </div>
            <p className="text-muted-foreground text-base">
              Encode plaintext to Base64 or decode Base64 back to its original text.
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">
                {mode === "encode" ? "Plain Text" : "Base64 Input"}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "encode"
                    ? "Enter text to encode..."
                    : "Enter Base64 string to decode..."
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
                {mode === "encode" ? "Base64 Output" : "Decoded Text"}
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
              Swap Output → Input
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red/10 border border-red/20 text-sm text-red">
              {error}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="glass-card rounded-xl p-4 border border-amber/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Base64 is an encoding
              scheme, not encryption. It provides no security and can be trivially decoded
              by anyone. Use it only for data transport, not for protecting sensitive
              information.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
