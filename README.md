<div align="center">

<img src="public/favicon.svg" width="96" alt="6ztools logo" />

<h1>6ztools</h1>

<p><b>Security research platform — 100+ recon, exploitation, encoder & utility tools inside one terminal-style dashboard.</b></p>

<p>
  <img alt="status" src="https://img.shields.io/badge/STATUS-BETA-34d399?style=for-the-badge&labelColor=0b0f0e" />
  <img alt="tools" src="https://img.shields.io/badge/TOOLS-73%20LIVE%20%2F%20106-06b6d4?style=for-the-badge&labelColor=0b0f0e" />
  <img alt="categories" src="https://img.shields.io/badge/CATEGORIES-12-f59e0b?style=for-the-badge&labelColor=0b0f0e" />
  <img alt="login" src="https://img.shields.io/badge/LOGIN-NOT%20REQUIRED-ef4444?style=for-the-badge&labelColor=0b0f0e" />
</p>

<p>
  <img alt="react" src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&labelColor=0b0f0e" />
  <img alt="typescript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&labelColor=0b0f0e" />
  <img alt="tailwind" src="https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&labelColor=0b0f0e" />
  <img alt="convex" src="https://img.shields.io/badge/Convex-backend-ee342f?style=flat-square&labelColor=0b0f0e" />
  <img alt="vite" src="https://img.shields.io/badge/Vite-7-646cff?style=flat-square&labelColor=0b0f0e" />
  <img alt="framer" src="https://img.shields.io/badge/Framer_Motion-12-e64bf5?style=flat-square&labelColor=0b0f0e" />
</p>

</div>

---

> ⚠️ **Beta / Work in Progress.** 73 tools live, 32 still in development, 1 inactive. Interfaces, payloads and
> endpoints are still being refactored, so expect rough edges. Reports, ideas and pull requests are welcome.

> ⚡ **No account needed.** Every tool runs directly from the browser — no signup, no login wall, no quota page.
> Some heavy jobs (AI assistant, CVE/exploit lookups) are proxied through the Convex backend so API keys stay server-side.

---

## ✨ Key Features

- 🧰 **One dashboard, 12 categories** — recon, exploitation helpers, crypto research, generators, encoders, learning and support pages in a single shell.
- 🔗 **Deep-linkable tools** — every tool has its own route (`/dashboard/<slug>`), so a link opens that exact panel, not the dashboard root.
- 🎨 **Terminal-style dark UI** — emerald-on-black palette, monospace accents, hover/route transitions with Framer Motion, fully responsive from phone to desktop.
- 🛡️ **Server-side proxying** — scanners and lookups go through Convex actions instead of browser fetches, dodging CORS limits and hiding upstream keys.
- 🤖 **AI assistant with live tools** — the built-in assistant can call platform tools mid-conversation (Groq, `openai/gpt-oss-120b` with a 20b fallback).
- 🗂️ **Web Shell Archive** — curated collection of 23 public shell URLs, served raw.
- 📚 **Docs + changelog in-app** — feature reference, keyboard-friendly navigation and a version history page.
- 🧩 **Modular tool registry** — one `sidebar-data.ts` entry + one component, and the tool appears in nav, dashboard grid and routes.

---

## 🧰 Tool Catalogue

Status legend: **✅ live** · **🚧 in development** · **⛔ inactive**

### ✅ Available now — 73 tools

