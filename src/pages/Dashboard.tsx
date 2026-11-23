import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { ToolView } from "@/components/ToolView";
import { WebShellArchive } from "@/components/WebShellArchive";
import { CmsScanner } from "@/components/CmsScanner";
import { ComingSoon } from "@/components/ComingSoon";
import { PasswordGenerator } from "@/components/tools/PasswordGenerator";
import { HashGenerator } from "@/components/tools/HashGenerator";
import { Base64Tool } from "@/components/tools/Base64Tool";
import { UrlEncoderDecoder } from "@/components/tools/UrlEncoderDecoder";
import { QrCodeGenerator } from "@/components/tools/QrCodeGenerator";
import { ReverseShellGenerator } from "@/components/tools/ReverseShellGenerator";
import { PayloadGenerator } from "@/components/tools/PayloadGenerator";
import { PageBuilder } from "@/components/tools/PageBuilder";
import { SubdomainScanner } from "@/components/tools/SubdomainScanner";
import { AdminPageFinder } from "@/components/tools/AdminPageFinder";
import { ShellFinder } from "@/components/tools/ShellFinder";
import { XssScanner } from "@/components/tools/XssScanner";
import { SqlInjectionScanner } from "@/components/tools/SqlInjectionScanner";
import { LfiRfiScanner } from "@/components/tools/LfiRfiScanner";
import { DirectoryBruteForcer } from "@/components/tools/DirectoryBruteForcer";
import { BackupFileScanner } from "@/components/tools/BackupFileScanner";
import { SensitiveDataFinder } from "@/components/tools/SensitiveDataFinder";
import { SslTlsChecker } from "@/components/tools/SslTlsChecker";
import { JsObfuscator } from "@/components/tools/JsObfuscator";
import { MnemonicGenerator } from "@/components/tools/MnemonicGenerator";
import { PrivateKeyGenerator } from "@/components/tools/PrivateKeyGenerator";
import { AbiDecoder } from "@/components/tools/AbiDecoder";
import { DefiYieldCalculator } from "@/components/tools/DefiYieldCalculator";
import { CryptoPriceTracker } from "@/components/tools/CryptoPriceTracker";
import { IpLookup } from "@/components/tools/IpLookup";
import { DnsLookup } from "@/components/tools/DnsLookup";
import { WhoisChecker } from "@/components/tools/WhoisChecker";
import { MacAddressLookup } from "@/components/tools/MacAddressLookup";
import { HtmlMinifier } from "@/components/tools/HtmlMinifier";
import { CssMinifier } from "@/components/tools/CssMinifier";
import { WordlistGenerator } from "@/components/tools/WordlistGenerator";
import { GitHubDorker } from "@/components/tools/GitHubDorker";
import { PortScanner } from "@/components/tools/PortScanner";
import { JsMinifier } from "@/components/tools/JsMinifier";
import { LinkScraper } from "@/components/tools/LinkScraper";
import { MetaDataExtractor } from "@/components/tools/MetaDataExtractor";
import { PythonObfuscator } from "@/components/tools/PythonObfuscator";
import { GasTracker } from "@/components/tools/GasTracker";
import { DomainAgeChecker } from "@/components/tools/DomainAgeChecker";
import { SslCertInfo } from "@/components/tools/SslCertInfo";
import { MassNotifier } from "@/components/tools/MassNotifier";
import { MassAddHttp, MassAddFileName, MassAddSubdomainMail } from "@/components/tools/MassUrlTools";
import { PayloadEncoder } from "@/components/tools/PayloadEncoder";
import { SocialMediaSearch } from "@/components/tools/SocialMediaSearch";
import { ExploitDbSearch } from "@/components/tools/ExploitDbSearch";
import { CommandDatabase, CheatSheets } from "@/components/tools/CommandReference";
import { PingMonitor, BandwidthTester } from "@/components/tools/PingMonitor";
import { CveScanner } from "@/components/tools/CveScanner";
import { ReverseIpLookup } from "@/components/tools/ReverseIpLookup";
import { PhpEncoder, JsEncrypter, JavaObfuscator, RubyEncoder, PerlCrypt, DotNetProtector } from "@/components/tools/LanguageEncoders";
import { DiscordWebhookTester } from "@/components/tools/DiscordWebhookTester";
import { ZeroDayChecker } from "@/components/tools/ZeroDayChecker";
import { AiAssistant, type AiMode } from "@/components/tools/AiAssistant";
import { SupportPage, type PageId } from "@/components/SupportPages";
import { AboutPage } from "@/components/AboutPage";
import DashboardPage from "@/pages/DashboardPage";
import DocumentationPage from "@/pages/DocumentationPage";
import { sidebarCategories } from "@/data/sidebar-data";
import type { ToolItem } from "@/data/sidebar-data";

