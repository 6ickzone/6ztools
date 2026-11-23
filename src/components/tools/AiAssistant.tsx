import { useRef, useState, useEffect, isValidElement, type ComponentProps } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Code2, Send, ShieldAlert, Terminal, Trash2, Loader2, Wrench, AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js/lib/core";
import "highlight.js/styles/github-dark.css";

/* ─── Modes ───────────────────────────────────────────────────────────────── */

export type AiMode = "assistant" | "codegen" | "shellcmd" | "vulnanalyst";

const MODE_META: Record<
  AiMode,
  { title: string; subtitle: string; icon: typeof Bot; color: string; bg: string; suggestions: string[] }
> = {
  assistant: {
    title: "6ztools AI Assistant",
    subtitle: "AI-powered recon & security analysis companion",
    icon: Bot,
    color: "text-cyan",
    bg: "bg-cyan/10",
    suggestions: [
      "Enumerate subdomains for example.com",
      "What's the difference between reflected and stored XSS?",
      "Detect the CMS of https://wordpress.org",
    ],
  },
  codegen: {
    title: "AI Code Generator",
    subtitle: "Complete security tooling code, on demand",
    icon: Code2,
    color: "text-purple",
    bg: "bg-purple/10",
    suggestions: [
      "Python port scanner with threading",
      "PHP class to parse Nmap XML output",
      "Bash script to brute-force subdomain paths",
    ],
  },
  shellcmd: {
    title: "AI Shell Command Generator",
    subtitle: "Exact CLI commands for pentest tasks",
    icon: Terminal,
    color: "text-amber",
    bg: "bg-amber/10",
    suggestions: [
      "nmap scan for open ports and service versions",
      "gobuster directory brute force against a target",
      "sqlmap command for a GET parameter",
    ],
  },
  vulnanalyst: {
    title: "AI Vulnerability Analyst",
    subtitle: "CVE analysis, severity rating & remediation",
    icon: ShieldAlert,
    color: "text-red",
    bg: "bg-red/10",
    suggestions: [
      "Analyze CVE-2021-44228 (Log4Shell)",
      "Severity of unauthenticated RCE on a Joomla 3.10 site?",
      "Prioritize remediation for these scan findings: ...",
    ],
  },
};

/* ─── Anti-XSS ────────────────────────────────────────────────────────────── */

/**
 * Defense-in-depth for user input before it enters chat state.
 * Rendering itself is already safe (React escapes text nodes, and assistant
 * markdown goes through react-markdown which never renders raw HTML without
 * rehype-raw), this strips HTML/script constructs at the source as a second
 * layer so hostile strings can't be forwarded or persisted later.
 */
function sanitizeUserInput(raw: string): string {
  return raw
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "") // strip remaining HTML tags
    .replace(/javascript\s*:/gi, "") // neutralize script-URL vectors
    .replace(/on(?:error|load|click|mouseover|focus)\s*=/gi, ""); // strip inline handlers
}

/* ─── Syntax highlighting (highlight.js core + curated languages) ───────── */

const LANG_MODULES: Record<string, () => Promise<unknown>> = {
  bash: () => import("highlight.js/lib/languages/bash"),
  json: () => import("highlight.js/lib/languages/json"),
  python: () => import("highlight.js/lib/languages/python"),
  php: () => import("highlight.js/lib/languages/php"),
  javascript: () => import("highlight.js/lib/languages/javascript"),
  typescript: () => import("highlight.js/lib/languages/typescript"),
  xml: () => import("highlight.js/lib/languages/xml"),
  sql: () => import("highlight.js/lib/languages/sql"),
  yaml: () => import("highlight.js/lib/languages/yaml"),
  go: () => import("highlight.js/lib/languages/go"),
  rust: () => import("highlight.js/lib/languages/rust"),
  java: () => import("highlight.js/lib/languages/java"),
  c: () => import("highlight.js/lib/languages/c"),
  cpp: () => import("highlight.js/lib/languages/cpp"),
  csharp: () => import("highlight.js/lib/languages/csharp"),
  ruby: () => import("highlight.js/lib/languages/ruby"),
  perl: () => import("highlight.js/lib/languages/perl"),
  powershell: () => import("highlight.js/lib/languages/powershell"),
  dockerfile: () => import("highlight.js/lib/languages/dockerfile"),
  diff: () => import("highlight.js/lib/languages/diff"),
};

const LANG_LABELS: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  bash: "bash",
  shell: "bash",
  sh: "bash",
  json: "json",
  xml: "xml",
  html: "xml",
  yaml: "yaml",
  yml: "yaml",
  dockerfile: "docker",
  csharp: "c#",
  powershell: "pwsh",
};