| Tool | Category | Description |
| --- | --- | --- |
| **Web Shell Archive** | Web Shell Archive | Collection of 23 public shells — raw URLs |
| **CMS Scanner** | Pentesting Tools | Detect CMS, version & stack via regex |
| **Subdomain Scanner** | Pentesting Tools | Passive recon with live filter |
| **Admin Page Finder** | Pentesting Tools | Discover admin panels |
| **Shell Finder** | Pentesting Tools | Locate web shells on targets |
| **XSS Scanner** | Pentesting Tools | Reflected XSS payload injection |
| **SQL Injection Scanner** | Pentesting Tools | 60+ payloads with DB error detect |
| **LFI/RFI Scanner** | Pentesting Tools | Path traversal & file inclusion |
| **Port Scanner** | Pentesting Tools | Fast multi-threaded scanner |
| **Directory Brute Forcer** | Pentesting Tools | Path discovery engine |
| **Backup File Scanner** | Pentesting Tools | Find exposed backups |
| **Sensitive Data Finder** | Pentesting Tools | Leaked credentials & keys |
| **CVE Vulnerability Scanner** | Pentesting Tools | NVD CVE database search |
| **SSL/TLS Checker** | Pentesting Tools | Certificate & protocol audit |
| **Mnemonic Generator** | Crypto Research | 12/24 word phrase generator |
| **Private Key Generator** | Crypto Research | Secure key generation |
| **ABI Decoder** | Crypto Research | Smart contract ABI decoder |
| **Gas Tracker** | Crypto Research | ETH, BSC, Polygon fees |
| **DeFi Yield Calculator** | Crypto Research | APY & yield projections |
| **Crypto Price Tracker** | Crypto Research | Real-time market data |
| **Page Builder** | Generators | Deface page templates & HTML export |
| **JavaScript Obfuscator** | Generators | JS code protection |
| **QR Code Generator** | Generators | Custom QR code builder |
| **Password Generator** | Generators | Random secure passwords |
| **Hash Generator** | Generators | MD5, SHA1, SHA256, SHA512 |
| **Payload Generator** | Generators | Custom attack payloads |
| **Reverse Shell Generator** | Generators | Multi-language reverse shells |
| **Wordlist Generator** | Generators | Custom wordlist builder |
| **Mass Notifier** | Website/URL Tools | Bulk deface archive notifier |
| **Mass Add File Name** | Website/URL Tools | Bulk file naming tool |
| **Mass Add Subdomain Mail** | Website/URL Tools | Bulk subdomain adder |
| **Mass Add HTTP/S** | Website/URL Tools | Bulk protocol add/strip |
| **Link Scraper** | Website/URL Tools | Extract all links from URL |
| **URL Encoder/Decoder** | Website/URL Tools | Encode & decode URLs |
| **Base64 Encoder/Decoder** | Website/URL Tools | Base64 transform tool |
| **HTML Minifier** | Website/URL Tools | Compress HTML output |
| **CSS Minifier** | Website/URL Tools | Compress CSS stylesheets |
| **JS Minifier** | Website/URL Tools | Compress JavaScript code |
| **IP Lookup** | Network Tools | GeoIP & ISP information |
| **DNS Lookup** | Network Tools | Full DNS record query |
| **Whois Checker** | Network Tools | Domain registration info |
| **Ping Monitor** | Network Tools | Continuous latency monitor |
| **Bandwidth Tester** | Network Tools | Download speed test |
| **MAC Address Lookup** | Network Tools | Vendor identification |
| **Social Media Search** | OSINT & Recon | Cross-platform username OSINT |
| **Domain Age Checker** | OSINT & Recon | Registration timeline |
| **Reverse IP Lookup** | OSINT & Recon | Shared hosting finder |
| **SSL Certificate Info** | OSINT & Recon | Cert transparency logs |
| **MetaData Extractor** | OSINT & Recon | File metadata analysis |
| **GitHub Dorker** | OSINT & Recon | Source code dorking |
| **6ztools AI Assistant** | AI & Bot | AI-powered analysis with live tools |
| **Discord Webhook Tester** | AI & Bot | Webhook testing tool |
| **AI Code Generator** | AI & Bot | Security code builder |
| **AI Shell Command Gen** | AI & Bot | Command builder AI |
| **AI Vulnerability Analyst** | AI & Bot | Vuln analysis assistant |
| **Exploit-DB Search** | Exploit Tools | Search 50k+ exploits |
| **0day Checker** | Exploit Tools | CISA KEV catalog check |
| **PHP Encoder** | Security Encoder | PHP code obfuscation |
| **Python Obfuscator** | Security Encoder | Python code protection |
| **JavaScript Encrypter** | Security Encoder | JS encryption wrapper |
| **.NET Protector** | Security Encoder | Assembly protection |
| **Perl Crypt** | Security Encoder | Perl encryption tools |
| **Ruby Encoder** | Security Encoder | Ruby code obfuscation |
| **Java Obfuscator** | Security Encoder | Java source obfuscation |
| **Payload Encoder** | Security Encoder | Multi-format encoding |
| **Command Database** | Learning & Lab | Reference command library |
| **Cheat Sheets** | Learning & Lab | Quick reference guides |
| **Privacy Policy** | Support Pages | Data protection policy |
| **Terms of Service** | Support Pages | Usage terms & conditions |
| **Contact Us** | Support Pages | Reach our team |
| **Donate** | Support Pages | Support the project |
| **Changelog** | Support Pages | Version history |
| **Community Forum** | Support Pages | Discussion board |

### 🚧 In development — 32 tools

