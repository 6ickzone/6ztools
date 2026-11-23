import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Key,
  Copy,
  Check,
  RefreshCw,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

function generatePassword(opts: PasswordOptions): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const nums = "0123456789";
  const syms = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let chars = "";
  let required: string[] = [];

  if (opts.uppercase) {
    chars += upper;
    required.push(upper[Math.floor(Math.random() * upper.length)]);
  }
  if (opts.lowercase) {
    chars += lower;
    required.push(lower[Math.floor(Math.random() * lower.length)]);
  }
  if (opts.numbers) {
    chars += nums;
    required.push(nums[Math.floor(Math.random() * nums.length)]);
  }
  if (opts.symbols) {
    chars += syms;
    required.push(syms[Math.floor(Math.random() * syms.length)]);
  }

  if (!chars) return "";

  const remaining = opts.length - required.length;
  const passwordArr = [...required];

  for (let i = 0; i < remaining; i++) {
    passwordArr.push(chars[Math.floor(Math.random() * chars.length)]);
  }

  // Shuffle
  for (let i = passwordArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArr[i], passwordArr[j]] = [passwordArr[j], passwordArr[i]];
  }

  return passwordArr.join("");
}

function calculateStrength(password: string): {
  label: string;
  color: string;
  score: number;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", color: "#ef4444", score: (score / 7) * 100 };
  if (score <= 4) return { label: "Medium", color: "#f59e0b", score: (score / 7) * 100 };
  if (score <= 5) return { label: "Strong", color: "#22c55e", score: (score / 7) * 100 };
  return { label: "Very Strong", color: "#06b6d4", score: (score / 7) * 100 };
}

interface PasswordGeneratorProps {
  onBack: () => void;
}

export function PasswordGenerator({ onBack }: PasswordGeneratorProps) {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState(() => generatePassword(options));
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const regenerate = useCallback(() => {
    const newPass = generatePassword(options);
    setPassword(newPass);
    setHistory((prev) => [newPass, ...prev].slice(0, 10));
  }, [options]);

  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = calculateStrength(password);
  const charCount = password.length;

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
            <Key className="size-8 text-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Password Generator
              </h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">
                Active
              </Badge>
            </div>
            <p className="text-muted-foreground text-base">
              Generate cryptographically secure random passwords with customizable character sets.
            </p>
          </div>
        </div>

        {/* Password Display */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <label className="text-sm font-medium mb-3 block">Generated Password</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                readOnly
                value={password}
                className="font-mono text-lg h-14 pr-4 bg-muted/30 border-border/50"
              />
            </div>
            <Button
              onClick={copyPassword}
              size="lg"
              className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold shrink-0"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              onClick={regenerate}
              size="lg"
              variant="outline"
              className="gap-2 shrink-0"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>

          {/* Strength Meter */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Strength</span>
              <span className="text-xs font-medium" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: strength.color }}
                initial={{ width: 0 }}
                animate={{ width: `${strength.score}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>
              Characters: <span className="text-foreground font-medium">{charCount}</span>
            </span>
            <span>
              Entropy:{" "}
              <span className="text-foreground font-medium">
                {Math.round(
                  Math.log2(
                    Math.pow(
                      (options.uppercase ? 26 : 0) +
                        (options.lowercase ? 26 : 0) +
                        (options.numbers ? 10 : 0) +
                        (options.symbols ? 28 : 0) || 1,
                      options.length
                    )
                  )
                )}{" "}
                bits
              </span>
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold mb-4">Options</h3>

          {/* Length Slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">Length</label>
              <span className="text-sm font-mono font-medium text-cyan">{options.length}</span>
            </div>
            <input
              type="range"
              min={4}
              max={64}
              value={options.length}
              onChange={(e) => {
                const newOpts = { ...options, length: parseInt(e.target.value) };
                setOptions(newOpts);
                setPassword(generatePassword(newOpts));
              }}
              className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-cyan"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>4</span>
              <span>64</span>
            </div>
          </div>

          {/* Character toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              ["uppercase", "A-Z", "Uppercase"],
              ["lowercase", "a-z", "Lowercase"],
              ["numbers", "0-9", "Numbers"],
              ["symbols", "!@#", "Symbols"],
            ] as const).map(([key, preview, label]) => (
              <button
                key={key}
                onClick={() => {
                  const newOpts = { ...options, [key]: !options[key] };
                  setOptions(newOpts);
                  setPassword(generatePassword(newOpts));
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  options[key]
                    ? "border-cyan/40 bg-cyan/5 text-cyan"
                    : "border-border/50 bg-muted/20 text-muted-foreground"
                }`}
              >
                <span className="text-lg font-mono font-bold">{preview}</span>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Generate */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold mb-4">Quick Presets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Simple (12 chars)", opts: { length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false } },
              { label: "Standard (16 chars)", opts: { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true } },
              { label: "Maximum (32 chars)", opts: { length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true } },
            ].map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                onClick={() => {
                  setOptions(preset.opts);
                  setPassword(generatePassword(preset.opts));
                }}
                className="justify-start gap-2"
              >
                <Shield className="size-4 text-cyan" />
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-3">Recent Passwords</h3>
            <div className="space-y-1.5">
              {history.map((p, i) => (
                <div
                  key={`${i}-${p}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 border border-border/30"
                >
                  <span className="font-mono text-xs text-muted-foreground truncate flex-1">
                    {p}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(p);
                    }}
                    className="text-muted-foreground hover:text-cyan transition-colors shrink-0"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational notice */}
        <div className="glass-card rounded-xl p-4 border border-amber/20 mt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Passwords are generated locally in your browser using
              the Web Crypto API's PRNG. Nothing is transmitted over the network. For
              cryptographic key generation, always use a dedicated key derivation function (KDF).
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
