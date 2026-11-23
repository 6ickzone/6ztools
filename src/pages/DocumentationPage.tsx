import { motion } from "framer-motion";
import {
  BookOpen,
  Code,
  Terminal,
  Shield,
  Zap,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Server,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    color: "#06b6d4",
    content: [
      {
        title: "Welcome to 6ztools",
        text: "6ztools is an open-source security research platform built for ethical hackers, penetration testers, and security engineers. This documentation covers every tool, workflow, and configuration available in the dashboard.",
      },
      {
        title: "Platform Overview",
        text: "The platform provides 100+ security tools across 12 categories, including web shells, pentesting tools, crypto research, generators, network tools, OSINT recon, AI-powered analysis, exploit frameworks, and more.",
      },
      {
        title: "System Requirements",
        text: "6ztools runs entirely in your browser with no local installation required. For optimal performance, use a modern Chromium-based browser or Firefox with JavaScript enabled.",
      },
    ],
  },
  {
    id: "tool-categories",
    title: "Tool Categories",
    icon: Code,
    color: "#8b5cf6",
    content: [
      {
        title: "Web Shells",
        text: "Collection of PHP, ASPX, and JSP web shells including the YamiRoot series (DX, Std, Mini, Bypass variants), WSO Shell, C99 Shell, and r57 Shell. Each shell includes built-in file management, database access, and terminal capabilities.",
      },
      {
        title: "Pentesting Tools",
        text: "Full-featured penetration testing suite with CMS scanners (WordPress, Joomla, Drupal), subdomain scanners with live/dead filtering, XSS scanners (Reflected, Stored, DOM), SQL injection scanner with 60+ payloads, port scanners, directory brute forcers, and CVE vulnerability scanners.",
      },
      {
        title: "Crypto Research",
        text: "Blockchain analysis tools including wallet address lookup, mnemonic phrase generators, ABI decoders, gas trackers for ETH/BSC/Polygon, token scanners, smart contract analyzers, and DeFi yield calculators.",
      },
      {
        title: "Generators",
        text: "Code generation and obfuscation tools including PHP polymorphic generators, JavaScript obfuscators, QR code generators, hash generators (MD5, SHA1, SHA256, SHA512, bcrypt), payload generators, and reverse shell generators.",
      },
      {
        title: "Network Tools",
        text: "Network reconnaissance and analysis tools including IP/DNS lookup, Whois checker, traceroute, ping monitors, bandwidth testers, MAC address lookup, network scanners, and packet analyzers.",
      },
      {
        title: "OSINT & Recon",
        text: "Open-source intelligence gathering tools including email hunters, phone number lookup, social media search, domain age checkers, reverse IP lookup, SSL certificate info, metadata extraction, and Shodan integration.",
      },
      {
        title: "AI & Bot",
        text: "AI-powered security tools including the 6ztools AI Assistant, AI code generator, AI shell command generator, AI vulnerability analyst, Discord webhook testers, and automated pentest bots.",
      },
    ],
  },
  {
    id: "usage-guide",
    title: "Usage Guide",
    icon: Terminal,
    color: "#22c55e",
    content: [
      {
        title: "Navigating the Dashboard",
        text: "Use the sidebar to browse tool categories. Click any category to expand it and view available tools. Use the search bar at the top of the sidebar to quickly find specific tools by name or description.",
      },
      {
        title: "Launching a Tool",
        text: "Click on any tool name in the sidebar to open it. Tools load in a dedicated view with the tool's interface. Use the 'Back to Dashboard' button to return to the main dashboard.",
      },
      {
        title: "Theme Toggle",
        text: "Toggle between dark and light themes using the theme button in the sidebar footer, or use the keyboard shortcut Ctrl+Shift+D.",
      },
      {
        title: "Keyboard Shortcuts",
        text: "Ctrl+Shift+D: Toggle Theme | Ctrl+Shift+S: Toggle Sidebar | Ctrl+Shift+F: Focus Search | Escape: Close modal or deselect tool.",
      },
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    icon: Server,
    color: "#f59e0b",
    content: [
      {
        title: "No Public API (Yet)",
        text: "6ztools does not expose a public REST API. Every tool runs inside the dashboard — there are no API keys to generate, no endpoints to call from your own code, and no third-party integrations are published. A documented public API is on the roadmap; watch the Changelog and Community Forum for the announcement.",
      },
      {
        title: "Client-Side First",
        text: "Tools execute in your browser and results are not stored on our servers. Scans, generators, and encoders keep their output local unless a tool explicitly calls an external service.",
      },
      {
        title: "Built-In Outbound Proxy",
        text: "When a tool needs an external API or has to reach a scan target, the request is routed through the platform's internal proxy (an HTTP action at /api/proxy) instead of going from your browser directly. This sidesteps browser CORS restrictions while still relaying the target's real status code and headers, so scanners can tell 200, 403, and 404 apart.",
      },
      {
        title: "Server-Side Credentials",
        text: "Keys for third-party intelligence providers live in backend environment variables and are injected into outbound requests at runtime. They never appear in page source or the JavaScript bundle shipped to your browser.",
      },
      {
        title: "Guard Rails",
        text: "The proxy refuses private, loopback, and cloud-metadata addresses, strips cookies, origin, and referer headers from outbound requests, relays only an allow-list of response headers (so upstream CSP or Set-Cookie can never apply to this app), and caps responses at 8 MB.",
      },
      {
        title: "Internal by Design",
        text: "The proxy and every backend action are internal plumbing for the dashboard's own tools. They carry no stability guarantee, are not versioned, and may change without notice — do not build external integrations on top of them.",
      },
    ],
  },
  {
    id: "security",
    title: "Security & Ethics",
    icon: AlertTriangle,
    color: "#ef4444",
    content: [
      {
        title: "Ethical Use Policy",
        text: "All tools in 6ztools are intended exclusively for authorized security testing, educational purposes, and legitimate security research. Unauthorized access to computer systems is illegal under applicable law.",
      },
      {
        title: "Responsible Disclosure",
        text: "If you discover vulnerabilities using our tools, please follow responsible disclosure practices. Report findings to the affected organization before making them public.",
      },
      {
        title: "Legal Compliance",
        text: "Users are responsible for ensuring their use of these tools complies with all applicable local, state, national, and international laws and regulations.",
      },
      {
        title: "Data Privacy",
        text: "6ztools does not store scan results or tool outputs on our servers by default. All processing occurs locally in your browser. Optional cloud features encrypt data at rest and in transit.",
      },
    ],
  },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-background/50 rounded-lg border border-border p-4 text-sm font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-muted hover:bg-muted/80"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald" />
        ) : (
          <Copy className="size-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const active = sections.find((s) => s.id === activeSection);

  return (
    <div className="min-h-full cyber-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-cyan/10">
              <BookOpen className="size-5 text-cyan" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Documentation
              </h1>
              <p className="text-sm text-muted-foreground">
                Complete guide to the 6ztools platform
              </p>
            </div>
          </div>
          <Badge variant="outline" className="mt-3 border-cyan/30 text-cyan">
            Beta
          </Badge>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Nav */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <nav className="glass-card rounded-xl p-3 sticky top-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Table of Contents
              </h3>
              <div className="space-y-0.5">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
                        isActive
                          ? "bg-cyan/10 text-cyan font-medium"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Icon
                        className="size-3.5 shrink-0"
                        style={{ color: isActive ? section.color : undefined }}
                      />
                      <span className="truncate">{section.title}</span>
                      <ChevronRight className="size-3 ml-auto shrink-0 opacity-50" />
                    </button>
                  );
                })}
              </div>
            </nav>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-3"
          >
            {active && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex size-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${active.color}15` }}
                  >
                    <active.icon
                      className="size-4"
                      style={{ color: active.color }}
                    />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {active.title}
                  </h2>
                </div>

                {active.content.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="glass-card rounded-xl p-5"
                  >
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.text}
                    </p>
                  </motion.div>
                ))}

                {/* Internal architecture example */}
                {active.id === "architecture" && (
                  <div className="glass-card rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold">Example — How a Tool Reaches an External API</h3>
                      <Badge variant="outline" className="text-[10px] border-amber/40 text-amber">
                        Internal
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      Every tool calls one frontend helper. The request is forwarded to the
                      internal proxy, which applies credentials server-side and returns the
                      upstream status untouched. Shown for understanding only — this is not a
                      public API and may change without notice.
                    </p>
                    <CodeBlock
                      code={`// Inside a tool component (frontend helper)
const res = await proxyFetch(
  "https://api.hackertarget.com/hostsearch/?q=example.com",
  { timeoutMs: 15000 }
);

// res.status is the REAL upstream status (200 / 403 / 404 …)
if (res.status === 200) {
  const csv = await res.text();
  const hosts = csv.split("\\n").filter(Boolean);
}`}
                    />
                    <h3 className="font-semibold mb-3 mt-6">Response Shape</h3>
                    <CodeBlock
                      code={`// Relay header set by the backend on every response:
//   x-proxy-via: convex-http-action
// Error payload when the target cannot be reached:
{
  "ok": false,
  "error": "upstream_unreachable",
  "message": "Could not reach the target host."
}`}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
