import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Terminal,
  Code,
  Bug,
  Wallet,
  Globe,
  Network,
  Eye,
  Bot,
  Lock,
  GraduationCap,
  HelpCircle,
  Loader2,
  Clock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sidebarCategories } from "@/data/sidebar-data";
import type { ToolItem } from "@/data/sidebar-data";

const categoryMeta: Record<
  string,
  { icon: typeof Shield; color: string; description: string }
> = {
  webshells: {
    icon: Terminal,
    color: "#ef4444",
    description: "Web shell collection for authorized penetration testing",
  },
  pentesting: {
    icon: Bug,
    color: "#06b6d4",
    description: "Comprehensive penetration testing toolkit",
  },
  crypto: {
    icon: Wallet,
    color: "#f59e0b",
    description: "Blockchain and cryptocurrency research tools",
  },
  generators: {
    icon: Code,
    color: "#8b5cf6",
    description: "Code generators, obfuscators, and utility builders",
  },
  urltools: {
    icon: Globe,
    color: "#22c55e",
    description: "Website analysis and URL manipulation tools",
  },
  network: {
    icon: Network,
    color: "#06b6d4",
    description: "Network scanning, analysis, and monitoring tools",
  },
  osint: {
    icon: Eye,
    color: "#f59e0b",
    description: "Open-source intelligence gathering and reconnaissance",
  },
  ai: {
    icon: Bot,
    color: "#8b5cf6",
    description: "AI-powered security analysis and automation",
  },
  exploits: {
    icon: Shield,
    color: "#ef4444",
    description: "Exploit frameworks and vulnerability scanners",
  },
  encoder: {
    icon: Lock,
    color: "#22c55e",
    description: "Code obfuscation and encryption tools",
  },
  learning: {
    icon: GraduationCap,
    color: "#06b6d4",
    description: "Educational resources and hands-on labs",
  },
  support: {
    icon: HelpCircle,
    color: "#64748b",
    description: "Platform support and information",
  },
};

function findCategoryForTool(tool: ToolItem): string | null {
  for (const cat of sidebarCategories) {
    if (cat.items.some((item) => item.name === tool.name)) {
      return cat.id;
    }
  }
  return null;
}

interface ToolViewProps {
  tool: ToolItem;
  onBack: () => void;
}

export function ToolView({ tool, onBack }: ToolViewProps) {
  const categoryId = findCategoryForTool(tool);
  const meta = categoryId ? categoryMeta[categoryId] : null;
  const Icon = meta?.icon || Terminal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Button>

        {/* Tool Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div
            className="flex size-16 items-center justify-center rounded-2xl shrink-0"
            style={{
              backgroundColor: `${meta?.color || "#06b6d4"}15`,
            }}
          >
            <Icon
              className="size-8"
              style={{ color: meta?.color || "#06b6d4" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {tool.name}
              </h1>
              {tool.badge && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: `${meta?.color || "#06b6d4"}40`,
                    color: meta?.color || "#06b6d4",
                  }}
                >
                  {tool.badge}
                </Badge>
              )}
              {tool.status === "coming-soon" && (
                <Badge
                  variant="outline"
                  className="text-xs border-amber/40 text-amber"
                >
                  Coming Soon
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-base mb-3">
              {tool.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Tag className="size-3" />
                <span>{meta?.description || "Security Tool"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3" />
                <span>
                  Status:{" "}
                  {tool.status === "coming-soon"
                    ? "Coming Soon"
                    : tool.status === "beta"
                    ? "Beta"
                    : "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tool Content Placeholder */}
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-cyan/10">
              <Shield className="size-6 text-cyan" />
            </div>
            <h3 className="text-lg font-semibold">Tool Interface</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              In the full version, this tool will be loaded in an embedded
              iframe with theme synchronization, responsive viewport, and
              auto-resize capabilities.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin text-cyan" />
                <span>Executing...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tool Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Category</div>
            <div className="text-sm font-medium capitalize">
              {categoryId
                ? sidebarCategories.find((c) => c.id === categoryId)?.label ||
                  "Unknown"
                : "Unknown"}
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Version</div>
            <div className="text-sm font-medium">v1.0.0</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Last Updated
            </div>
            <div className="text-sm font-medium">Today</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
