import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Hash,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HashResult {
  algorithm: string;
  hash: string;
}

const algorithms = ["SHA-1", "SHA-256", "SHA-384", "SHA-512", "MD5"];

// Simple MD5 implementation
function md5(input: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function binlMD5(x: number[], len: number): number[] {
    x[len >> 5] |= 0x80 << (len % 32);
    x[((len + 64) >>> 9 << 4) + 14] = len;
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (let i = 0; i < x.length; i += 16) {
      const olda = a, oldb = b, oldc = c, oldd = d;
      a = md5ff(a, b, c, d, x[i], 7, -680876936);
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
      a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, x[i + 0], 11, -358537222);
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
      a = md5ii(a, b, c, d, x[i], 6, -198630844);
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
    }
    return [a, b, c, d];
  }

  function binl2rstr(input: number[]): string {
    let output = "";
    for (let i = 0; i < input.length * 32; i += 8) {
      output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff);
    }
    return output;
  }

  function rstr2binl(input: string): number[] {
    const output: number[] = [];
    for (let i = 0; i < input.length * 8; i += 8) {
      output[i >> 5] |= input.charCodeAt(i / 8) << (i % 32);
    }
    return output;
  }

  function rstrMD5(s: string): string {
    return binl2rstr(binlMD5(rstr2binl(s), s.length * 8));
  }

  function str2rstrUTF8(input: string): string {
    return unescape(encodeURIComponent(input));
  }

  function hexMD5(s: string): string {
    const hex_chr = "0123456789abcdef";
    let output = "";
    const x = rstr2binl(rstrMD5(str2rstrUTF8(input)));
    for (let i = 0; i < x.length; i++) {
      const val = x[i];
      for (let j = 0; j < 4; j++) {
        output += hex_chr.charAt((val >>> (j * 8 + 4)) & 0x0f) + hex_chr.charAt((val >>> (j * 8)) & 0x0f);
      }
    }
    return output;
  }

  return hexMD5(input);
}

async function computeHash(algorithm: string, input: string): Promise<string> {
  if (algorithm === "MD5") {
    return md5(input);
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const webCryptoAlgo = algorithm === "SHA-1" ? "SHA-1" : algorithm;
  const hashBuffer = await crypto.subtle.digest(webCryptoAlgo, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface HashGeneratorProps {
  onBack: () => void;
}

export function HashGenerator({ onBack }: HashGeneratorProps) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<HashResult[]>([]);
  const [computing, setComputing] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const computeAll = async () => {
    if (!input) return;
    setComputing(true);
    const hashes: HashResult[] = [];
    for (const algo of algorithms) {
      const hash = await computeHash(algo, input);
      hashes.push({ algorithm: algo, hash });
    }
    setResults(hashes);
    setComputing(false);
  };

  const copyHash = (hash: string, idx: number) => {
    navigator.clipboard.writeText(hash);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyAll = () => {
    const all = results.map((r) => `${r.algorithm}: ${r.hash}`).join("\n");
    navigator.clipboard.writeText(all);
    setCopiedIdx(-1);
    setTimeout(() => setCopiedIdx(null), 2000);
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
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10">
            <Hash className="size-8 text-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Hash Generator
              </h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">
                Active
              </Badge>
            </div>
            <p className="text-muted-foreground text-base">
              Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any input string.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            Input Text
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            rows={4}
            className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 text-sm font-mono outline-none focus:border-cyan/40 focus:ring-2 focus:ring-cyan/10 resize-y placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">
              {input.length} characters
            </span>
            <Button
              onClick={computeAll}
              disabled={!input || computing}
              className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold"
            >
              {computing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Hash className="size-4" />
              )}
              {computing ? "Computing..." : "Generate Hashes"}
            </Button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Hashes ({results.length} algorithms)
              </h3>
              <Button variant="outline" size="sm" onClick={copyAll} className="gap-1.5">
                {copiedIdx === -1 ? (
                  <Check className="size-3 text-emerald" />
                ) : (
                  <Copy className="size-3" />
                )}
                Copy All
              </Button>
            </div>

            {results.map((r, i) => (
              <div
                key={r.algorithm}
                className="glass-card rounded-xl p-4 border border-border/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {r.algorithm}
                  </Badge>
                  <button
                    onClick={() => copyHash(r.hash, i)}
                    className="text-muted-foreground hover:text-cyan transition-colors"
                  >
                    {copiedIdx === i ? (
                      <Check className="size-3.5 text-emerald" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
                <code className="text-xs font-mono text-muted-foreground break-all block bg-muted/30 rounded-lg p-3">
                  {r.hash}
                </code>
                <div className="text-[10px] text-muted-foreground mt-2">
                  {r.hash.length * 4} bits · {r.hash.length} hex chars
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Note */}
        <div className="glass-card rounded-xl p-4 border border-amber/20 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> SHA-1, SHA-256, SHA-384, and
              SHA-512 are computed using the Web Crypto API. MD5 is provided for legacy
              checksum verification only — it should never be used for password hashing or
              digital signatures.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
