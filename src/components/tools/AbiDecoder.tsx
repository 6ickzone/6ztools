import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Code, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

const SOLIDITY_TYPES: Record<string, { name: string; size: number }> = {
  "uint256": { name: "uint256", size: 32 },
  "uint128": { name: "uint128", size: 32 },
  "uint64": { name: "uint64", size: 32 },
  "uint32": { name: "uint32", size: 32 },
  "uint16": { name: "uint16", size: 32 },
  "uint8": { name: "uint8", size: 32 },
  "int256": { name: "int256", size: 32 },
  "int128": { name: "int128", size: 32 },
  "int64": { name: "int64", size: 32 },
  "int32": { name: "int32", size: 32 },
  "int16": { name: "int16", size: 32 },
  "int8": { name: "int8", size: 32 },
  "address": { name: "address", size: 32 },
  "bool": { name: "bool", size: 32 },
  "bytes32": { name: "bytes32", size: 32 },
  "bytes": { name: "bytes", size: 32 },
  "string": { name: "string", size: 32 },
};

function decodeABI(calldata: string, paramTypes: string[]): DecodedParam[] {
  const clean = calldata.replace(/^0x/, "").replace(/[^0-9a-fA-F]/g, "");
  if (clean.length < 8) return [];

  const results: DecodedParam[] = [];

  // First 4 bytes = function selector
  const selector = clean.slice(0, 8);
  results.push({ name: "Function Selector", type: "bytes4", value: `0x${selector}`, hex: `0x${selector}` });

  // Decode each parameter from the remaining data
  let offset = 8;
  for (let i = 0; i < paramTypes.length; i++) {
    const type = paramTypes[i] || "uint256";
    const isDynamic = type === "string" || type === "bytes" || type.endsWith("[]");

    if (isDynamic) {
      // Dynamic type: read offset pointer
      if (offset + 64 <= clean.length) {
        const pointerHex = clean.slice(offset, offset + 64);
        const pointer = parseInt(pointerHex, 16);
        results.push({ name: `param${i}`, type, value: `(dynamic @ offset ${pointer})`, hex: `0x${pointerHex}` });
        offset += 64;
      }
    } else {
      // Static type: read 32 bytes
      if (offset + 64 <= clean.length) {
        const valueHex = clean.slice(offset, offset + 64);
        let value: string;

        if (type === "address") {
          value = "0x" + valueHex.slice(24);
        } else if (type === "bool") {
          value = valueHex === "0".repeat(63) + "1" ? "true" : "false";
        } else if (type.startsWith("uint")) {
          value = BigInt("0x" + valueHex).toString();
        } else if (type.startsWith("int")) {
          const unsigned = BigInt("0x" + valueHex);
          const max = BigInt(1) << BigInt(parseInt(type.slice(3)) - 1);
          value = unsigned >= max ? (unsigned - (BigInt(1) << BigInt(parseInt(type.slice(3))))).toString() : unsigned.toString();
        } else {
          value = "0x" + valueHex;
        }

        results.push({ name: `param${i}`, type, value, hex: "0x" + valueHex });
        offset += 64;
      }
    }
  }

  return results;
}

interface DecodedParam {
  name: string;
  type: string;
  value: string;
  hex: string;
}

const SAMPLE_ABI = "0xa9059cbb0000000000000000000000008ba1f109551bd432803012645ac136ddd64dba72000000000000000000000000000000000000000000000056bc75e2d63100000";
const SAMPLE_TYPES = "address,uint256";

interface AbiDecoderProps {
  onBack: () => void;
}

export function AbiDecoder({ onBack }: AbiDecoderProps) {
  const [calldata, setCalldata] = useState(SAMPLE_ABI);
  const [types, setTypes] = useState(SAMPLE_TYPES);
  const [decoded, setDecoded] = useState<DecodedParam[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = () => {
    setError(null);
    try {
      const paramTypes = types.split(",").map((t) => t.trim()).filter(Boolean);
      const result = decodeABI(calldata, paramTypes);
      if (result.length === 0) {
        setError("No parameters to decode. Make sure calldata and types match.");
      }
      setDecoded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decode ABI data");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10">
            <Code className="size-8 text-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">ABI Decoder</h1>
            <p className="text-muted-foreground text-base">Decode Solidity ABI-encoded calldata into readable parameter values.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Calldata (hex)</label>
            <Textarea value={calldata} onChange={(e) => setCalldata(e.target.value)} placeholder="0xa9059cbb000000..." className="font-mono text-xs min-h-[80px] bg-muted/30 border-border/50" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Parameter Types (comma-separated)</label>
            <Input value={types} onChange={(e) => setTypes(e.target.value)} placeholder="address,uint256" className="font-mono text-sm" />
            <p className="text-[10px] text-muted-foreground mt-1">Supported: uint8-256, int8-256, address, bool, bytes1-32, bytes, string</p>
          </div>
          <Button onClick={handleDecode} disabled={!calldata.trim()} className="w-full gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold">
            <Code className="size-4" /> Decode
          </Button>
        </div>

        {error && (
          <div className="glass-card rounded-xl p-4 border border-red/20 mb-6">
            <p className="text-sm text-red">{error}</p>
          </div>
        )}

        {decoded.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Decoded Parameters ({decoded.length})</h3>
              <CopyButton text={JSON.stringify(decoded, null, 2)} />
            </div>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">#</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Name</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Value</th>
                      <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Hex</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decoded.map((param, i) => (
                      <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-2.5 text-xs text-muted-foreground">{i}</td>
                        <td className="px-5 py-2.5 text-sm font-medium">{param.name}</td>
                        <td className="px-5 py-2.5"><Badge variant="outline" className="text-[10px]">{param.type}</Badge></td>
                        <td className="px-5 py-2.5 font-mono text-xs text-emerald break-all max-w-[200px] truncate" title={param.value}>{param.value}</td>
                        <td className="px-5 py-2.5 font-mono text-[10px] text-muted-foreground break-all max-w-[150px] truncate" title={param.hex}>{param.hex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
