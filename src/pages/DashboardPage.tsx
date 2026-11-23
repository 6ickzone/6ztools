import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Users,
  TrendingUp,
  Terminal,
  Bug,
  Code,
  Wallet,
  Globe,
  Network,
  Eye,
  Bot,
  Lock,
  BookOpen,
  ChevronRight,
  Clock,
  Activity,
  AlertTriangle,
  Database,
  ArrowUpRight,
  Sparkles,
  Server,
  Radio,
  Cpu,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ToolItem } from "@/data/sidebar-data";

const featuredTools = [
  {
    name: "YamiRoot Pro",
    description: "Advanced PHP File Manager with Rootkit Detection",
    icon: Terminal,
    color: "#ef4444",
    category: "Web Shells",
  },
  {
    name: "AI Penetration Assistant",
    description: "AI-powered vulnerability analysis",
    icon: Bot,
    color: "#8b5cf6",
    category: "AI & Bot",
  },
  {
    name: "SQL Injection Pro",
    description: "60+ payloads with batch scanning",
    icon: Bug,
    color: "#06b6d4",
    category: "Pentesting",
  },
  {
    name: "Crypto Wallet Analyzer",
    description: "Deep blockchain analysis",
    icon: Wallet,
    color: "#f59e0b",
    category: "Crypto Research",
  },
  {
    name: "Subdomain Enumerator",
    description: "Passive recon with live filter",
    icon: Globe,
    color: "#22c55e",
    category: "Pentesting",
  },
  {
    name: "PHP Polymorphic Generator",
    description: "Advanced code obfuscation",
    icon: Code,
    color: "#8b5cf6",
    category: "Generators",
  },
  {
    name: "Exploit Database",
    description: "Search 50,000+ exploits",
    icon: Shield,
    color: "#ef4444",
    category: "Exploits",
  },
  {
    name: "Network Scanner Pro",
    description: "Full network pentest suite",
    icon: Network,
    color: "#06b6d4",
    category: "Network",
  },
];

const recentActivity = [
  {
    text: "SQL Injection Scanner completed batch scan",
    time: "2 min ago",
    type: "scan",
  },
  {
    text: "New CVE database updated (2,847 entries)",
    time: "15 min ago",
    type: "update",
  },
  {
    text: "Subdomain scan found 23 live hosts",
    time: "1 hour ago",
    type: "discovery",
  },
  {
    text: "AI Vulnerability Analyst flagged 3 critical issues",
    time: "2 hours ago",
    type: "alert",
  },
  {
    text: "Port Scanner completed 1,024 port scan",
    time: "3 hours ago",
    type: "scan",
  },
  {
    text: "Crypto wallet lookup for 0x742d...8f3a",
    time: "5 hours ago",
    type: "lookup",
  },
];

const systemStats = [
  { label: "Total Tools Online", value: "100+", icon: Zap, color: "#06b6d4" },
  { label: "Tools Tested Today", value: "47", icon: Activity, color: "#8b5cf6" },
  { label: "Active Users", value: "1,284", icon: Users, color: "#22c55e" },
  { label: "Security Score", value: "98.5%", icon: Shield, color: "#f59e0b" },
];

const activityIcon = (type: string) => {
  switch (type) {
    case "scan":
      return <Radio className="size-3 text-cyan" />;
    case "update":
      return <Database className="size-3 text-purple" />;
    case "discovery":
      return <Eye className="size-3 text-emerald" />;
    case "alert":
      return <AlertTriangle className="size-3 text-amber" />;
    case "lookup":
      return <Globe className="size-3 text-purple" />;
    default:
      return <Activity className="size-3 text-cyan" />;
  }
};

interface DashboardPageProps {
  onToolSelect: (tool: ToolItem) => void;
}

export default function DashboardPage({ onToolSelect }: DashboardPageProps) {
  return (
    <div className="min-h-full cyber-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 via-purple/5 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          <div className="relative glass-card rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                  Welcome Back, Ethical Hacker!{" "}
                  <span className="inline-block animate-float">🛡️</span>
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Your Centralized Command Center for Security Research
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <Badge
                    variant="outline"
                    className="border-cyan/30 text-cyan gap-1"
                  >
                    <Zap className="size-3" />
                    100+ Tools
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-purple/30 text-purple gap-1"
                  >
                    <Layers className="size-3" />
                    50+ Categories
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-emerald/30 text-emerald gap-1"
                  >
                    <div className="size-1.5 rounded-full bg-emerald animate-pulse" />
                    24/7 Online
                  </Badge>
                </div>
              </div>
              <div className="flex size-16 items-center justify-center rounded-2xl bg-cyan/10 shrink-0">
                <Shield className="size-8 text-cyan" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {systemStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="glass-card rounded-xl p-4 hover:glow-cyan transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex size-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="size-4.5" style={{ color: stat.color }} />
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Featured Tools */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Featured Tools
            </h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">
              View All <ChevronRight className="size-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredTools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.button
                  key={tool.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
                  onClick={() =>
                    onToolSelect({
                      name: tool.name,
                      description: tool.description,
                      status: "active",
                    })
                  }
                  className="glass-card rounded-xl p-4 text-left hover:glow-cyan transition-all duration-300 group cursor-pointer border border-transparent hover:border-cyan/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="flex size-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${tool.color}12` }}
                    >
                      <Icon
                        className="size-5"
                        style={{ color: tool.color }}
                      />
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tool.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-cyan transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-[11px] text-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Open Tool</span>
                    <ArrowUpRight className="size-3" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Recent Activity + System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="lg:col-span-2 glass-card rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-tight">
                Recent Activity
              </h2>
              <Badge variant="secondary" className="text-[10px]">
                Live
              </Badge>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 last:pb-0"
                >
                  <div className="flex size-7 items-center justify-center rounded-lg bg-muted shrink-0">
                    {activityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.text}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="glass-card rounded-xl p-5"
          >
            <h2 className="text-sm font-semibold tracking-tight mb-4">
              System Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="size-3.5 text-muted-foreground" />
                  <span className="text-sm">Server Status</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-emerald animate-pulse" />
                  <span className="text-xs font-medium text-emerald">
                    Online
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="text-sm">Last Scan</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  2 minutes ago
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="size-3.5 text-muted-foreground" />
                  <span className="text-sm">Threats Blocked</span>
                </div>
                <span className="text-xs font-medium text-amber">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="size-3.5 text-muted-foreground" />
                  <span className="text-sm">Database Updated</span>
                </div>
                <span className="text-xs text-muted-foreground">Today</span>
              </div>

              <div className="h-px bg-border/50 my-2" />

              {/* Quick Actions */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 rounded-lg bg-cyan/10 px-3 py-2 text-xs font-medium text-cyan hover:bg-cyan/15 transition-colors">
                    <Bug className="size-3.5" />
                    New Vulnerability Scan
                  </button>
                  <button className="w-full flex items-center gap-2 rounded-lg bg-purple/10 px-3 py-2 text-xs font-medium text-purple hover:bg-purple/15 transition-colors">
                    <Code className="size-3.5" />
                    Generate Payload
                  </button>
                  <button className="w-full flex items-center gap-2 rounded-lg bg-amber/10 px-3 py-2 text-xs font-medium text-amber hover:bg-amber/15 transition-colors">
                    <Eye className="size-3.5" />
                    Run OSINT Recon
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


