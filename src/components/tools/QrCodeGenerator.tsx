import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  QrCode,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as QRCodeLib from "qrcode";

interface QrCodeGeneratorProps {
  onBack: () => void;
}

const colorPresets = [
  { name: "Default", fg: "#000000", bg: "#ffffff" },
  { name: "Cyan Dark", fg: "#06b6d4", bg: "#0a0e17" },
  { name: "Purple", fg: "#8b5cf6", bg: "#0a0e17" },
  { name: "Amber", fg: "#f59e0b", bg: "#0a0e17" },
  { name: "Green", fg: "#22c55e", bg: "#0a0e17" },
  { name: "Red", fg: "#ef4444", bg: "#0a0e17" },
];

export function QrCodeGenerator({ onBack }: QrCodeGeneratorProps) {
  const [text, setText] = useState("https://6ickzone.io");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fgColor, setFgColor] = useState("#06b6d4");
  const [bgColor, setBgColor] = useState("#0a0e17");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [size, setSize] = useState(256);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback(async () => {
    if (!text.trim()) return;
    setGenerating(true);
    try {
      const canvas = canvasRef.current;
      if (canvas) {
        await QRCodeLib.toCanvas(canvas, text, {
          width: size,
          margin: 2,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          errorCorrectionLevel: errorLevel,
        });
        setQrDataUrl(canvas.toDataURL("image/png"));
      }
    } catch {
      // Handle silently
    }
    setGenerating(false);
  }, [text, fgColor, bgColor, errorLevel, size]);

  useEffect(() => {
    generate();
  }, [generate]);

  const download = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-${Date.now()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const copyImage = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not support images
    }
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
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10">
            <QrCode className="size-8 text-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                QR Code Generator
              </h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">
                Active
              </Badge>
            </div>
            <p className="text-muted-foreground text-base">
              Generate customizable QR codes from any text, URL, or data string.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Config */}
          <div className="space-y-4">
            {/* Input */}
            <div className="glass-card rounded-2xl p-6">
              <label className="text-sm font-medium mb-3 block">Content</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter URL, text, or data..."
                rows={3}
                className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 text-sm font-mono outline-none focus:border-cyan/40 focus:ring-2 focus:ring-cyan/10 resize-y placeholder:text-muted-foreground"
              />
              <div className="text-[10px] text-muted-foreground mt-1">
                {text.length} characters
              </div>
            </div>

            {/* Colors */}
            <div className="glass-card rounded-2xl p-6">
              <label className="text-sm font-medium mb-3 block">Color Preset</label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setFgColor(preset.fg);
                      setBgColor(preset.bg);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                      fgColor === preset.fg && bgColor === preset.bg
                        ? "border-cyan/40 bg-cyan/5"
                        : "border-border/50 bg-muted/20 hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className="size-4 rounded border border-border/30"
                      style={{ backgroundColor: preset.fg }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                    Foreground
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="size-8 rounded cursor-pointer border border-border/50"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="flex-1 bg-muted/30 border border-border/50 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                    Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="size-8 rounded cursor-pointer border border-border/50"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 bg-muted/30 border border-border/50 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="glass-card rounded-2xl p-6">
              <label className="text-sm font-medium mb-3 block">Options</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                    Error Correction
                  </label>
                  <div className="flex gap-1.5">
                    {(["L", "M", "Q", "H"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setErrorLevel(level)}
                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                          errorLevel === level
                            ? "bg-cyan/10 text-cyan border border-cyan/30"
                            : "bg-muted/30 text-muted-foreground border border-border/50"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                    Size
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(parseInt(e.target.value))}
                    className="w-full bg-muted/30 border border-border/50 rounded px-2 py-1.5 text-xs"
                  >
                    <option value={128}>128 × 128</option>
                    <option value={256}>256 × 256</option>
                    <option value={512}>512 × 512</option>
                    <option value={1024}>1024 × 1024</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
              <label className="text-sm font-medium mb-4 block self-start">Preview</label>

              {generating ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-8 text-cyan animate-spin" />
                </div>
              ) : qrDataUrl ? (
                <div className="relative group">
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="rounded-xl border border-border/30"
                    style={{ width: Math.min(size, 300), height: Math.min(size, 300) }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                  Enter content to generate a QR code
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {/* Actions */}
              {qrDataUrl && (
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    onClick={download}
                    className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold"
                  >
                    <Download className="size-4" />
                    Download PNG
                  </Button>
                  <Button variant="outline" onClick={copyImage} className="gap-2">
                    {copied ? (
                      <Check className="size-4 text-emerald" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {copied ? "Copied" : "Copy Image"}
                  </Button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="glass-card rounded-xl p-4 border border-amber/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Error correction:</strong> L (7%), M (15%),
                  Q (25%), H (30%). Higher levels produce denser codes but can survive more damage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
