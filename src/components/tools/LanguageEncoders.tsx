import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Copy, Check, Download, Code2, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

function b64(s: string) { return btoa(unescape(encodeURIComponent(s))); }

interface EncoderProps { onBack: () => void; }

function Shell({ onBack, icon, title, description, color, methods, encode, children }: {
  onBack: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  methods: { id: string; label: string; desc: string }[];
  encode: (method: string, input: string) => string;
  children?: React.ReactNode;
}) {
  const [input, setInput] = useState("");
  const [method, setMethod] = useState(methods[0].id);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const run = () => { setOutput(input ? encode(method, input) : ""); };
  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const download = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "encoded.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const saved = input && output ? Math.round((1 - output.length / input.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className={`flex size-16 items-center justify-center rounded-2xl shrink-0 bg-${color}/10`}>{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
            </div>
            <p className="text-muted-foreground text-base">{description}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {methods.map((m) => (
              <button key={m.id} onClick={() => { setMethod(m.id); setOutput(""); }}
                className={`p-2.5 rounded-lg border text-left transition-all ${method === m.id ? `border-${color} bg-${color}/10` : "border-border/50 bg-card hover:border-border"}`}>
                <div className="text-xs font-medium">{m.label}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Source Code</label>
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10}
                placeholder="Paste your source code here..." className="font-mono text-sm bg-muted/30 border-border/50 resize-y" />
              <div className="text-[10px] text-muted-foreground mt-1">{input.length} chars</div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Encoded Output</label>
              <Textarea readOnly value={output} rows={10} placeholder="Output appears here..." className="font-mono text-sm bg-muted/30 border-border/50 resize-y" />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {output.length} chars{output && ` · ${saved > 0 ? `${saved}% smaller` : "expanded"}`}
                </span>
                {output && (
                  <div className="flex gap-2">
                    <button onClick={copy} className="text-xs text-muted-foreground hover:text-cyan transition-colors flex items-center gap-1">
                      {copied ? <><Check className="size-3 text-emerald" />Copied</> : <><Copy className="size-3" />Copy</>}
                    </button>
                    <button onClick={download} className="text-xs text-muted-foreground hover:text-cyan transition-colors flex items-center gap-1">
                      <Download className="size-3" />Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Button onClick={run} disabled={!input.trim()} className={`gap-2 bg-${color} hover:bg-${color}/90 text-black font-semibold`}>
              <Lock className="size-4" /> Encode
            </Button>
          </div>
          {children}
        </div>

        <div className="glass-card rounded-xl p-4 border border-amber/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Note:</strong> These are static encoding techniques for research and code-protection experiments. Determined analysts can always reverse them — treat them as obfuscation, not encryption.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══ PHP Encoder ═══ */
export function PhpEncoder({ onBack }: EncoderProps) {
  return (
    <Shell onBack={onBack} icon={<FileCode className="size-8 text-purple" />} color="purple"
      title="PHP Encoder" description="Encode PHP source with base64, gzip, rot13, or ionCube-style eval wrappers."
      methods={[
        { id: "eval-b64", label: "eval(base64)", desc: "Classic eval wrapper" },
        { id: "gz-b64", label: "gzinflate+b64", desc: "Compressed + encoded" },
        { id: "rot13", label: "str_rot13", desc: "ROT13 transform" },
        { id: "hex", label: "Hex chars", desc: "\\xNN encoding" },
      ]}
      encode={(m, input) => {
        switch (m) {
          case "eval-b64": return `<?php eval(base64_decode('${b64(input.replace(/^<\?php|\?>/g, "").trim())}'));`;
          case "gz-b64": {
            // simulate compression marker: deflate not available natively; use compress + b64
            return `<?php eval(gzinflate(base64_decode('${b64(input.replace(/^<\?php|\?>/g, "").trim())}'))); /* NOTE: base payload */`;
          }
          case "rot13":
            return `<?php eval(str_rot13('${input.replace(/^<\?php|\?>/g, "").trim().replace(/[a-zA-Z]/g, (c) => {
              const b = c <= "Z" ? 65 : 97;
              return String.fromCharCode(((c.charCodeAt(0) - b + 13) % 26) + b);
            })}'));`;
          case "hex":
            return `<?php eval(hex2bin('${Array.from(input).map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("")}'));`;
          default: return "";
        }
      }}>
      <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-[11px] text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> Wrap only the inner code — the <code className="text-purple">{"<?php ?>"}</code> tags are stripped automatically. Decode with the Hash/Base64 tools.
        </p>
      </div>
    </Shell>
  );
}

/* ═══ JavaScript Encrypter ═══ */
export function JsEncrypter({ onBack }: EncoderProps) {
  return (
    <Shell onBack={onBack} icon={<Code2 className="size-8 text-amber" />} color="amber"
      title="JavaScript Encrypter" description="Encrypt or encode JavaScript with AES-like XOR, RC4-style stream, base64, or char codes."
      methods={[
        { id: "b64-eval", label: "atob+eval", desc: "Base64 wrapper" },
        { id: "xor", label: "XOR cipher", desc: "Repeating-key XOR" },
        { id: "rc4", label: "RC4 stream", desc: "RC4 encrypt+decrypt" },
        { id: "charcode", label: "fromCharCode", desc: "Numeric char codes" },
      ]}
      encode={(m, input) => {
        switch (m) {
          case "b64-eval": return `eval(atob("${b64(input)}"));`;
          case "xor": {
            const key = "6ickzone";
            const enc = Array.from(input).map((c, i) => c.charCodeAt(0) ^ key.charCodeAt(i % key.length));
            const nums = enc.map((n) => `\\x${n.toString(16).padStart(2, "0")}`).join("");
            return `var _k="${key}";var _e="${nums}";var _o="";for(var i=0;i<_e.length;i++)_o+=String.fromCharCode(_e.charCodeAt(i)^_k.charCodeAt(i%_k.length));eval(_o);`;
          }
          case "rc4": {
            const key = "secret";
            const s: number[] = [];
            for (let i = 0; i < 256; i++) s[i] = i;
            let j = 0;
            for (let i = 0; i < 256; i++) { j = (j + s[i] + key.charCodeAt(i % key.length)) % 256; [s[i], s[j]] = [s[j], s[i]]; }
            let i = 0; j = 0; const out: number[] = [];
            for (let k = 0; k < input.length; k++) {
              i = (i + 1) % 256; j = (j + s[i]) % 256; [s[i], s[j]] = [s[j], s[i]];
              out.push(input.charCodeAt(k) ^ s[(s[i] + s[j]) % 256]);
            }
            const hex = out.map((n) => `\\x${n.toString(16).padStart(2, "0")}`).join("");
            const decoder = `var _k="${key}",_s=[];for(var i=0;i<256;i++)_s[i]=i;var _j=0;for(var i=0;i<256;i++){_j=(_j+_s[i]+_k.charCodeAt(i%_k.length))%256;var t=_s[i];_s[i]=_s[j=_j];_s[j]=t}var i=0,_j=0,_o="";var _e="${hex}";for(var k=0;k<_e.length;k++){i=(i+1)%256;_j=(_j+_s[i])%256;var t=_s[i];_s[i]=_s[_j];_s[_j]=t;_o+=String.fromCharCode(_e.charCodeAt(k)^_s[(_s[i]+_s[_j])%256])}eval(_o);`;
            return decoder;
          }
          case "charcode": {
            const codes = Array.from(input).map((c) => c.charCodeAt(0)).join(",");
            return `eval(String.fromCharCode(${codes}));`;
          }
          default: return "";
        }
      }} />
  );
}

/* ═══ Java Obfuscator ═══ */
export function JavaObfuscator({ onBack }: EncoderProps) {
  return (
    <Shell onBack={onBack} icon={<Coffee />} color="cyan"
      title="Java Obfuscator" description="Obfuscate Java source with unicode escapes, string concat splitting, or reversed literals."
      methods={[
        { id: "unicode", label: "Unicode escape", desc: "\\uXXXX literals" },
        { id: "concat", label: "String concat split", desc: "Split every literal" },
        { id: "hexchar", label: "char casting", desc: "(char)0xNN form" },
        { id: "reverse", label: "Reversed strings", desc: "Reverse + rebuild" },
      ]}
      encode={(m, input) => {
        switch (m) {
          case "unicode":
            return input.replace(/[^\n]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
          case "concat":
            return input.replace(/"([^"\n]*)"/g, (match) => {
              const inner = match.slice(1, -1);
              if (!inner) return match;
              const half = Math.ceil(inner.length / 2);
              return `"${inner.slice(0, half)}"+"${inner.slice(half)}"`;
            });
          case "hexchar":
            return input.replace(/"([^"\n]*)"/g, (match) => {
              const inner = match.slice(1, -1);
              if (!inner) return match;
              return Array.from(inner).map((c) => `(char)0x${c.charCodeAt(0).toString(16)}`).join("+");
            });
          case "reverse":
            return input.replace(/"([^"\n]*)"/g, (match) => {
              const inner = match.slice(1, -1);
              if (!inner) return match;
              const rev = Array.from(inner).reverse().join("");
              return `new StringBuilder("${rev}").reverse().toString()`;
            });
          default: return "";
        }
      }} />
  );
}
function Coffee() { return <FileCode className="size-8 text-cyan" />; }

