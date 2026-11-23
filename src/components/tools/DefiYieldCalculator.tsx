import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, DollarSign, Clock, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CalculationResult {
  totalBalance: number;
  totalYield: number;
  effectiveAPY: number;
  dailyRate: number;
  timeline: Array<{ month: number; balance: number; yield: number }>;
}

function calculateYield(principal: number, apy: number, months: number, compoundFrequency: number): CalculationResult {
  const dailyRate = apy / 365;
  const effectiveAPY = Math.pow(1 + dailyRate, 365) - 1;
  const timeline: Array<{ month: number; balance: number; yield: number }> = [];

  let balance = principal;
  const daysInMonth = 30;

  for (let m = 1; m <= months; m++) {
    const startBalance = balance;
    // Simulate daily compounding for this month
    for (let d = 0; d < daysInMonth; d++) {
      if (compoundFrequency === 0) {
        // Simple interest
        balance += principal * dailyRate;
      } else if (compoundFrequency === 1) {
        // Daily compounding
        balance *= (1 + dailyRate);
      } else if (compoundFrequency === 365) {
        balance *= (1 + dailyRate);
      } else {
        // Custom compound frequency
        const periodRate = apy / compoundFrequency;
        balance *= (1 + periodRate / 365);
      }
    }
    timeline.push({
      month: m,
      balance: Math.round(balance * 100) / 100,
      yield: Math.round((balance - startBalance) * 100) / 100,
    });
  }

  return {
    totalBalance: Math.round(balance * 100) / 100,
    totalYield: Math.round((balance - principal) * 100) / 100,
    effectiveAPY: Math.round(effectiveAPY * 10000) / 100,
    dailyRate: Math.round(dailyRate * 10000) / 100,
    timeline,
  };
}

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface DefiYieldCalculatorProps {
  onBack: () => void;
}

export function DefiYieldCalculator({ onBack }: DefiYieldCalculatorProps) {
  const [principal, setPrincipal] = useState("10000");
  const [apy, setApy] = useState("12");
  const [months, setMonths] = useState("12");
  const [compoundFreq, setCompoundFreq] = useState(365);

  const result = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const a = (parseFloat(apy) || 0) / 100;
    const m = parseInt(months) || 12;
    if (p <= 0 || a <= 0) return null;
    return calculateYield(p, a, m, compoundFreq);
  }, [principal, apy, months, compoundFreq]);

  const presets = [
    { label: "Aave USDC", apy: "5.2", icon: "🔵" },
    { label: "Compound ETH", apy: "3.8", icon: "🟢" },
    { label: "Uniswap V3 ETH/USDC", apy: "25", icon: "🦄" },
    { label: "Curve 3pool", apy: "8.5", icon: "🔷" },
    { label: "Lido stETH", apy: "4.1", icon: "🌊" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-emerald/10">
            <TrendingUp className="size-8 text-emerald" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">DeFi Yield Calculator</h1>
            <p className="text-muted-foreground text-base">Calculate projected yields with compounding across DeFi protocols.</p>
          </div>
        </div>

        {/* Protocol presets */}
        <div className="glass-card rounded-xl p-4 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Quick Presets</label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p.label} onClick={() => setApy(p.apy)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-card hover:border-emerald/30 hover:bg-emerald/5 transition-all text-xs">
                <span>{p.icon}</span>
                <span className="font-medium">{p.label}</span>
                <span className="text-emerald">{p.apy}%</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="size-4 text-emerald" /> Input</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Principal Amount (USD)</label>
              <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="10000" className="font-mono text-lg" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">APY (%)</label>
              <Input type="number" value={apy} onChange={(e) => setApy(e.target.value)} placeholder="12" className="font-mono text-lg" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duration (months)</label>
              <Input type="number" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="12" className="font-mono text-lg" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Compound Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Simple", value: 0 },
                  { label: "Daily", value: 365 },
                  { label: "Weekly", value: 52 },
                  { label: "Monthly", value: 12 },
                ].map((f) => (
                  <button key={f.value} onClick={() => setCompoundFreq(f.value)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${compoundFreq === f.value ? "border-emerald bg-emerald/10 text-emerald" : "border-border/50 bg-card text-muted-foreground hover:border-border"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {result ? (
              <>
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><TrendingUp className="size-4 text-emerald" /> Results</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald/5 border border-emerald/20 rounded-xl p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Final Balance</div>
                      <div className="text-lg font-bold text-emerald">{formatCurrency(result.totalBalance)}</div>
                    </div>
                    <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Total Yield</div>
                      <div className="text-lg font-bold text-cyan">+{formatCurrency(result.totalYield)}</div>
                    </div>
                    <div className="bg-amber/5 border border-amber/20 rounded-xl p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Effective APY</div>
                      <div className="text-lg font-bold text-amber">{result.effectiveAPY}%</div>
                    </div>
                    <div className="bg-purple/5 border border-purple/20 rounded-xl p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Daily Rate</div>
                      <div className="text-lg font-bold text-purple">{result.dailyRate}%</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center text-xs text-muted-foreground">
                    ROI: {((result.totalYield / parseFloat(principal)) * 100).toFixed(2)}% over {months} months
                  </div>
                </div>

                {/* Timeline chart */}
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="size-4 text-cyan" /> Monthly Projection</h3>
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                    {result.timeline.map((t) => {
                      const maxBalance = result.totalBalance;
                      const widthPct = (t.balance / maxBalance) * 100;
                      return (
                        <div key={t.month} className="flex items-center gap-2 text-xs">
                          <span className="w-8 text-muted-foreground text-right">M{t.month}</span>
                          <div className="flex-1 h-4 bg-muted/20 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald/40 rounded-full transition-all duration-500" style={{ width: `${widthPct}%` }} />
                          </div>
                          <span className="w-20 text-right font-mono text-emerald">{formatCurrency(t.balance)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center">
                <TrendingUp className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Enter an amount and APY to see yield projections.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
