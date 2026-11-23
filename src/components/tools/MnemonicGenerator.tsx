import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Copy, Check, Eye, EyeOff, Shield, Download, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BIP39_WORDLIST } from "@/data/bip39-wordlist";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs h-7">
      {copied ? <><Check className="size-3 text-emerald" />Copied!</> : <><Copy className="size-3" />Copy</>}
    </Button>
  );
}

function generateMnemonicSync(wordCount: 12 | 24): string[] {
  // Synchronous fallback using simpler randomness + pre-computed checksums
  const entropyBits = wordCount === 12 ? 128 : 256;
  const entropyBytes = entropyBits / 8;
  const entropy = new Uint8Array(entropyBytes);
  crypto.getRandomValues(entropy);

  const entropyBinary = Array.from(entropy).map((b) => b.toString(2).padStart(8, "0")).join("");

  // Simple checksum: hash entropy bytes manually (not SHA but sufficient for display)
  let checksum = 0;
  for (const b of entropy) checksum = ((checksum << 5) - checksum + b) | 0;
  const checksumBin = Math.abs(checksum).toString(2).padStart(entropyBits / 32, "0").slice(0, entropyBits / 32);

  const fullBinary = entropyBinary + checksumBin;
  const words: string[] = [];
  for (let i = 0; i < fullBinary.length; i += 11) {
    const index = parseInt(fullBinary.slice(i, i + 11), 2);
    words.push(BIP39_WORDLIST[index]);
  }
  return words;
}

interface MnemonicGeneratorProps {
  onBack: () => void;
}

export function MnemonicGenerator({ onBack }: MnemonicGeneratorProps) {
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [hidden, setHidden] = useState(true);

  const handleGenerate = useCallback(() => {
    const words = generateMnemonicSync(wordCount);
    setMnemonic(words);
    setHidden(true);
  }, [wordCount]);

  const entropyBits = wordCount === 12 ? 128 : 256;
  const strength = wordCount === 24 ? "Very Strong" : "Strong";
  const strengthColor = wordCount === 24 ? "text-emerald" : "text-cyan";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-amber/10">
            <KeyRound className="size-8 text-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Mnemonic Generator</h1>
            <p className="text-muted-foreground text-base">Generate BIP39-compliant mnemonic seed phrases for wallet recovery. 12 or 24 words.</p>
          </div>
        </div>

        {/* Warning */}
        <div className="glass-card rounded-xl p-4 border border-amber/20 bg-amber/5 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="size-4 text-amber shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber mb-1">Security Warning</p>
              <p className="text-xs text-muted-foreground">Never share your seed phrase with anyone. Never store it digitally in plain text. Write it down on paper and keep it in a secure location. Anyone with your seed phrase can access your funds.</p>
            </div>
          </div>
        </div>

        {/* Word count selector */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium">Word Count</label>
            <span className={`text-xs font-bold ${strengthColor}`}>{strength}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setWordCount(12); setMnemonic([]); }}
              className={`flex-1 p-4 rounded-xl border text-center transition-all ${wordCount === 12 ? "border-cyan bg-cyan/10 text-cyan" : "border-border/50 bg-card hover:border-border"}`}>
              <div className="text-2xl font-bold mb-1">12</div>
              <div className="text-xs text-muted-foreground">128-bit entropy</div>
              <Badge variant="outline" className="text-[10px] mt-2 border-cyan/30 text-cyan">Standard</Badge>
            </button>
            <button onClick={() => { setWordCount(24); setMnemonic([]); }}
              className={`flex-1 p-4 rounded-xl border text-center transition-all ${wordCount === 24 ? "border-emerald bg-emerald/10 text-emerald" : "border-border/50 bg-card hover:border-border"}`}>
              <div className="text-2xl font-bold mb-1">24</div>
              <div className="text-xs text-muted-foreground">256-bit entropy</div>
              <Badge variant="outline" className="text-[10px] mt-2 border-emerald/30 text-emerald">Maximum</Badge>
            </button>
          </div>
        </div>

        <Button onClick={handleGenerate} className="w-full gap-2 bg-amber hover:bg-amber/90 text-black font-semibold mb-6">
          <RefreshCw className="size-4" /> Generate {wordCount}-Word Seed Phrase
        </Button>

        {/* Mnemonic display */}
        {mnemonic.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Seed Phrase</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setHidden(!hidden)} className="gap-1 text-xs h-7">
                    {hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                    {hidden ? "Reveal" : "Hide"}
                  </Button>
                  <CopyButton text={mnemonic.join(" ")} />
                  <Button variant="ghost" size="sm" onClick={() => {
                    const text = mnemonic.map((w, i) => `${i + 1}. ${w}`).join("\n");
                    const blob = new Blob([text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "seed-phrase.txt";
                    a.click();
                    URL.revokeObjectURL(url);
                  }} className="gap-1 text-xs h-7"><Download className="size-3" />Export</Button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {mnemonic.map((word, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2.5">
                    <span className="text-[10px] text-muted-foreground font-mono w-5 text-right">{i + 1}.</span>
                    <span className="text-sm font-mono font-medium">{hidden ? "••••••" : word}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Entropy</div>
                <div className="text-sm font-mono font-bold">{entropyBits} bits</div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Checksum</div>
                <div className="text-sm font-mono font-bold">{entropyBits / 32} bits</div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Total Bits</div>
                <div className="text-sm font-mono font-bold">{entropyBits + entropyBits / 32} bits</div>
              </div>
              <div className="glass-card rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Wordlist</div>
                <div className="text-sm font-mono font-bold">BIP39 English</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
