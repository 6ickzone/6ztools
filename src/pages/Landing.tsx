import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Terminal,
  Code,
  Eye,
  Network,
  Bug,
  Lock,
  ChevronRight,
  Bot,
  Wallet,
  Globe,
  Users,
  Star,
  Activity,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/LogoMark";
import { useNavigate } from "react-router";

const features = [
  {
    icon: Terminal,
    title: "Web Shells",
    description: "YamiRoot series, WSO, C99, r57 shells with obfuscation",
    color: "#ef4444",
    count: "11 tools",
  },
  {
    icon: Bug,
    title: "Pentesting",
    description: "CMS scanner, SQLi, XSS, LFI, port scanner & more",
    color: "#06b6d4",
    count: "14 tools",
  },
  {
    icon: Wallet,
    title: "Crypto Research",
    description: "Wallet lookup, gas tracker, smart contract analysis",
    color: "#f59e0b",
    count: "10 tools",
  },
  {
    icon: Code,
    title: "Generators",
    description: "Polymorphic PHP, JS obfuscator, payload generators",
    color: "#8b5cf6",
    count: "10 tools",
  },
  {
    icon: Globe,
    title: "URL Tools",
    description: "Link scraper, base64, minifier, website mirror",
    color: "#22c55e",
    count: "12 tools",
  },
  {
    icon: Network,
    title: "Network",
    description: "IP/DNS lookup, whois, traceroute, packet analyzer",
    color: "#06b6d4",
    count: "9 tools",
  },
  {
    icon: Eye,
    title: "OSINT & Recon",
    description: "Email hunter, GitHub dorker, Shodan integration",
    color: "#f59e0b",
    count: "11 tools",
  },
  {
    icon: Bot,
    title: "AI & Bot",
    description: "AI vulnerability analyst, code generator, pentest bot",
    color: "#8b5cf6",
    count: "8 tools",
  },
  {
    icon: Shield,
    title: "Exploit Tools",
    description: "Metasploit, SQLMap, Nmap, Burp Suite interfaces",
    color: "#ef4444",
    count: "9 tools",
  },
  {
    icon: Lock,
    title: "Security Encoder",
    description: "PHP, Python, JS, .NET, Java obfuscation tools",
    color: "#22c55e",
    count: "8 tools",
  },
  {
    icon: Activity,
    title: "Learning & Lab",
    description: "Python security course, CTF challenges, cheat sheets",
    color: "#06b6d4",
    count: "7 tools",
  },
  {
    icon: Users,
    title: "Support",
    description: "Privacy policy, bug bounty, community forum",
    color: "#64748b",
    count: "7 pages",
  },
];

const stats = [
  { value: "41+", label: "Tools Online", icon: Zap, color: "text-cyan" },
  { value: "12", label: "Categories", icon: Shield, color: "text-purple" },
  { value: "24/7", label: "Always Active", icon: Activity, color: "text-emerald" },
  { value: "0$", label: "Free Access", icon: Star, color: "text-amber" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-sm border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="group flex size-9 items-center justify-center rounded-lg bg-background border border-emerald/25">
              <LogoMark className="size-6 text-emerald transition-transform duration-300 group-hover:rotate-[8deg]" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              6z<span className="text-emerald">.</span>
            </span>
            <Badge variant="outline" className="text-[10px] border-emerald/30 text-emerald hidden sm:flex">Beta</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="hidden sm:flex text-muted-foreground">
              Documentation
            </Button>
            <Button size="sm" onClick={() => navigate("/dashboard")}
              className="gap-1.5 bg-cyan hover:bg-cyan/90 text-black font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              Launch Tools
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.11),rgba(6,182,212,0)_70%)]" />
          <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.10),rgba(139,92,246,0)_70%)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.07),rgba(245,158,11,0)_70%)]" />

        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <Badge variant="outline" className="mb-6 border-cyan/30 text-cyan gap-1.5 py-1.5 px-3 bg-cyan/5">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="size-1.5 rounded-full bg-emerald" />
              Platform Online — Beta Test
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            <span className="block text-foreground">Your Centralized</span>
            <span className="block bg-gradient-to-r from-cyan via-purple to-amber bg-clip-text text-transparent">
              Security Research Hub
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            100+ ethical hacking tools, pentesting suites, and security
            research utilities — all in one modern, powerful dashboard.
            Built for security professionals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold px-8 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-shadow"
            >
              <Shield className="size-4" />
              Launch Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="gap-2 border-border/50 hover:border-cyan/30 hover:bg-cyan/5"
            >
              <Terminal className="size-4" />
              View Documentation
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16"
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                  className="rounded-xl p-4 text-center border border-border/30 hover:border-cyan/20 transition-colors bg-card/70"
                >
                  <Icon className={`size-5 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan to-purple bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[#F3F4F6] mt-1">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 border-purple/30 text-purple">
              <Sparkles className="size-3 mr-1" /> Full Arsenal
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Complete Security Toolkit
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From reconnaissance to exploitation, 6ztools covers every
              phase of the penetration testing lifecycle.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="group relative rounded-xl p-5 border border-border/30 hover:border-cyan/20 bg-card/80 transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => navigate("/dashboard")}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="flex size-10 items-center justify-center rounded-xl shrink-0"
                        style={{ backgroundColor: `${feature.color}12` }}
                      >
                        <Icon className="size-5" style={{ color: feature.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm group-hover:text-cyan transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{feature.count}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 border-emerald/30 text-emerald">
              <Zap className="size-3 mr-1" /> Simple & Fast
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">How It Works</h2>
            <p className="text-muted-foreground">Three steps to start your security research.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Choose a Tool", desc: "Browse 100+ tools across 12 categories — pentesting, OSINT, crypto, generators, and more.", icon: Terminal, color: "cyan" },
              { step: "02", title: "Configure & Run", desc: "Set your target, pick options, and execute. All processing happens in your browser.", icon: Zap, color: "purple" },
              { step: "03", title: "Get Results", desc: "View findings with severity ratings, export reports, and take action on vulnerabilities.", icon: Eye, color: "amber" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="rounded-xl p-6 text-center border border-border/30 bg-card/70"
              >
                <div className={`text-3xl font-black mb-3 text-${item.color}`}>{item.step}</div>
                <item.icon className={`size-6 mx-auto mb-3 text-${item.color}`} />
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-xs text-[#F3F4F6] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.09),rgba(6,182,212,0)_70%)]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl p-8 sm:p-12 border border-border/50 bg-card/80 overflow-hidden"
          >
            {/* Glow border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan/10 via-transparent to-purple/10 pointer-events-none" />
            <div className="relative">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-cyan/10 border border-cyan/20 mx-auto mb-6">
                <Shield className="size-8 text-cyan" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Ready to Start?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Join security researchers using 6ztools for their daily
                reconnaissance and penetration testing workflows. No account
                required — access all tools instantly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                  className="gap-2 bg-cyan hover:bg-cyan/90 text-black font-semibold px-8 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-shadow"
                >
                  Open Dashboard
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="size-4 text-amber" />
                  <span>Free for all users — no login required</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="size-4 text-cyan" />
            <span>© 2026 6ickzone. Ethical use only.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-foreground transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