let languagesPromise: Promise<void> | null = null;
/** Lazy-registers the curated language set once; resolves when ready. */
function registerLanguages(): Promise<void> {
  if (!languagesPromise) {
    languagesPromise = (async () => {
      for (const [name, load] of Object.entries(LANG_MODULES)) {
        try {
          hljs.registerLanguage(name, (await load()) as Parameters<typeof hljs.registerLanguage>[1]);
        } catch {
          /* language optional — highlight falls back to plain */
        }
      }
    })();
  }
  return languagesPromise;
}
function langOf(className?: string): string | undefined {
  const m = (className ?? "").match(/language-([\w-]+)/);
  return m?.[1];
}

/* ─── One-click copy for code blocks ─────────────────────────────────────── */

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      aria-label="Copy code"
      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-border/60 bg-card/80 text-muted-foreground hover:text-foreground hover:border-cyan/40 transition-colors shrink-0"
    >
      {copied ? <Check className="size-3 text-emerald" /> : <Copy className="size-3" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

/* ─── Safe markdown rendering (assistant messages) ─────────────────────────
 * react-markdown v10: raw HTML in markdown is NOT rendered (no rehype-raw),
 * and javascript: URLs are stripped by its default urlTransform — so model
 * output can never inject markup or handlers. GFM adds tables/task lists.
 * -------------------------------------------------------------------------- */

/**
 * Rebuilds a fenced code block with a label bar, one-click copy and syntax
 * highlighting. highlight.js output only ever contains escaped text plus its
 * own `<span class="hljs-*">` tokens — it never emits raw HTML from the code,
 * so the dangerouslySetInnerHTML below carries no injection surface.
 */
function buildCodeBlock(block: { className?: string; children?: unknown }) {
  const plain = String(block.children ?? "").replace(/\n$/, "");
  const language = langOf(block.className);
  const label = language ? (LANG_LABELS[language] ?? language) : "code";

  let html: string | undefined;
  if (language && plain && hljs.getLanguage(language)) {
    try {
      html = hljs.highlight(plain, { language, ignoreIllegals: true }).value;
    } catch {
      html = undefined;
    }
  }

  return (
    <div className="my-2 rounded-xl border border-border/60 bg-background/70 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-card/50">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <CopyButton text={plain} label="Copy" />
      </div>
      {html !== undefined ? (
        <pre className="p-3 text-xs overflow-x-auto leading-relaxed hljs">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      ) : (
        <pre className="p-3 text-xs overflow-x-auto leading-relaxed">
          <code className="text-foreground/90">{plain}</code>
        </pre>
      )}
    </div>
  );
}

const MARKDOWN_COMPONENTS = {
  p: ({ children }: ComponentProps<"p">) => (
    <p className="my-1.5 first:mt-0 last:mb-0 leading-relaxed">{children}</p>
  ),
  a: ({ children, href }: ComponentProps<"a">) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-cyan hover:underline break-all"
    >
      {children}
    </a>
  ),
  ul: ({ children }: ComponentProps<"ul">) => (
    <ul className="my-2 ml-5 list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }: ComponentProps<"ol">) => (
    <ol className="my-2 ml-5 list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }: ComponentProps<"li">) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }: ComponentProps<"h1">) => (
    <h1 className="text-lg font-bold mt-3 mb-1.5 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: ComponentProps<"h2">) => (
    <h2 className="text-base font-bold mt-3 mb-1.5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: ComponentProps<"h3">) => (
    <h3 className="text-sm font-semibold mt-2.5 mb-1 first:mt-0">{children}</h3>
  ),
  h4: ({ children }: ComponentProps<"h4">) => (
    <h4 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h4>
  ),
  strong: ({ children }: ComponentProps<"strong">) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  blockquote: ({ children }: ComponentProps<"blockquote">) => (
    <blockquote className="my-2 border-l-2 border-cyan/40 pl-3 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-border/40" />,
  pre: ({ children }: ComponentProps<"pre">) => {
    // react-markdown always wraps block code in <pre><code>, so unwrap here
    // and rebuild the container with header bar + one-click copy.
    const child = Array.isArray(children) ? children[0] : children;
    if (isValidElement(child)) {
      return buildCodeBlock(child.props as { className?: string; children?: unknown });
    }
    return (
      <pre className="my-2 rounded-xl bg-background/60 border border-border/60 p-3 text-xs overflow-x-auto leading-relaxed">
        {children}
      </pre>
    );
  },
  // Fallback so a block code child never renders as inline code either.
  code: ({ className, children, ...props }: ComponentProps<"code">) => {
    if (langOf(className)) {
      return buildCodeBlock({ className, children });
    }
    return (
      <code
        className="text-[0.85em] bg-cyan/10 text-cyan rounded px-1 py-0.5 break-all font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  table: ({ children }: ComponentProps<"table">) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }: ComponentProps<"th">) => (
    <th className="border border-border/60 bg-card/60 px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }: ComponentProps<"td">) => (
    <td className="border border-border/60 px-2 py-1 align-top">{children}</td>
  ),
};

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: Array<{ name: string; ok: boolean }>;
}

interface AiAssistantProps {
  onBack: () => void;
  mode?: AiMode;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function AiAssistant({ onBack, mode = "assistant" }: AiAssistantProps) {
  const meta = MODE_META[mode];
  const Icon = meta.icon;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendAction = useAction(api.ai.chat);

  // Kick off lazy syntax-highlight languages, then re-render once ready so
  // code blocks switch from plain to highlighted.
  const [, setLangsReady] = useState(false);
  useEffect(() => {
    let alive = true;
    registerLanguages().then(() => {
      if (alive) setLangsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async (text?: string) => {
    const content = sanitizeUserInput((text ?? input).trim());
    if (!content || pending) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content }]);
    setPending(true);
    try {
      const history = [...messages, { role: "user" as const, content }].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await sendAction({ messages: history, mode });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, toolsUsed: res.toolsUsed },
      ]);
    } catch (err) {
      // ConvexError carries our friendly backend message; plain errors are
      // masked by Convex into a generic "Server Error".
      const msg =
        err instanceof ConvexError &&
        typeof err.data === "object" &&
        err.data !== null &&
        "message" in err.data
          ? String((err.data as { message: unknown }).message)
          : err instanceof Error
            ? err.message
            : String(err);
      setError(
        msg.includes("GROQ_API_KEY") || msg.includes("backend key")
          ? "Backend AI key belum terkonfigurasi — set GROQ_API_KEY di environment Convex."
          : msg.includes("429") || msg.includes("rate limit") || msg.includes("rate-limited")
            ? "Rate limit free tier kena (30/menit, 1.000/hari). Coba lagi sebentar lagi."
            : `AI request gagal: ${msg.slice(0, 240)}`,
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col h-full">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 mb-6 self-start text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${meta.bg}`}>
            <Icon className={`size-7 ${meta.color}`} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight mb-1">{meta.title}</h1>
            <p className="text-muted-foreground text-sm">{meta.subtitle}</p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages([]);
                setError(null);
              }}
              className="gap-2 ml-auto text-xs shrink-0"
            >
              <Trash2 className="size-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="glass-card rounded-2xl flex-1 min-h-[320px] max-h-[58vh] overflow-y-auto p-4 sm:p-5 space-y-4"
        >
          {messages.length === 0 && !pending && (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <Icon className={`size-10 mb-3 ${meta.color} opacity-30`} />
              <p className="text-sm text-muted-foreground mb-1">
                Ask anything — this assistant can call live tools
              </p>
              <p className="text-xs text-muted-foreground/70">
                subdomain enum (crt.sh) · CMS fingerprint · CVE search (NVD) · hashing
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-5 max-w-lg">
                {meta.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-cyan/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
                  m.role === "user"
                    ? "bg-cyan/15 border border-cyan/25 text-foreground"
                    : "bg-card/80 border border-border/60"
                }`}
              >
                {m.role === "assistant" && m.toolsUsed && m.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {m.toolsUsed.map((t, j) => (
                      <span
                        key={j}
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                          t.ok
                            ? "text-emerald border-emerald/30 bg-emerald/5"
                            : "text-red border-red/30 bg-red/5"
                        }`}
                      >
                        <Wrench className="size-2.5" />
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}
                {m.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                )}
              </div>
            </div>
          ))}

          {pending && (
            <div className="flex justify-start">
              <div className="bg-card/80 border border-border/60 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-cyan" />
                <span>Analyzing & running tools…</span>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-start gap-2 text-xs text-red border border-red/30 bg-red/5 rounded-xl px-3 py-2">
            <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Input */}
        <div className="mt-4 flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={`Ask ${meta.title}… (Enter to send, Shift+Enter for newline)`}
            className="flex-1 resize-none rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm outline-none focus:border-cyan/50 transition-colors placeholder:text-muted-foreground/60"
          />
          <Button
            onClick={() => send()}
            disabled={pending || !input.trim()}
            className={`gap-2 h-[52px] px-5 font-semibold ${mode === "vulnanalyst" ? "bg-red hover:bg-red/90" : mode === "shellcmd" ? "bg-amber hover:bg-amber/90 text-background" : mode === "codegen" ? "bg-purple hover:bg-purple/90" : "bg-cyan hover:bg-cyan/90 text-background"}`}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/70 mt-2 text-center">
          AI responses may be inaccurate — verify before acting. Authorized testing only. Free tier: 1,000 requests/day.
        </p>
      </div>
    </motion.div>
  );
}
