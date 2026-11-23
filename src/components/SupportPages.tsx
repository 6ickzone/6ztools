import { motion } from "framer-motion";
import { ArrowLeft, Shield, Scale, Mail, Heart, Bug, History, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PageId = "privacy" | "terms" | "contact" | "donate" | "bugbounty" | "changelog" | "community";

interface Section {
  heading: string;
  body: string[];
}

interface PageConfig {
  id: PageId;
  title: string;
  icon: React.ReactNode;
  color: string;
  intro: string;
  status?: "active" | "inactive";
  sections: Section[];
}

const PAGES: Record<PageId, PageConfig> = {
  privacy: {
    id: "privacy",
    title: "Privacy Policy",
    icon: <Shield className="size-8 text-cyan" />,
    color: "cyan",
    intro: "6ztools is built privacy-first: scans run in your browser, and we design every feature so that your targets, queries, and results stay on your machine.",
    sections: [
      { heading: "Data We Collect", body: ["We do not require an account and we do not store scan results, tool inputs, or generated payloads on any server. When you use a tool that calls an external API, only that request leaves your browser, and it is handled under the provider's own privacy policy."] },
      { heading: "Local Storage", body: ["Your theme preference, language selection, and saved webhook URLs are kept in your browser's localStorage. This data never leaves your device and you can clear it at any time through your browser settings."] },
      { heading: "Third-Party Requests", body: ["Some tools route requests through public CORS proxies or free APIs (NVD, HackerTarget, Cloudflare DoH, CoinGecko). Only the target URL or query you submit is sent — no personal identifiers are attached."] },
      { heading: "Cookies", body: ["6ztools does not set tracking cookies, run analytics, or fingerprint your device. Session state ends when you close the tab."] },
      { heading: "Your Rights", body: ["You may use the platform anonymously. Because we hold no personal data, there is nothing to export or delete — clearing your browser storage removes the only local records we keep."] },
    ],
  },
  terms: {
    id: "terms",
    title: "Terms of Service",
    icon: <Scale className="size-8 text-purple" />,
    color: "purple",
    intro: "By accessing 6ztools you agree to use these tools solely for authorized security testing, education, and legitimate research.",
    sections: [
      { heading: "Acceptable Use", body: ["You may use the platform for penetration testing with written authorization, defensive security research, CTF challenges, and learning. Scanning, enumerating, or exploiting systems you do not own or have explicit permission to test is prohibited.", "You agree not to use 6ztools to disrupt services, exfiltrate data, or compromise the privacy of third parties."] },
      { heading: "No Warranty", body: ["The platform is provided \"as is\" without warranties of any kind. Tool outputs may be incomplete or inaccurate; always verify findings manually before acting on them. We are not liable for damage arising from use of the platform."] },
      { heading: "Legal Responsibility", body: ["You are solely responsible for complying with all applicable local, national, and international laws. Authorization requirements vary by jurisdiction — obtain permission before testing any system you do not own."] },
      { heading: "Changes to Terms", body: ["We may update these terms as the platform evolves. Continued use after changes constitutes acceptance of the revised terms."] },
    ],
  },
  contact: {
    id: "contact",
    title: "Contact Us",
    icon: <Mail className="size-8 text-emerald" />,
    color: "emerald",
    intro: "Questions, bug reports, research collaboration, or partnership ideas? Reach the 6ztools team through any of the channels below.",
    sections: [
      { heading: "WhatsApp", body: ["+62 838-6696-6862 — the fastest channel for quick questions, business inquiries, and technical support."] },
      { heading: "Telegram", body: ["@yungx6ick — DM for research collaboration, tool requests, and anything that needs a bit more back-and-forth."] },
      { heading: "Instagram", body: ["@6ickzone — announcements, release posts, and behind-the-scenes updates from the project."] },
      { heading: "Email Support", body: ["admin@6ickzone.site — general questions, feature requests, feedback, and security reports about the platform itself. Please follow responsible disclosure: allow us 90 days to remediate before publishing.", "6ickwhispers@gmail.com — alternate address for longer requests and attachments. We typically respond within two business days."] },
      { heading: "Partnerships", body: ["For integrations, API access, or content collaborations, include \"Partnership\" in your subject line and a short description of what you have in mind."] },
    ],
  },
  donate: {
    id: "donate",
    title: "Donate",
    icon: <Heart className="size-8 text-red" />,
    color: "red",
    intro: "6ztools is free and ad-free. Donations keep the infrastructure running, the tool list growing, and the platform independent.",
    sections: [
      { heading: "Where Money Goes", body: ["Hosting and CDN costs, API quotas for free-tier intel sources, and maintenance of the tool catalog. Every tool on the platform stays free regardless of donation status."] },
      { heading: "Ways to Support", body: ["Crypto donations (BTC, ETH, and USDT addresses are posted on the community forum), GitHub sponsorship for our open-source components, or simply sharing the platform with your security team."] },
      { heading: "Transparency", body: ["We publish a quarterly summary of income and expenses in the changelog. Donors are never given special privileges over other users — the platform stays equal for everyone."] },
    ],
  },
  bugbounty: {
    id: "bugbounty",
    title: "Bug Bounty",
    icon: <Bug className="size-8 text-amber" />,
    color: "amber",
    status: "inactive",
    intro: "The 6ztools bug bounty program is currently inactive. Submissions are paused — the scope and process below are kept for reference and will apply again if the program reopens.",
    sections: [
      { heading: "Program Status", body: ["This program is inactive: no submissions are being accepted or triaged right now, and no rewards or acknowledgements are issued during this period. If you have an urgent security report about the platform itself, use the Contact page instead and mark it clearly as a security issue."] },
      { heading: "In Scope", body: ["XSS, CSRF, or injection flaws in the web application. Authentication or authorization bypasses. Sensitive data exposure in our own infrastructure. Insecure deserialization or prototype pollution in frontend code."] },
      { heading: "Out of Scope", body: ["Denial-of-service attacks, social engineering, physical attacks, and issues in third-party APIs or proxies used by tools. Findings from automated scanners without a demonstrated impact are usually duplicates."] },
      { heading: "Disclosure Process", body: ["Report via security@6ickzone.io with reproduction steps. We acknowledge within 48 hours, confirm within 10 days, and aim to fix critical issues within 14 days. Please keep details confidential until a fix ships."] },
      { heading: "Recognition", body: ["Confirmed reports are credited in the changelog (unless you prefer to remain anonymous). High-impact findings earn limited-edition platform swag."] },
    ],
  },
  changelog: {
    id: "changelog",
    title: "Changelog",
    icon: <History className="size-8 text-purple" />,
    color: "purple",
    intro: "Every release of the 6ztools platform, newest first.",
    sections: [
      { heading: "v1.0 Beta — Current", body: ["Beta release: 100+ tools across 12 categories, no login required. Full pentest suite — CMS scanner, subdomain scanner with 4 intel sources, XSS/SQLi/LFI scanners with 60+ payloads. Crypto research toolkit with BIP39, ABI decoding, and live prices. Network tools including port scanner, DNS/IP lookup, and bandwidth tester. Dark/light theme with keyboard shortcuts and persistent preferences."] },
      { heading: "v0.9 — Beta", body: ["Web shell archive with 16 verified entries and default credentials panel. Command database and cheatsheets. Exploit-DB search with curated CVE index. Performance pass on all async scanners with abort controls and progress reporting."] },
      { heading: "v0.8 — Alpha", body: ["Initial internal build: dashboard shell, sidebar navigation, CMS scanner, generators (password, hash, QR, payload, reverse shell), and encoder suite."] },
    ],
  },
  community: {
    id: "community",
    title: "Community Forum",
    icon: <Users className="size-8 text-cyan" />,
    color: "cyan",
    intro: "The 6ztools community is where researchers share tool improvements, write-ups, and help each other debug scans.",
    sections: [
      { heading: "Getting Started", body: ["Introduce yourself in the welcome thread with your focus area (web, network, crypto, or OSINT). Search existing threads before posting a new question — most tool quirks are already documented."] },
      { heading: "Channels", body: ["Tool Discussion — feedback and feature requests for specific tools. Write-Ups — authorized testing reports and CTF solutions. Fixes & Tweaks — patches, wordlists, and payload improvements contributed by members."] },
      { heading: "Rules", body: ["No sharing of unauthorized target data, no requests for help attacking systems you don't own, and no commercial spam. Keep exploit details responsible — educational framing only."] },
      { heading: "Contributing", body: ["Tool source lives on our GitHub. Open a pull request with a working implementation following the existing component pattern, or vote on the roadmap board for the next tool you want built."] },
    ],
  },
};

const ICON_MAP: Record<string, React.ReactNode> = {
  privacy: <Shield className="size-5 text-cyan" />,
  terms: <Scale className="size-5 text-purple" />,
  contact: <Mail className="size-5 text-emerald" />,
  donate: <Heart className="size-5 text-red" />,
  bugbounty: <Bug className="size-5 text-amber" />,
  changelog: <History className="size-5 text-purple" />,
  community: <Users className="size-5 text-cyan" />,
};

export function SupportPage({ pageId, onBack }: { pageId: PageId; onBack: () => void }) {
  const page = PAGES[pageId];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className={`flex size-16 items-center justify-center rounded-2xl shrink-0 bg-${page.color}/10`}>{page.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{page.title}</h1>
              {page.status === "inactive" ? (
                <Badge variant="outline" className="text-xs border-red/40 text-red">Inactive</Badge>
              ) : (
                <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">Active</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-base">{page.intro}</p>
          </div>
        </div>

        <div className="space-y-5">
          {page.sections.map((section, i) => (
            <motion.div key={section.heading}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <FileText className={`size-4 text-${page.color}`} />
                <h2 className="text-base font-semibold tracking-tight">{section.heading}</h2>
              </div>
              {section.body.map((para, j) => (
                <p key={j} className="text-sm text-muted-foreground leading-relaxed mt-2 first:mt-0">{para}</p>
              ))}
            </motion.div>
          ))}
        </div>

        <div className={`glass-card rounded-xl p-4 mt-6 border border-${page.color}/20`}>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">{page.title}</strong> — last updated September 2026. Questions? Use the Contact page.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* Sidebar list of support pages */
export const SUPPORT_PAGE_IDS: PageId[] = ["privacy", "terms", "contact", "donate", "bugbounty", "changelog", "community"];

export function SupportHub({ onBack, onSelect }: { onBack: () => void; onSelect: (id: PageId) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-cyan/10"><FileText className="size-6 text-cyan" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Support & Policies</h1>
            <p className="text-sm text-muted-foreground">Privacy, terms, contact, bug bounty, and community pages.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUPPORT_PAGE_IDS.map((id) => {
            const p = PAGES[id];
            return (
              <button key={id} onClick={() => onSelect(id)}
                className="glass-card rounded-xl p-5 text-left border border-border/30 hover:border-cyan/20 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex size-9 items-center justify-center rounded-lg bg-${p.color}/10`}>{p.icon}</div>
                  <span className="font-semibold text-sm group-hover:text-cyan transition-colors">{p.title}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.intro}</p>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export type { PageId };
