import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, MapPin, Wifi, Server, Copy, Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { proxyFetch } from "@/lib/proxyFetch";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-cyan transition-colors">
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

interface IpInfo {
  query: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

interface IpLookupProps {
  onBack: () => void;
}

export function IpLookup({ onBack }: IpLookupProps) {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IpInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleLookup = async (target?: string) => {
    const query = target || ip.trim();
    if (!query && !target) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    setData(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      // Primary source: ipstack with the account key, which the backend proxy
      // injects server-side — the key never reaches the browser bundle.
      const ipstackUrl = query
        ? `https://api.ipstack.com/${encodeURIComponent(query)}`
        : "https://api.ipstack.com/check";

      let json: IpInfo | null = null;
      let quotaNotice: string | null = null;
      try {
        const res = await proxyFetch(ipstackUrl, { signal: controller.signal });
        let payload = await res.json();
        // The free plan also allows ~1 request/second, and a burst reads as code 106
        // too — one retry separates a click-spam from a real monthly-quota hit.
        if (payload?.error?.code === 106) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          const retry = await proxyFetch(ipstackUrl, { signal: controller.signal });
          payload = await retry.json();
        }
        if (payload?.error) {
          quotaNotice =
            payload.error.code === 106
              ? "ipapi free plan limit reached (100 requests/month, ~1 request/second). Showing data from the free ip-api endpoint instead — 45 requests/minute, no key required."
              : `ipapi lookup unavailable (${payload.error.type ?? payload.error.code ?? "error"}). Showing data from the free ip-api endpoint instead.`;
        }
        if (payload?.ip && !payload.error) {
          json = {
            query: payload.ip,
            country: payload.country_name ?? "",
            countryCode: payload.country_code ?? "",
            region: payload.region_code ?? "",
            regionName: payload.region_name ?? "",
            city: payload.city ?? "",
            zip: payload.zip ?? "",
            lat: payload.latitude ?? 0,
            lon: payload.longitude ?? 0,
            timezone: payload.timezone?.id ?? "",
            isp: payload.connection?.isp ?? "",
            org: payload.connection?.org ?? "",
            as: payload.connection?.asn ? `AS${payload.connection.asn}` : "",
          };
        }
      } catch {
        /* quota reached or unreachable — fall back below */
      }

      // Fallback: ip-api's free HTTP endpoint (45 req/min, no key required).
      if (!json) {
        const url = `http://ip-api.com/json/${encodeURIComponent(query)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
        const res = await proxyFetch(url, { signal: controller.signal });
        const payload = await res.json();
        if (payload?.status === "fail") {
          throw new Error(payload.message || "Lookup failed");
        }
        json = payload as IpInfo;
      }

      setNotice(quotaNotice);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to lookup IP");
    } finally {
      clearTimeout(timer);
    }
    setLoading(false);
  };

  const handleMyIp = () => { setIp(""); handleLookup(""); };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-cyan/10">
            <Globe className="size-8 text-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">IP Lookup</h1>
            <p className="text-muted-foreground text-base">Geolocation, ISP, timezone, and ASN data for any IPv4/IPv6 address.</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Enter IP address or leave empty for your own" value={ip} onChange={(e) => setIp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleLookup()} className="pl-10" disabled={loading} />
            </div>
            <Button onClick={() => handleLookup()} disabled={loading} className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Lookup
            </Button>
            <Button variant="outline" onClick={handleMyIp} disabled={loading}>My IP</Button>
          </div>
        </div>

        {error && <div className="glass-card rounded-xl p-4 border border-red/20 mb-6"><p className="text-sm text-red">{error}</p></div>}

        {notice && <div className="glass-card rounded-xl p-4 border border-amber/20 mb-6"><p className="text-sm text-amber">{notice}</p></div>}

        {data && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-mono">{data.query}</h2>
                <CopyButton text={data.query} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: MapPin, label: "Country", value: `${data.country} (${data.countryCode})`, color: "text-emerald" },
                  { icon: MapPin, label: "Region", value: `${data.regionName}, ${data.city}`, color: "text-cyan" },
                  { icon: MapPin, label: "Coordinates", value: `${data.lat}, ${data.lon}`, color: "text-amber" },
                  { icon: MapPin, label: "Timezone", value: data.timezone, color: "text-purple" },
                  { icon: MapPin, label: "ZIP", value: data.zip, color: "text-muted-foreground" },
                  { icon: Wifi, label: "ISP", value: data.isp, color: "text-cyan" },
                  { icon: Server, label: "Organization", value: data.org, color: "text-amber" },
                  { icon: Server, label: "ASN", value: data.as, color: "text-emerald" },
                ].map((item) => (
                  <div key={item.label} className="bg-muted/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon className={`size-3 ${item.color}`} />
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">{item.label}</span>
                    </div>
                    <div className="text-sm font-medium truncate" title={item.value}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border border-cyan/20 bg-cyan/5">
              <p className="text-xs text-muted-foreground"><strong className="text-foreground">Map:</strong> <a href={`https://www.google.com/maps?q=${data.lat},${data.lon}`} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">Open in Google Maps ({data.lat}, {data.lon})</a></p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
