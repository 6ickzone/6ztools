import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Wifi, Copy, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-cyan transition-colors">
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
    </button>
  );
}

// Common OUI prefixes (first 3 bytes / 6 hex chars)
const OUI_DB: Record<string, string> = {
  "00:1A:11": "Google Inc.",
  "00:1B:63": "Apple Inc.",
  "00:1E:C2": "Apple Inc.",
  "00:25:00": "Apple Inc.",
  "3C:22:FB": "Apple Inc.",
  "3C:15:C2": "Apple Inc.",
  "A4:83:E7": "Apple Inc.",
  "AC:DE:48": "Apple Inc.",
  "B8:27:EB": "Raspberry Pi Foundation",
  "00:50:56": "VMware Inc.",
  "00:0C:29": "VMware Inc.",
  "00:1C:14": "VMware Inc.",
  "08:00:27": "Oracle VirtualBox",
  "00:03:FF": "Microsoft Corporation",
  "00:1D:D8": "Microsoft Corporation",
  "7C:1E:52": "Microsoft Corporation",
  "28:18:78": "Microsoft Corporation",
  "00:15:5D": "Microsoft Corporation (Hyper-V)",
  "B8:CA:3A": "Dell Inc.",
  "F8:BC:12": "Dell Inc.",
  "18:03:73": "Dell Inc.",
  "00:14:22": "Dell Inc.",
  "D4:AE:52": "Dell Inc.",
  "00:0D:3A": "Microsoft Azure",
  "00:17:FA": "Amazon Technologies Inc.",
  "04:F1:75": "Amazon Technologies Inc.",
  "F0:F0:A4": "Amazon Technologies Inc.",
  "3C:44:BD": "Amazon Technologies Inc.",
  "44:65:0D": "Amazon Technologies Inc.",
  "68:37:E9": "Amazon Technologies Inc.",
  "84:D6:D0": "Amazon Technologies Inc.",
  "A0:02:DC": "Amazon Technologies Inc.",
  "AC:63:BE": "Amazon Technologies Inc.",
  "C0:AA:68": "Amazon Technologies Inc.",
  "E8:48:B8": "Amazon Technologies Inc.",
  "FC:65:DE": "Amazon Technologies Inc.",
  "00:1A:2B": "Cisco Systems Inc.",
  "00:1B:0D": "Cisco Systems Inc.",
  "00:1E:13": "Cisco Systems Inc.",
  "00:21:55": "Cisco Systems Inc.",
  "00:23:04": "Cisco Systems Inc.",
  "00:23:33": "Cisco Systems Inc.",
  "00:24:C4": "Cisco Systems Inc.",
  "00:25:45": "Cisco Systems Inc.",
  "00:26:51": "Cisco Systems Inc.",
  "00:40:96": "Cisco Systems Inc.",
  "3C:CE:73": "Cisco Systems Inc.",
  "5C:50:15": "Cisco Systems Inc.",
  "64:F6:9D": "Cisco Systems Inc.",
  "70:DB:98": "Cisco Systems Inc.",
  "84:78:AC": "Cisco Systems Inc.",
  "A0:3D:6F": "Cisco Systems Inc.",
  "B0:5A:DA": "Cisco Systems Inc.",
  "C4:64:13": "Cisco Systems Inc.",
  "D4:D7:48": "Cisco Systems Inc.",
  "E4:AA:5D": "Cisco Systems Inc.",
  "F4:4E:05": "Cisco Systems Inc.",
  "00:24:D7": "TP-Link Technologies Co. Ltd.",
  "14:CC:20": "TP-Link Technologies Co. Ltd.",
  "30:B5:C2": "TP-Link Technologies Co. Ltd.",
  "50:C7:BF": "TP-Link Technologies Co. Ltd.",
  "60:32:B1": "TP-Link Technologies Co. Ltd.",
  "74:DA:88": "TP-Link Technologies Co. Ltd.",
  "94:D9:B3": "TP-Link Technologies Co. Ltd.",
  "B0:4E:26": "TP-Link Technologies Co. Ltd.",
  "C0:06:C3": "TP-Link Technologies Co. Ltd.",
  "D8:07:B6": "TP-Link Technologies Co. Ltd.",
  "E8:DE:27": "TP-Link Technologies Co. Ltd.",
  "F4:F2:6D": "TP-Link Technologies Co. Ltd.",
  "04:18:D6": "Ubiquiti Networks Inc.",
  "18:E8:29": "Ubiquiti Networks Inc.",
  "24:A4:3C": "Ubiquiti Networks Inc.",
  "44:D9:E7": "Ubiquiti Networks Inc.",
  "68:72:51": "Ubiquiti Networks Inc.",
  "74:83:C2": "Ubiquiti Networks Inc.",
  "78:8A:20": "Ubiquiti Networks Inc.",
  "80:2A:A8": "Ubiquiti Networks Inc.",
  "94:10:3E": "Ubiquiti Networks Inc.",
  "AC:8B:A9": "Ubiquiti Networks Inc.",
  "B4:FB:E4": "Ubiquiti Networks Inc.",
  "DC:9F:DB": "Ubiquiti Networks Inc.",
  "E0:63:DA": "Ubiquiti Networks Inc.",
  "F0:9F:C2": "Ubiquiti Networks Inc.",
  "FC:EC:DA": "Ubiquiti Networks Inc.",
  "00:0E:8F": "Netgear Inc.",
  "00:14:6C": "Netgear Inc.",
  "00:18:4D": "Netgear Inc.",
  "00:1B:2F": "Netgear Inc.",
  "00:1F:33": "Netgear Inc.",
  "00:22:3F": "Netgear Inc.",
  "00:24:B2": "Netgear Inc.",
  "00:26:F2": "Netgear Inc.",
  "20:0C:C8": "Netgear Inc.",
  "28:C6:8E": "Netgear Inc.",
  "2C:B0:5D": "Netgear Inc.",
  "30:46:9A": "Netgear Inc.",
  "44:94:FC": "Netgear Inc.",
  "4C:60:DE": "Netgear Inc.",
  "50:4A:6E": "Netgear Inc.",
  "6C:B0:CE": "Netgear Inc.",
  "84:1B:5E": "Netgear Inc.",
  "8C:3B:AD": "Netgear Inc.",
  "9C:3D:CF": "Netgear Inc.",
  "A0:04:60": "Netgear Inc.",
  "A0:21:B7": "Netgear Inc.",
  "A4:2B:B0": "Netgear Inc.",
  "AC:22:05": "Netgear Inc.",
  "B0:7F:B9": "Netgear Inc.",
  "B0:B9:8A": "Netgear Inc.",
  "B4:30:52": "Netgear Inc.",
  "B8:BD:B1": "Netgear Inc.",
  "C0:3F:0E": "Netgear Inc.",
  "C0:FF:D4": "Netgear Inc.",
  "CC:40:D0": "Netgear Inc.",
  "D0:21:F9": "Netgear Inc.",
  "D4:6E:5C": "Netgear Inc.",
  "E0:46:9A": "Netgear Inc.",
  "E0:91:F5": "Netgear Inc.",
  "E4:F0:04": "Netgear Inc.",
  "E8:FC:AF": "Netgear Inc.",
  "EC:08:6B": "Netgear Inc.",
  "F0:03:8C": "Netgear Inc.",
  "F8:73:94": "Netgear Inc.",
  "FC:FB:FB": "Netgear Inc.",
  "52:54:00": "QEMU/KVM Virtual NIC",
  "00:16:3E": "Xen",
  "02:42:AC": "Docker Container",
  "02:42:0A": "Docker Container",
  "FE:FF:FF": "VMware Virtual Ethernet Adapter",
};