| Tool | Category | Description |
| --- | --- | --- |
| **CSRF Uploader** | Pentesting Tools | Cross-site request forgery |
| **Wallet Address Lookup** | Crypto Research | Blockchain address explorer |
| **Token Scanner** | Crypto Research | Token contract analyzer |
| **NFT Checker** | Crypto Research | NFT ownership & metadata |
| **Smart Contract Analyzer** | Crypto Research | Contract security audit |
| **PHP Polymorphic** | Generators | KCK Generator |
| **Malware String Obfuscator** | Generators | String encryption tool |
| **Website Mirror** | Website/URL Tools | Clone website locally |
| **Screenshot Capture** | Website/URL Tools | Full page screenshots |
| **Traceroute** | Network Tools | Network path visualization |
| **Network Scanner** | Network Tools | Local network discovery |
| **Packet Analyzer** | Network Tools | Traffic inspection tool |
| **Email Hunter** | OSINT & Recon | Find emails from domain |
| **Phone Number Lookup** | OSINT & Recon | Number intelligence |
| **Site IP History** | OSINT & Recon | Historical DNS records |
| **Pastebin Scraper** | OSINT & Recon | Paste monitoring tool |
| **Shodan Integration** | OSINT & Recon | Internet device search |
| **Telegram Market Bot** | AI & Bot | Market integration bot |
| **Automated Pentest Bot** | AI & Bot | Auto pentest workflow |
| **Chat Analysis Tool** | AI & Bot | Conversation analyzer |
| **Metasploit Console** | Exploit Tools | MSF web interface |
| **Burp Suite Proxy** | Exploit Tools | Proxy configuration |
| **SQLMap Interface** | Exploit Tools | SQLi automation UI |
| **Hydra Brute Forcer** | Exploit Tools | Credential brute force |
| **Nmap Web Scanner** | Exploit Tools | Network mapping UI |
| **Nikto Web Scanner** | Exploit Tools | Web server scanner |
| **WPScan Interface** | Exploit Tools | WordPress scanner UI |
| **Python Security Course** | Learning & Lab | Learn Python for security |
| **Web Exploitation Lab** | Learning & Lab | Hands-on web hacking |
| **Crypto Tutorials** | Learning & Lab | Cryptography lessons |
| **CTF Challenges** | Learning & Lab | Capture The Flag puzzles |
| **Security Notes** | Learning & Lab | Personal notes & findings |

### ⛔ Inactive — 1 tool

| Tool | Category | Description |
| --- | --- | --- |
| **Bug Bounty** | Support Pages | Program currently inactive |

---

## 🧱 Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + TypeScript, Vite |
| Routing | React Router v7 — imports from `react-router` (not `react-router-dom`) |
| Styling | Tailwind CSS v4, custom emerald/dark tokens in `src/index.css` |
| UI kit | shadcn/ui primitives on Radix, Lucide icons |
| Motion | Framer Motion |
| Backend / DB | Convex (queries, actions, HTTP routes) |
| AI | Groq API via Convex action — `openai/gpt-oss-120b`, fallback `openai/gpt-oss-20b` |
| Tooling | Bun, ESLint, Prettier |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── AppLayout.tsx          # app shell: sidebar, breadcrumb, theme toggle
│   ├── LogoMark.tsx           # hexagon "Z" logo mark
│   ├── ToolView.tsx           # generic tool wrapper (header, actions, panels)
│   ├── SupportPages.tsx       # privacy / terms / contact / donate / changelog ...
│   ├── WebShellArchive.tsx    # web shell collection view
│   ├── AboutPage.tsx          # author profile
│   └── tools/                 # one component per tool (scanners, encoders, AI, ...)
├── convex/                    # backend: schema, queries, actions, AI proxy
├── data/sidebar-data.ts       # single source of truth for nav + tool status
├── pages/
│   ├── Landing.tsx            # public landing page
│   ├── Dashboard.tsx          # tool router, derives panel from the URL
│   └── DocumentationPage.tsx  # in-app docs
└── main.tsx                   # routes: / , /auth , /dashboard/*
```

Adding a tool = append an entry to `sidebarCategories` in `src/data/sidebar-data.ts` with
`status: "active" | "coming-soon"`, then render its component in `src/pages/Dashboard.tsx`.
The nav, dashboard grid and `/dashboard/<slug>` route pick it up automatically.

---

## 🚀 Getting Started

```bash
bun install          # install dependencies
bunx convex dev      # start the Convex dev deployment (writes generated types)
bun run dev          # Vite dev server
bun run build        # tsc -b && vite build
bun run lint         # eslint
```

> Run `bunx convex dev --once` when you only need codegen/types without a watcher.

### Environment variables

Client (`.env.local`):

| Variable | Purpose |
| --- | --- |
| `VITE_CONVEX_URL` | Convex deployment URL used by the React client |
| `CONVEX_DEPLOYMENT` | Deployment selector for the Convex CLI |

Backend (set with `bunx convex env set <NAME> <value>`, never in `.env.local`):

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Server-side key for the AI assistant — never exposed to the browser |
| `JWKS`, `JWT_PRIVATE_KEY`, `SITE_URL` | Convex Auth keys |

`.env.local` is gitignored. Keep keys in the deployment environment, not in the repo.

---

## ⚖️ Disclaimer

6ztools is built for **authorized security testing, education and research only** — labs you own,
CTFs, bug bounty programs and written-permission engagements. Scanning, exploiting or brute-forcing
systems you do not own or have explicit permission to test is illegal in most jurisdictions and is
entirely your responsibility. The authors accept no liability for misuse or damage caused by this tool.

---

<div align="center">

<sub>Built with 🖤 by <b>6ickzone</b></sub>
<br/>
<sub>© 2026 6ickzone — all rights reserved</sub>

</div>