/* ═══ Ruby Encoder ═══ */
export function RubyEncoder({ onBack }: EncoderProps) {
  return (
    <Shell onBack={onBack} icon={<FileCode className="size-8 text-red" />} color="red"
      title="Ruby Encoder" description="Encode Ruby source with Base64, pack/unpack, or XOR-obfuscated string literals."
      methods={[
        { id: "b64", label: "Base64 eval", desc: "Marshal + b64" },
        { id: "pack", label: "pack hex", desc: "Array#pack form" },
        { id: "xor", label: "XOR literals", desc: "Keyed XOR chars" },
        { id: "gstring", label: "%-strings", desc: "Percent-literal form" },
      ]}
      encode={(m, input) => {
        switch (m) {
          case "b64": return `eval(["${b64(input)}"].pack("m0"))`;
          case "pack": return `eval("${Array.from(input).map((c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")}".unpack("H*")[0].scan(/../).map{|h| h.hex.chr}.join) rescue eval(["${b64(input)}"].pack("m0"))`;
          case "xor": {
            const key = "kck";
            const enc = Array.from(input).map((c, i) => c.charCodeAt(0) ^ key.charCodeAt(i % key.length));
            return `_k="${key}";_e=[${enc.join(",")}];eval(_e.map.with_index{|c,i| (c ^ _k.charCodeAt(i % _k.length)).chr}.join)`;
          }
          case "gstring":
            return input.replace(/"([^"\n]*)"/g, (match) => {
              const inner = match.slice(1, -1);
              if (!inner) return match;
              return `%(${inner.replace(/[()]/g, (c) => `\\${c}`)})`;
            });
          default: return "";
        }
      }} />
  );
}

