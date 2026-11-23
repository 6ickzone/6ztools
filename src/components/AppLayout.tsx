import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
  Star,
  Clock,
  Zap,
} from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { cn } from "@/lib/utils";
import { sidebarCategories, mainMenu, type ToolItem } from "@/data/sidebar-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AppLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (path: string) => void;
  selectedTool?: ToolItem | null;
  onToolSelect?: (tool: ToolItem | null) => void;
}

export function AppLayout({
  children,
  activePage,
  onNavigate,
  selectedTool,
  onToolSelect,
}: AppLayoutProps) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("6ickzone-theme");
    return saved ? saved === "dark" : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Theme management
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    localStorage.setItem("6ickzone-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [mobileSidebarOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setIsDark((prev) => !prev);
      }
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault();
        const searchEl = document.getElementById("tool-search");
        if (searchEl) searchEl.focus();
      }
      if (e.key === "Escape") {
        if (mobileSidebarOpen) setMobileSidebarOpen(false);
        if (selectedTool) onToolSelect?.(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileSidebarOpen, selectedTool, onToolSelect]);

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return sidebarCategories;
    const q = searchQuery.toLowerCase();
    return sidebarCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            cat.label.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  const totalTools = sidebarCategories.reduce(
    (acc, cat) => acc + cat.items.length,
    0
  );

  // NOTE: this is a plain render helper, not a component. Defining it as an
  // inline component (`const SidebarContent = () => …` + `<SidebarContent />`)
  // gave React a new component type on every render, unmounting and remounting
  // the whole sidebar — which reset the ScrollArea scroll position whenever a
  // submenu was toggled or an item was clicked.
  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Sidebar Header */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
        <div className="group flex size-9 items-center justify-center rounded-lg bg-background border border-emerald/25">
          <LogoMark className="size-6 text-emerald transition-transform duration-300 group-hover:rotate-[8deg]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold tracking-tight truncate">
            6z<span className="text-emerald">.</span>
          </h1>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Ethical Security Research
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 transition-all",
            searchFocused
              ? "border-cyan/40 ring-2 ring-cyan/10"
              : "border-border"
          )}
        >
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <input
            id="tool-search"
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Menu */}
      <div className="px-3 pb-2">
        {mainMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.path;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.path);
                setMobileSidebarOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-cyan/10 text-cyan"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto size-1.5 rounded-full bg-cyan animate-pulse-glow" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mx-3 mb-2 h-px bg-sidebar-border" />

      {/* Tool Categories */}
      <ScrollArea className="flex-1 min-h-0 h-full px-3 pb-4">
        <div className="space-y-0.5">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories.has(category.id);
            const hasActiveItem = category.items.some(
              (_, i) =>
                selectedTool?.name === category.items[i].name
            );

            // webshells category is a direct link, not expandable
            const isDirectLink = category.id === "webshells";
            const isDirectLinkActive = activePage === "/dashboard/webshells";

            return (
              <div key={category.id}>
                <button
                  onClick={() => {
                    if (isDirectLink) {
                      onNavigate("/dashboard/webshells");
                      setMobileSidebarOpen(false);
                    } else {
                      toggleCategory(category.id);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                    isDirectLink
                      ? isDirectLinkActive
                        ? "bg-cyan/10 text-cyan"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      : hasActiveItem
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div
                    className="flex size-5 items-center justify-center rounded"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <Icon
                      className="size-3"
                      style={{ color: category.color }}
                    />
                  </div>
                  <span className="flex-1 text-left truncate">
                    {category.label}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 tabular-nums"
                  >
                    {category.items[0]?.badge || category.items.length}
                  </Badge>
                  {!isDirectLink && (
                    <ChevronDown
                      className={cn(
                        "size-3 transition-transform duration-200 shrink-0",
                        isExpanded && "rotate-180"
                      )}
                    />
                  )}
                </button>

                {!isDirectLink && (
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 border-l border-sidebar-border pl-3 py-1 space-y-0.5">
                        {category.items.map((item) => {
                          const isActive = selectedTool?.name === item.name;
                          return (
                            <button
                              key={item.name}
                              onClick={() => {
                                onToolSelect?.(item);
                                setMobileSidebarOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-all group/item",
                                isActive
                                  ? "bg-cyan/10 text-cyan font-medium"
                                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <div
                                className={cn(
                                  "size-1.5 rounded-full shrink-0 transition-all",
                                  isActive
                                    ? "bg-cyan shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                                    : "bg-muted-foreground/30 group-hover/item:bg-muted-foreground/50"
                                )}
                              />
                              <span className="flex-1 text-left truncate">
                                {item.name}
                              </span>
                              {item.badge && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-3.5 border-cyan/30 text-cyan"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                              {item.status === "coming-soon" && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-3.5 border-amber/30 text-amber"
                                >
                                  Soon
                                </Badge>
                              )}
                              {item.status === "inactive" && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-3.5 border-red/30 text-red"
                                >
                                  Inactive
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <div className="size-1.5 rounded-full bg-emerald animate-pulse" />
            <span>{totalTools} tools online</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setIsDark((prev) => !prev)}
          >
            {isDark ? (
              <Sun className="size-3.5 text-amber" />
            ) : (
              <Moon className="size-3.5 text-purple" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col border-r border-border transition-all duration-300 ease-in-out shrink-0",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        {sidebarOpen && renderSidebarContent()}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
            >
              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 shrink-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 hidden md:flex"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <Menu className="size-4" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">6ztools</span>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="font-medium truncate">
              {selectedTool
                ? selectedTool.name
                : activePage === "/dashboard/webshells"
                ? "Web Shell Archive"
                : activePage === "/dashboard/documentation"
                ? "Documentation"
                : activePage === "/dashboard/about"
                ? "About"
                : "Dashboard"}
            </span>
          </div>

          <div className="flex-1" />

          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Zap className="size-3 text-amber" />
              <span>100+ Tools</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