function normalizeMac(mac: string): string {
  const clean = mac.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
  if (clean.length < 6) return clean;
  return `${clean.slice(0,2)}:${clean.slice(2,4)}:${clean.slice(4,6)}:${clean.slice(6,8)}:${clean.slice(8,10)}:${clean.slice(10,12)}`;
}

function lookupVendor(mac: string): { vendor: string; oui: string } {
  const normalized = normalizeMac(mac).toUpperCase();
  const prefix = normalized.slice(0, 8);
  const vendor = OUI_DB[prefix] || OUI_DB[normalized.slice(0, 2) + ":" + normalized.slice(2, 4) + ":" + normalized.slice(4, 6)] || null;
  return { vendor: vendor || "Unknown", oui: prefix };
}

function macInfo(mac: string) {
  const clean = mac.replace(/[^a-fA-F0-9]/g, "");
  const isValid = /^[0-9A-F]{12}$/i.test(clean);
  const isUnicast = isValid ? (parseInt(clean.slice(0, 2), 16) & 1) === 0 : false;
  const isGloballyAdministered = isValid ? (parseInt(clean.slice(0, 2), 16) & 2) === 0 : false;
  const formatted = isValid ? normalizeMac(clean) : mac;
  const { vendor, oui } = lookupVendor(clean);
  return { isValid, isUnicast, isGloballyAdministered, formatted, vendor, oui };
}

interface MacAddressLookupProps { onBack: () => void; }

export function MacAddressLookup({ onBack }: MacAddressLookupProps) {
  const [mac, setMac] = useState("");
  const [info, setInfo] = useState<ReturnType<typeof macInfo> | null>(null);

  const handleLookup = () => {
    if (!mac.trim()) return;
    setInfo(macInfo(mac.trim()));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-emerald/10">
            <Wifi className="size-8 text-emerald" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">MAC Address Lookup</h1>
            <p className="text-muted-foreground text-base">Identify vendor, OUI, unicast/multicast, and globally administered status from a MAC address.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="AA:BB:CC:DD:EE:FF or AA-BB-CC-DD-EE-FF" value={mac} onChange={(e) => setMac(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()} className="pl-10 font-mono" />
            </div>
            <Button onClick={handleLookup} disabled={!mac.trim()} className="gap-2 bg-emerald hover:bg-emerald/90 text-black font-semibold">
              <Search className="size-4" /> Lookup
            </Button>
          </div>
        </div>
        {info && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-mono">{info.formatted}</h2>
              <CopyButton text={info.formatted} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">Vendor / Manufacturer</div>
                <div className="text-sm font-medium">{info.vendor}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">OUI Prefix</div>
                <div className="text-sm font-mono">{info.oui}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">Type</div>
                <div className={`text-sm font-medium ${info.isUnicast ? "text-emerald" : "text-amber"}`}>{info.isUnicast ? "Unicast" : "Multicast"}</div>
              </div>
              <div className="bg-muted/20 rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">Administration</div>
                <div className={`text-sm font-medium ${info.isGloballyAdministered ? "text-cyan" : "text-purple"}`}>{info.isGloballyAdministered ? "Globally Administered" : "Locally Administered"}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
