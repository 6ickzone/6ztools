import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Search, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { proxyFetch } from "@/lib/proxyFetch";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  total_volume: number;
  market_cap_rank: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  image: string;
}

const POPULAR_COINS = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin" },
  { id: "ethereum", symbol: "eth", name: "Ethereum" },
  { id: "solana", symbol: "sol", name: "Solana" },
  { id: "binancecoin", symbol: "bnb", name: "BNB" },
  { id: "ripple", symbol: "xrp", name: "XRP" },
  { id: "cardano", symbol: "ada", name: "Cardano" },
  { id: "dogecoin", symbol: "doge", name: "Dogecoin" },
  { id: "polkadot", symbol: "dot", name: "Polkadot" },
  { id: "avalanche-2", symbol: "avax", name: "Avalanche" },
  { id: "chainlink", symbol: "link", name: "Chainlink" },
  { id: "matic-network", symbol: "matic", name: "Polygon" },
  { id: "uniswap", symbol: "uni", name: "Uniswap" },
];

function formatPrice(n: number): string {
  if (n >= 1) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(6)}`;
}

function formatMarketCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function formatSupply(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString();
}

interface CryptoPriceTrackerProps {
  onBack: () => void;
}

export function CryptoPriceTracker({ onBack }: CryptoPriceTrackerProps) {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ids = POPULAR_COINS.map((c) => c.id).join(",");
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await proxyFetch(url, { signal: controller.signal });
      clearTimeout(timer);

      const text = await res.text();
      if (text.includes("<!doctype") || text.includes("<html")) {
        setError("API returned HTML instead of JSON — rate limited or blocked. Try again later.");
        setCoins(POPULAR_COINS.map((c, i) => ({
          id: c.id, symbol: c.symbol, name: c.name,
          current_price: 0, market_cap: 0, price_change_percentage_24h: 0,
          total_volume: 0, market_cap_rank: i + 1, high_24h: 0, low_24h: 0,
          circulating_supply: 0, total_supply: null, ath: 0, ath_change_percentage: 0, image: "",
        })));
      } else {
        const data = JSON.parse(text);
        setCoins(data);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices. CoinGecko API may be rate-limited.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const filtered = coins.filter((c) =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-amber/10">
            <TrendingUp className="size-8 text-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Crypto Price Tracker</h1>
            <p className="text-muted-foreground text-base">Real-time cryptocurrency prices powered by CoinGecko. {POPULAR_COINS.length} coins tracked.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search coins..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Button onClick={fetchPrices} disabled={loading} variant="outline" className="gap-2">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {loading ? "Updating..." : "Refresh"}
          </Button>
          {lastUpdated && <span className="text-xs text-muted-foreground self-center">Updated: {lastUpdated}</span>}
        </div>

        {error && (
          <div className="glass-card rounded-xl p-4 border border-amber/20 bg-amber/5 mb-6">
            <p className="text-sm text-amber">{error}</p>
          </div>
        )}

        {selectedCoin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {selectedCoin.image && <img src={selectedCoin.image} alt={selectedCoin.name} className="size-10 rounded-full" />}
                <div>
                  <h2 className="text-lg font-bold">{selectedCoin.name}</h2>
                  <span className="text-xs text-muted-foreground uppercase">{selectedCoin.symbol}</span>
                </div>
                <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full">#{selectedCoin.market_cap_rank}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCoin(null)}>✕</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">Price</div>
                <div className="text-sm font-bold">{formatPrice(selectedCoin.current_price)}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">24h Change</div>
                <div className={`text-sm font-bold ${(selectedCoin.price_change_percentage_24h ?? 0) >= 0 ? "text-emerald" : "text-red"}`}>
                  {(selectedCoin.price_change_percentage_24h ?? 0) >= 0 ? "+" : ""}{(selectedCoin.price_change_percentage_24h ?? 0).toFixed(2)}%
                </div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">24h High / Low</div>
                <div className="text-xs"><span className="text-emerald">{formatPrice(selectedCoin.high_24h)}</span> / <span className="text-red">{formatPrice(selectedCoin.low_24h)}</span></div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">Market Cap</div>
                <div className="text-sm font-bold">{formatMarketCap(selectedCoin.market_cap)}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">Volume (24h)</div>
                <div className="text-sm font-bold">{formatMarketCap(selectedCoin.total_volume)}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">Circulating Supply</div>
                <div className="text-sm font-bold">{formatSupply(selectedCoin.circulating_supply)}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">All-Time High</div>
                <div className="text-sm font-bold">{formatPrice(selectedCoin.ath)}</div>
                <div className="text-[10px] text-red">{selectedCoin.ath_change_percentage.toFixed(2)}% from ATH</div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">#</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Coin</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">24h %</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Market Cap</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Volume (24h)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((coin) => (
                  <tr key={coin.id} onClick={() => setSelectedCoin(coin)} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="px-5 py-3 text-xs text-muted-foreground">{coin.market_cap_rank}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {coin.image && <img src={coin.image} alt={coin.name} className="size-6 rounded-full" />}
                        <div>
                          <span className="font-medium text-sm">{coin.name}</span>
                          <span className="text-xs text-muted-foreground ml-1.5 uppercase">{coin.symbol}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-sm font-medium">{formatPrice(coin.current_price)}</td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${(coin.price_change_percentage_24h ?? 0) >= 0 ? "text-emerald" : "text-red"}`}>
                        {(coin.price_change_percentage_24h ?? 0) >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground hidden sm:table-cell">{formatMarketCap(coin.market_cap)}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground hidden md:table-cell">{formatMarketCap(coin.total_volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && !loading && (
            <div className="p-8 text-center text-sm text-muted-foreground">No coins match your search.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