const KNOWN_PAGES = [
  "/dashboard",
  "/dashboard/about",
  "/dashboard/documentation",
  "/dashboard/webshells",
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  // URL is the source of truth so deep links (`/dashboard/about`) and browser
  // back/forward work; unknown subpaths fall back to the dashboard home.
  const activePage = KNOWN_PAGES.includes(location.pathname)
    ? location.pathname
    : "/dashboard";
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
      setSelectedTool(null);
    },
    [navigate],
  );

  const handleToolSelect = useCallback((tool: ToolItem | null) => {
    setSelectedTool(tool);
  }, []);

  const renderContent = () => {
    if (selectedTool) {
      // Functional tools
      if (selectedTool.name === "CMS Scanner") {
        return <CmsScanner onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Password Generator") {
        return <PasswordGenerator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Hash Generator") {
        return <HashGenerator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Base64 Encoder/Decoder") {
        return <Base64Tool onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "URL Encoder/Decoder") {
        return <UrlEncoderDecoder onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "QR Code Generator") {
        return <QrCodeGenerator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Reverse Shell Generator") {
        return <ReverseShellGenerator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Payload Generator") {
        return <PayloadGenerator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Page Builder") {
        return <PageBuilder onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Subdomain Scanner") {
        return <SubdomainScanner onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Admin Page Finder") {
        return <AdminPageFinder onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Shell Finder") {
        return <ShellFinder onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "XSS Scanner") {
        return <XssScanner onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "SQL Injection Scanner") {
        return <SqlInjectionScanner onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "LFI/RFI Scanner") {
        return <LfiRfiScanner onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Directory Brute Forcer") {
        return <DirectoryBruteForcer onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Backup File Scanner") {
        return <BackupFileScanner onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Sensitive Data Finder") {
        return <SensitiveDataFinder onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "SSL/TLS Checker") {
        return <SslTlsChecker onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "JavaScript Obfuscator") {
        return <JsObfuscator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Mnemonic Generator") {
        return <MnemonicGenerator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Private Key Generator") {
        return <PrivateKeyGenerator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "ABI Decoder") {
        return <AbiDecoder onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "DeFi Yield Calculator") {
        return <DefiYieldCalculator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Crypto Price Tracker") {
        return <CryptoPriceTracker onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "IP Lookup") {
        return <IpLookup onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "DNS Lookup") {
        return <DnsLookup onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Whois Checker") {
        return <WhoisChecker onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "MAC Address Lookup") {
        return <MacAddressLookup onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "HTML Minifier") {
        return <HtmlMinifier onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "CSS Minifier") {
        return <CssMinifier onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Wordlist Generator") {
        return <WordlistGenerator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "GitHub Dorker") {
        return <GitHubDorker onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Port Scanner") {
        return <PortScanner onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "JS Minifier") {
        return <JsMinifier onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Link Scraper") {
        return <LinkScraper onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "MetaData Extractor") {
        return <MetaDataExtractor onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Python Obfuscator") {
        return <PythonObfuscator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Gas Tracker") {
        return <GasTracker onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Domain Age Checker") {
        return <DomainAgeChecker onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "SSL Certificate Info") {
        return <SslCertInfo onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Mass Notifier") {
        return <MassNotifier onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Mass Add HTTP/S") {
        return <MassAddHttp onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Mass Add File Name") {
        return <MassAddFileName onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Mass Add Subdomain Mail") {
        return <MassAddSubdomainMail onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Payload Encoder") {
        return <PayloadEncoder onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Social Media Search") {
        return <SocialMediaSearch onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Exploit-DB Search") {
        return <ExploitDbSearch onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Command Database") {
        return <CommandDatabase onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Cheat Sheets") {
        return <CheatSheets onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Ping Monitor") {
        return <PingMonitor onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Bandwidth Tester") {
        return <BandwidthTester onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "CVE Vulnerability Scanner") {
        return <CveScanner onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Reverse IP Lookup") {
        return <ReverseIpLookup onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "PHP Encoder") {
        return <PhpEncoder onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "JavaScript Encrypter") {
        return <JsEncrypter onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Java Obfuscator") {
        return <JavaObfuscator onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Ruby Encoder") {
        return <RubyEncoder onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Perl Crypt") {
        return <PerlCrypt onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === ".NET Protector") {
        return <DotNetProtector onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "Discord Webhook Tester") {
        return <DiscordWebhookTester onBack={() => setSelectedTool(null)} />;
      }
      if (selectedTool.name === "0day Checker") {
        return <ZeroDayChecker onBack={() => setSelectedTool(null)} />;
      }
      // AI cluster — one backend, four menus, different system prompts
      const aiModeMap: Record<string, AiMode> = {
        "6ztools AI Assistant": "assistant",
        "AI Code Generator": "codegen",
        "AI Shell Command Gen": "shellcmd",
        "AI Vulnerability Analyst": "vulnanalyst",
      };
      const aiMode = aiModeMap[selectedTool.name];
      if (aiMode) {
        return <AiAssistant mode={aiMode} onBack={() => setSelectedTool(null)} />;
      }
      const supportMap: Record<string, PageId> = {
        "Privacy Policy": "privacy",
        "Terms of Service": "terms",
        "Contact Us": "contact",
        "Donate": "donate",
        "Bug Bounty": "bugbounty",
        "Changelog": "changelog",
        "Community Forum": "community",
      };
      const supportPageId = supportMap[selectedTool.name];
      if (supportPageId) {
        return <SupportPage pageId={supportPageId} onBack={() => setSelectedTool(null)} />;
      }
      // Coming soon tools
      if (selectedTool.status === "coming-soon") {
        const category = sidebarCategories.find((c) =>
          c.items.some((item) => item.name === selectedTool.name)
        );
        return (
          <ComingSoon
            toolName={selectedTool.name}
            description={selectedTool.description}
            category={category?.label}
            onBack={() => setSelectedTool(null)}
          />
        );
      }
      return (
        <ToolView
          tool={selectedTool}
          onBack={() => setSelectedTool(null)}
        />
      );
    }

    switch (activePage) {
      case "/dashboard/about":
        return <AboutPage />;
      case "/dashboard/documentation":
        return <DocumentationPage />;
      case "/dashboard/webshells":
        return <WebShellArchive onBack={() => navigate("/dashboard")} />;
      case "/dashboard":
      default:
        return <DashboardPage onToolSelect={handleToolSelect} />;
    }
  };

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={handleNavigate}
      selectedTool={selectedTool}
      onToolSelect={handleToolSelect}
    >
      {renderContent()}
    </AppLayout>
  );
}