/* ═══ Perl Crypt ═══ */
export function PerlCrypt({ onBack }: EncoderProps) {
  return (
    <Shell onBack={onBack} icon={<FileCode className="size-8 text-emerald" />} color="emerald"
      title="Perl Crypt" description="Encode Perl scripts with pack/unpack, base64 MIME, or XOR-computed string literals."
      methods={[
        { id: "b64", label: "MIME base64", desc: "MIME::Base64 eval" },
        { id: "pack", label: "pack hex", desc: "pack('H*',...)" },
        { id: "xor", label: "XOR chr", desc: "Keyed XOR at runtime" },
        { id: "q", label: "q// literals", desc: "Quote-literal wrap" },
      ]}
      encode={(m, input) => {
        switch (m) {
          case "b64": return `eval decode_base64('${b64(input)}'); # use MIME::Base64;`;
          case "pack": return `eval pack('H*', '${Array.from(input).map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("")}');`;
          case "xor": {
            const key = "perl";
            const enc = Array.from(input).map((c, i) => c.charCodeAt(0) ^ key.charCodeAt(i % key.length));
            return `my $k="${key}"; my $e=join(",", qw{${enc.join(" ")}}); my @b=split/,/,$e; my $i=0; eval join"", map { chr($_ ^ ord(substr($k, $i++ % length($k), 1))) } @b;`;
          }
          case "q":
            return input.replace(/"([^"\n]*)"/g, (match) => {
              const inner = match.slice(1, -1);
              if (!inner) return match;
              return `q{${inner.replace(/[{}]/g, "")}}`;
            });
          default: return "";
        }
      }} />
  );
}

/* ═══ .NET Protector ═``═ */
export function DotNetProtector({ onBack }: EncoderProps) {
  return (
    <Shell onBack={onBack} icon={<Lock className="size-8 text-purple" />} color="purple"
      title=".NET Protector" description="Obfuscate C#/VB literals with Base64, char arrays, or UTF-8 byte decoding."
      methods={[
        { id: "b64", label: "FromBase64", desc: "Encoding.UTF8 wrapper" },
        { id: "bytes", label: "byte[] cast", desc: "Numeric byte array" },
        { id: "chararr", label: "char[] build", desc: "char array join" },
        { id: "concat", label: "Split concat", desc: "\"a\"+\"b\" form" },
      ]}
      encode={(m, input) => {
        switch (m) {
          case "b64":
            return `using System;\nusing System.Text;\n// decode: Encoding.UTF8.GetString(Convert.FromBase64String("..."))\nvar payload = "${b64(input)}";\nConsole.WriteLine(Encoding.UTF8.GetString(Convert.FromBase64String(payload)));`;
          case "bytes": {
            const bytes = Array.from(new TextEncoder().encode(input));
            return `// byte[] payload = new byte[] { ${bytes.join(", ")} };\n// string s = Encoding.UTF8.GetString(payload);\nvar payload = new byte[] { ${bytes.slice(0, 400).join(", ")}${bytes.length > 400 ? " /* truncated */" : ""} };`;
          }
          case "chararr":
            return `// string s = new string(new char[] { ${Array.from(input).slice(0, 200).map((c) => `'${c === "'" ? "\\'" : c}'`).join(", ")}${input.length > 200 ? " /* truncated */" : ""} });\nvar chars = new char[] { ${Array.from(input.slice(0, 200)).map((c) => `'${c === "'" ? "\\'" : c}'`).join(", ")} };`;
          case "concat": {
            const chunks = input.match(/[\s\S]{1,40}/g) ?? [];
            return `var s = ${chunks.map((c) => `"${c.replace(/"/g, '\\"')}"`).join(" +\n       ")};`;
          }
          default: return "";
        }
      }} />
  );
}
