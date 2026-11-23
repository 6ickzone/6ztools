import { motion } from "framer-motion";
import { Instagram, Mail, MessageCircle, Send, Wrench, Music4, UserRound } from "lucide-react";

interface ContactChannel {
  label: string;
  items: { text: string; href: string }[];
  icon: React.ReactNode;
  cardClass: string;
}

const CONTACTS: ContactChannel[] = [
  {
    label: "WhatsApp",
    items: [{ text: "+62 838-6696-6862", href: "https://wa.me/6283866966862" }],
    icon: <MessageCircle className="size-5 text-emerald" />,
    cardClass: "border-emerald/20 bg-emerald/5",
  },
  {
    label: "Telegram",
    items: [{ text: "@yungx6ick", href: "https://t.me/yungx6ick" }],
    icon: <Send className="size-5 text-cyan" />,
    cardClass: "border-cyan/20 bg-cyan/5",
  },
  {
    label: "Instagram",
    items: [{ text: "@6ickzone", href: "https://instagram.com/6ickzone" }],
    icon: <Instagram className="size-5 text-purple" />,
    cardClass: "border-purple/20 bg-purple/5",
  },
  {
    label: "Email Support",
    items: [
      { text: "admin@6ickzone.site", href: "mailto:admin@6ickzone.site" },
      { text: "6ickwhispers@gmail.com", href: "mailto:6ickwhispers@gmail.com" },
    ],
    icon: <Mail className="size-5 text-amber" />,
    cardClass: "border-amber/20 bg-amber/5",
  },
];

const FOCUS = [
  {
    icon: <Wrench className="size-4 text-cyan" />,
    title: "Tool Development",
    text: "Building and maintaining the 6ickzone toolkit — scanners, generators, and recon utilities used by security researchers every day.",
  },
  {
    icon: <UserRound className="size-4 text-purple" />,
    title: "Web Exploitation",
    text: "Hands-on research into injection flaws, access control issues, and the misconfigurations that let attackers reach what matters.",
  },
  {
    icon: <Music4 className="size-4 text-amber" />,
    title: "Experimental Music",
    text: "Outside of security, an ongoing practice in experimental electronic music and sound design.",
  },
];

export function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card rounded-2xl p-6 sm:p-8 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="size-20 rounded-2xl bg-cyan/10 border border-cyan/20 shrink-0 overflow-hidden">
              <img
                src="https://tools.6ickzone.site/ezgif-icon.gif"
                alt="6ickzone logo"
                className="size-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">6ickzone</h1>
              <p className="text-cyan font-medium text-sm sm:text-base mb-3">
                Security Researcher &amp; Experimental Musician
              </p>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Cybersecurity enthusiast focused on Web Exploitation and Tool Development.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan/5 px-3 py-1 text-[11px] font-medium text-cyan">
                  Web Exploitation
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-purple/30 bg-purple/5 px-3 py-1 text-[11px] font-medium text-purple">
                  Tool Development
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/5 px-3 py-1 text-[11px] font-medium text-amber">
                  Ethical Hacking
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Focus areas */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        >
          {FOCUS.map((item) => (
            <div key={item.title} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                {item.icon}
                <h3 className="text-sm font-semibold tracking-tight">{item.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </motion.div>

        {/* Get in Touch */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card rounded-2xl p-6 sm:p-8"
        >
          <h2 className="text-lg font-bold tracking-tight mb-1">Get in Touch</h2>
          <p className="text-sm text-muted-foreground mb-5">
            For business inquiries, research collaboration, or technical support.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CONTACTS.map((channel) => (
              <div
                key={channel.label}
                className={`rounded-xl border p-4 ${channel.cardClass}`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  {channel.icon}
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {channel.label}
                  </span>
                </div>
                <div className="space-y-1">
                  {channel.items.map((item) => (
                    <a
                      key={item.text}
                      href={item.href}
                      target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className="block text-sm font-medium text-foreground hover:text-cyan transition-colors break-all"
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-6 pt-4 border-t border-border/50">
            Response times vary — email is best for detailed requests, messaging apps for
            quick questions. Authorized research and legitimate collaboration only.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
