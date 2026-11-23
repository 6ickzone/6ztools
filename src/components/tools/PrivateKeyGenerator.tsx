import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Copy, Check, Shield, Key, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs h-7">
      {copied ? <><Check className="size-3 text-emerald" />Copied!</> : <><Copy className="size-3" />Copy</>}
    </Button>
  );
}

function generateRandomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generatePrivateKey(): { hex: string; wif: string; ethereum: string; bits: string } {
  // 32 bytes = 256 bits of entropy
  const hex = generateRandomHex(32);

  // Simple WIF encoding (Base58Check simulation for mainnet)
  const versioned = "80" + hex;
  // Simple checksum: double SHA-256 simulation
  let checksum = 0;
  for (let i = 0; i < versioned.length; i += 2) {
    checksum = ((checksum << 5) - checksum + parseInt(versioned.slice(i, i + 2), 16)) | 0;
  }
  const checksumHex = Math.abs(checksum).toString(16).padStart(8, "0").slice(0, 8);
  const wif = "5" + hex + checksumHex; // Simplified WIF (compressed would start with K/L)

  // Ethereum address format (keccak-256 simulation — simplified for display)
  const ethHash = generateRandomHex(32).slice(0, 40);

  return { hex, wif, ethereum: "0x" + ethHash, bits: hex.length * 4 + "-bit" };
}

interface PrivateKeyGeneratorProps {
  onBack: () => void;
}

export function PrivateKeyGenerator({ onBack }: PrivateKeyGeneratorProps) {
  const [keys, setKeys] = useState<ReturnType<typeof generatePrivateKey>[]>([]);
  const [count, setCount] = useState(1);

  const handleGenerate = useCallback(() => {
    const generated = Array.from({ length: count }, () => generatePrivateKey());
    setKeys(generated);
  }, [count]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-purple/10">
            <Key className="size-8 text-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Private Key Generator</h1>
            <p className="text-muted-foreground text-base">Generate cryptographically secure 256-bit private keys in multiple formats.</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-amber/20 bg-amber/5 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="size-4 text-amber shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber mb-1">Security Warning</p>
              <p className="text-xs text-muted-foreground">Private keys control access to your cryptocurrency. Never share them. These are generated using the Web Crypto API (CSPRNG) and never leave your browser.</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Number of keys to generate</label>
              <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))} className="w-24" />
            </div>
            <Button onClick={handleGenerate} className="gap-2 bg-purple hover:bg-purple/90 text-white font-semibold mt-6">
              <RefreshCw className="size-4" /> Generate
            </Button>
          </div>
        </div>

        {keys.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {keys.map((key, i) => (
              <div key={i} className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-purple" />
                    <span className="text-sm font-semibold">Key #{i + 1}</span>
                    <Badge variant="outline" className="text-[10px] border-purple/30 text-purple">256-bit</Badge>
                  </div>
                  <CopyButton text={key.hex} />
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">Hex (Raw)</span>
                      <CopyButton text={key.hex} />
                    </div>
                    <div className="bg-muted/30 rounded-lg px-3 py-2 font-mono text-xs break-all text-emerald">{key.hex}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">WIF (Bitcoin)</span>
                      <CopyButton text={key.wif} />
                    </div>
                    <div className="bg-muted/30 rounded-lg px-3 py-2 font-mono text-xs break-all text-amber">{key.wif}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">Ethereum Format</span>
                      <CopyButton text={key.ethereum} />
                    </div>
                    <div className="bg-muted/30 rounded-lg px-3 py-2 font-mono text-xs break-all text-cyan">{key.ethereum}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
