import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  FileCode,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Clock,
  Zap,
  Type,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface PageBuilderProps {
  onBack: () => void;
}

/* ------------------------------------------------------------------ */
/* Config & helpers                                                    */
/* ------------------------------------------------------------------ */

interface Cfg {
  site: string;
  defacer: string;
  team: string;
  message: string;
  marquee: string;
  accent: string;
  clock: boolean;
  matrix: boolean;
  generated: string;
}

/** Escape user input so generated pages never break (or inject) on odd characters. */
const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const marqueeBlock = (c: Cfg): string =>
  c.marquee.trim()
    ? `<div class="mq"><span>${esc(c.marquee)} &nbsp;•&nbsp; ${esc(
        c.marquee
      )} &nbsp;•&nbsp; ${esc(c.marquee)} &nbsp;•&nbsp; ${esc(c.marquee)}</span></div>`
    : "";

const clockBlock = (c: Cfg): string =>
  c.clock ? `<div class="clock" id="clock"></div>` : "";

const CLOCK_JS = `setInterval(function(){var e=document.getElementById("clock");if(e){e.textContent=new Date().toLocaleString();}},1000);`;

const matrixBlock = (): string =>
  `<canvas id="mx" style="position:fixed;inset:0;z-index:0;pointer-events:none;"></canvas>`;

const MATRIX_JS = (c: Cfg): string =>
  `(function(){
  var cv=document.getElementById("mx");if(!cv)return;var x=cv.getContext("2d");
  cv.width=window.innerWidth;cv.height=window.innerHeight;
  var ch="0123456789ABCDEF<>/\\\\{}[]#$@&*+=;:._-";
  var cols=Math.floor(cv.width/14),d=[];
  for(var i=0;i<cols;i++)d[i]=Math.random()*-40;
  function tick(){
    x.fillStyle="rgba(0,0,0,0.08)";x.fillRect(0,0,cv.width,cv.height);
    x.fillStyle=${JSON.stringify(c.accent)};x.font="14px monospace";
    for(var i=0;i<d.length;i++){
      var t=ch.charAt(Math.floor(Math.random()*ch.length));
      x.fillText(t,i*14,d[i]*14);
      if(d[i]*14>cv.height&&Math.random()>0.975)d[i]=0;
      d[i]++;
    }
  }
  setInterval(tick,55);
  window.addEventListener("resize",function(){cv.width=window.innerWidth;cv.height=window.innerHeight;});
})();`;

const msgBlock = (c: Cfg): string =>
  `<div class="msg">${esc(c.message)}</div>`;

const metaLine = (c: Cfg): string =>
  `<div class="meta">Target: ${esc(c.site)} &nbsp;•&nbsp; By: ${esc(
    c.defacer
  )} [${esc(c.team)}] &nbsp;•&nbsp; ${esc(c.generated)}</div>`;

function doc(title: string, style: string, body: string, script = ""): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(title)}</title>`,
    "<style>",
    style,
    "</style>",
    "</head>",
    "<body>",
    body,
    script ? "<script>\n" + script + "\n</script>" : "",
    "</body>",
    "</html>",
  ].join("\n");
}

const SHARED_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;position:relative;overflow-x:hidden}
.msg{white-space:pre-wrap;line-height:1.7}
.meta{opacity:.65;font-size:12px;text-align:center;margin-top:22px}
.clock{position:fixed;top:14px;right:16px;font-size:12px;opacity:.7;z-index:5}
.mq{position:fixed;bottom:0;left:0;right:0;overflow:hidden;white-space:nowrap;padding:9px 0;background:rgba(0,0,0,.78);border-top:1px solid var(--a);z-index:5}
.mq span{display:inline-block;padding-left:100%;animation:mq 20s linear infinite;font-size:12px;letter-spacing:.14em;color:var(--a)}
@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-100%)}}
`;

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

type TemplateId = "terminal" | "matrix" | "cyber" | "redskull" | "notice" | "vapor";

interface TemplateDef {
  id: TemplateId;
  name: string;
  desc: string;
  color: string;
}

const TEMPLATES: TemplateDef[] = [
  { id: "terminal", name: "Terminal", desc: "Shell boot sequence + typewriter", color: "#22c55e" },
  { id: "matrix", name: "Matrix Rain", desc: "Canvas rain with glowing core", color: "#22c55e" },
  { id: "cyber", name: "Cyber Grid", desc: "Neon grid & glitch title", color: "#06b6d4" },
  { id: "redskull", name: "Red Skull", desc: "ASCII art, aggressive red", color: "#ef4444" },
  { id: "notice", name: "Formal Notice", desc: "Clean professional disclosure", color: "#8b5cf6" },
  { id: "vapor", name: "Vaporwave", desc: "Sunset gradient horizon", color: "#f59e0b" },
];

const buildTerminal = (c: Cfg): string => {
  const style = SHARED_CSS + `
body{background:#020602;color:${c.accent};display:flex;align-items:center;justify-content:center;padding:28px}
.term{width:100%;max-width:760px;background:#04120a;border:1px solid ${c.accent}55;border-radius:10px;overflow:hidden;box-shadow:0 0 44px ${c.accent}33;z-index:2;position:relative}
.bar{display:flex;align-items:center;gap:7px;padding:9px 13px;background:#071a0f;border-bottom:1px solid ${c.accent}33}
.dot{width:11px;height:11px;border-radius:50%}
.bar span.t{margin-left:8px;font-size:11px;opacity:.6}
.body{padding:22px;font-size:14px;line-height:1.85}
.ln{opacity:.85}
.ln b{color:#e8fff0}
.hi{color:#fff;font-weight:700;text-shadow:0 0 14px ${c.accent}}
#type{border-right:2px solid ${c.accent};padding-right:3px}
.big{font-size:clamp(22px,5vw,40px);font-weight:800;letter-spacing:.06em;margin:16px 0 6px;text-align:center;color:${c.accent};text-shadow:0 0 22px ${c.accent}88}
.hrc{border:none;border-top:1px dashed ${c.accent}55;margin:16px 0}
.msg{font-size:13px;color:#c6e7d2}
`;
  const body = `<div class="term">
  <div class="bar"><span class="dot" style="background:#ff5f56"></span><span class="dot" style="background:#ffbd2e"></span><span class="dot" style="background:#27c93f"></span><span class="t">root@6ickzone — bash — 80x24</span></div>
  <div class="body">
    <div class="ln"><b>root@6ickzone</b>:~# ./audit --target ${esc(c.site)}</div>
    <div class="ln">[+] Resolving target .......... OK</div>
    <div class="ln">[+] Probing attack surface .... <b>3 issues found</b></div>
    <div class="ln">[!] Access control ............ <span class="hi">BYPASSED</span></div>
    <hr class="hrc">
    <div class="big" id="type" data-t="SITE HAS BEEN TESTED"></div>
    <div class="ln" style="text-align:center">operator: <b>${esc(c.defacer)}</b> &nbsp;|&nbsp; team: <b>${esc(
      c.team
    )}</b></div>
    <hr class="hrc">
    ${msgBlock(c)}
    <div class="ln" style="margin-top:14px"><b>root@6ickzone</b>:~# <span id="cur">_</span></div>
  </div>
</div>
${clockBlock(c)}
${marqueeBlock(c)}`;
  const script = `setInterval(function(){var e=document.getElementById("cur");if(e)e.textContent=e.textContent?"":"_";},550);
(function(){var el=document.getElementById("type");if(!el)return;var txt=el.getAttribute("data-t")||"";var i=0;el.textContent="";
(function tick(){if(i<=txt.length){el.textContent=txt.slice(0,i);i++;setTimeout(tick,55);}else{setTimeout(function(){i=0;},2600);}})();
})();
${CLOCK_JS}${c.matrix ? MATRIX_JS(c) : ""}`;
  return doc(`${c.site} — PWNED`, style, matrixBlock() + body, script);
};

const buildMatrix = (c: Cfg): string => {
  const style = SHARED_CSS + `
body{background:#000;color:#d9ffe6;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px}
.wrap{position:relative;z-index:2;max-width:720px}
.logo{font-size:clamp(38px,9vw,84px);font-weight:900;letter-spacing:.1em;color:#fff;text-shadow:0 0 26px ${c.accent},0 0 68px ${c.accent}66}
.site{margin-top:6px;font-size:clamp(13px,3vw,18px);color:${c.accent};letter-spacing:.28em;text-transform:uppercase}
.rule{width:220px;height:2px;background:linear-gradient(90deg,transparent,${c.accent},transparent);margin:22px auto}
.msg{font-size:14px;color:#bfe8cf}
.badges{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px}
.bdg{border:1px solid ${c.accent}66;color:${c.accent};padding:5px 13px;border-radius:999px;font-size:11px;letter-spacing:.12em}
`;
  const body = `<div class="wrap">
  <div class="logo">6ICKZONE</div>
  <div class="site">${esc(c.site)}</div>
  <div class="rule"></div>
  ${msgBlock(c)}
  <div class="badges"><span class="bdg">DEFACED BY ${esc(c.defacer)}</span><span class="bdg">${esc(
    c.team
  )}</span></div>
  ${metaLine(c)}
</div>
${clockBlock(c)}
${marqueeBlock(c)}`;
  const script = `${CLOCK_JS}${c.matrix ? MATRIX_JS(c) : ""}`;
  return doc(`${c.site} — 6ickzone`, style, matrixBlock() + body, script);
};

const buildCyber = (c: Cfg): string => {
  const style = SHARED_CSS + `
body{background:#04070f;color:#cfe9ff;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px;overflow:hidden}
.grid{position:fixed;inset:0;background-image:linear-gradient(${c.accent}22 1px,transparent 1px),linear-gradient(90deg,${c.accent}22 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(circle at 50% 40%,#000 30%,transparent 78%);z-index:0}
.scan{position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(0,0,0,.22) 3px 4px);pointer-events:none;z-index:4}
.wrap{position:relative;z-index:2;max-width:760px}
.tag{display:inline-block;border:1px solid ${c.accent}66;color:${c.accent};font-size:11px;letter-spacing:.3em;padding:5px 14px;border-radius:4px;margin-bottom:22px}
.glitch{font-size:clamp(34px,8vw,76px);font-weight:900;letter-spacing:.04em;color:#fff;position:relative;text-transform:uppercase}
.glitch::before,.glitch::after{content:attr(data-text);position:absolute;inset:0}
.glitch::before{color:${c.accent};animation:gl1 2.4s infinite steps(2)}
.glitch::after{color:#ff3d81;animation:gl2 3.1s infinite steps(2)}
@keyframes gl1{0%,92%{transform:none;opacity:0}93%{transform:translate(-4px,2px);opacity:.85}96%{transform:translate(3px,-2px);opacity:.7}100%{opacity:0}}
@keyframes gl2{0%,88%{transform:none;opacity:0}89%{transform:translate(4px,-2px);opacity:.75}94%{transform:translate(-3px,2px);opacity:.6}100%{opacity:0}}
.site{margin-top:12px;font-family:Arial,sans-serif;font-size:15px;letter-spacing:.2em;color:${c.accent};text-transform:uppercase}
.card{margin:26px auto 0;background:rgba(10,18,32,.82);border:1px solid ${c.accent}44;border-radius:12px;padding:20px;text-align:left;box-shadow:0 0 44px ${c.accent}22}
.msg{font-size:13.5px;color:#b9d6f2}
.rowline{display:flex;justify-content:space-between;gap:12px;font-size:12px;opacity:.8;margin-top:14px;border-top:1px dashed ${c.accent}44;padding-top:12px;flex-wrap:wrap}
`;
  const body = `<div class="grid"></div><div class="scan"></div>
<div class="wrap">
  <span class="tag">UNAUTHORIZED ACCESS LOGGED</span>
  <h1 class="glitch" data-text="SYSTEM BREACHED">SYSTEM BREACHED</h1>
  <div class="site">${esc(c.site)}</div>
  <div class="card">
    ${msgBlock(c)}
    <div class="rowline"><span>operator: <b>${esc(c.defacer)}</b></span><span>team: <b>${esc(
      c.team
    )}</b></span><span>${esc(c.generated)}</span></div>
  </div>
</div>
${clockBlock(c)}
${marqueeBlock(c)}`;
  const script = `${CLOCK_JS}${c.matrix ? MATRIX_JS(c) : ""}`;
  return doc(`${c.site} — BREACHED`, style, matrixBlock() + body, script);
};

const buildRedSkull = (c: Cfg): string => {
  const style = SHARED_CSS + `
body{background:#0a0000;color:#ffd9d9;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px}
.wrap{position:relative;z-index:2;max-width:740px}
pre.art{color:#ff4d4d;font-size:clamp(7px,2vw,12px);line-height:1.18;text-shadow:0 0 12px #ff000066;display:inline-block;text-align:left}
.pwn{font-family:Arial Black,Arial,sans-serif;font-size:clamp(46px,13vw,120px);font-weight:900;letter-spacing:.06em;color:#ff2b2b;text-shadow:0 0 30px #ff0000aa,0 0 80px #ff000055;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.72}}
.site{font-size:15px;letter-spacing:.24em;color:#ffb3b3;text-transform:uppercase;margin-top:4px}
.who{display:inline-flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:16px}
.chip{border:1px solid #ff4d4d88;color:#ff8a8a;padding:5px 14px;border-radius:4px;font-size:11px;letter-spacing:.14em}
.msg{margin-top:20px;font-size:13.5px;color:#f3c9c9;background:rgba(60,0,0,.5);border:1px solid #ff4d4d44;border-radius:10px;padding:16px}
`;
  const body = `<div class="wrap">
  <pre class="art">
      .-"""""-.
    .'  _   _  '.
   /   (o) (o)   \\
  |       .-.     |
  |      ( o )    |
   \\    .----.   /
    '.  '----'  .'
      '-......-'
</pre>
  <div class="pwn">PWNED</div>
  <div class="site">${esc(c.site)}</div>
  <div class="who"><span class="chip">BY ${esc(c.defacer)}</span><span class="chip">TEAM ${esc(
    c.team
  )}</span></div>
  ${msgBlock(c)}
  ${metaLine(c)}
</div>
${clockBlock(c)}
${marqueeBlock(c)}`;
  const script = `${CLOCK_JS}${c.matrix ? MATRIX_JS(c) : ""}`;
  return doc(`${c.site} — PWNED`, style, matrixBlock() + body, script);
};

const buildNotice = (c: Cfg): string => {
  const style = `
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:#0b1220;display:flex;align-items:center;justify-content:center;padding:28px;font-family:Georgia,'Times New Roman',serif;color:#dbe4f3;position:relative}
.clock{position:fixed;top:14px;right:16px;font-size:12px;opacity:.6;font-family:monospace;z-index:5}
.sheet{position:relative;z-index:2;width:100%;max-width:680px;background:#111a2c;border:1px solid ${c.accent}55;border-radius:14px;padding:clamp(26px,5vw,46px);box-shadow:0 24px 70px rgba(0,0,0,.55)}
.seal{width:74px;height:74px;border:2px solid ${c.accent};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;color:${c.accent};font-family:monospace;font-size:26px;font-weight:700}
h1{text-align:center;font-size:clamp(20px,4vw,28px);letter-spacing:.06em;text-transform:uppercase;color:#fff}
.sub{text-align:center;color:${c.accent};font-size:13px;letter-spacing:.26em;text-transform:uppercase;margin-top:8px;font-family:monospace}
.rule{border:none;border-top:1px solid ${c.accent}55;margin:24px 0}
.msg{font-size:15.5px;line-height:1.85;color:#cdd8ec;text-align:center}
table{width:100%;border-collapse:collapse;margin-top:24px;font-family:monospace;font-size:13px}
td{padding:10px 6px;border-bottom:1px dashed ${c.accent}44;vertical-align:top}
td.k{color:${c.accent};width:38%;letter-spacing:.08em;text-transform:uppercase;font-size:11.5px}
td.v{color:#eaf1ff;word-break:break-all}
.sign{margin-top:26px;text-align:center;font-family:monospace;font-size:12px;opacity:.75}
.mq{position:fixed;bottom:0;left:0;right:0;overflow:hidden;white-space:nowrap;padding:9px 0;background:rgba(0,0,0,.6);border-top:1px solid ${c.accent}55;z-index:5}
.mq span{display:inline-block;padding-left:100%;animation:mq 20s linear infinite;font-family:monospace;font-size:12px;letter-spacing:.14em;color:${c.accent}}
@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-100%)}}
`;
  const body = `<div class="sheet">
  <div class="seal">i7</div>
  <h1>Notice of Security Testing</h1>
  <div class="sub">Authorized Research · Disclosure Record</div>
  <hr class="rule">
  ${msgBlock(c)}
  <table>
    <tr><td class="k">Target</td><td class="v">${esc(c.site)}</td></tr>
    <tr><td class="k">Tested by</td><td class="v">${esc(c.defacer)}</td></tr>
    <tr><td class="k">Team</td><td class="v">${esc(c.team)}</td></tr>
    <tr><td class="k">Date</td><td class="v">${esc(c.generated)}</td></tr>
  </table>
  <div class="sign">Fix requires retest — contact the operator above before publishing.</div>
</div>
${clockBlock(c)}
${marqueeBlock(c)}`;
  const script = `${CLOCK_JS}${c.matrix ? MATRIX_JS(c) : ""}`;
  return doc(`Security Notice — ${c.site}`, style, matrixBlock() + body, script);
};

const buildVapor = (c: Cfg): string => {
  const style = SHARED_CSS + `
body{background:linear-gradient(180deg,#1a0533 0%,#3b0a5c 42%,#7a1f6e 68%,#ff6b6b 100%);color:#ffe9fb;display:flex;align-items:center;justify-content:center;text-align:center;padding:30px;overflow:hidden}
.sun{position:fixed;top:8%;left:50%;transform:translateX(-50%);width:min(46vw,320px);height:min(46vw,320px);border-radius:50%;background:linear-gradient(180deg,#ffd166 0%,#ff5e8a 60%,#ff3d9a 100%);box-shadow:0 0 90px #ff5e8a88;z-index:0;opacity:.9}
.sun::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(180deg,transparent 0 14px,rgba(26,5,51,.85) 14px 20px);border-radius:50%}
.floor{position:fixed;left:-20%;right:-20%;bottom:-6%;height:46%;background-image:linear-gradient(${c.accent}66 2px,transparent 2px),linear-gradient(90deg,${c.accent}66 2px,transparent 2px);background-size:56px 56px;transform:perspective(340px) rotateX(64deg);z-index:1;animation:scroll 3.4s linear infinite}
@keyframes scroll{from{background-position:0 0}to{background-position:0 56px}}
.wrap{position:relative;z-index:3;max-width:740px}
.title{font-family:Arial Black,Arial,sans-serif;font-size:clamp(40px,10vw,92px);font-weight:900;letter-spacing:.05em;color:#fff;text-shadow:4px 4px 0 #ff3d9a,-3px -3px 0 #4dd2ff;transform:skewY(-3deg)}
.site{font-family:monospace;font-size:14px;letter-spacing:.3em;text-transform:uppercase;color:#ffe9fb;margin-top:10px}
.card{margin:24px auto 0;background:rgba(20,4,36,.72);border:2px solid ${c.accent};border-radius:14px;padding:20px;box-shadow:0 0 40px ${c.accent}44;backdrop-filter:blur(3px)}
.msg{font-size:13.5px;color:#ffd9f2}
.chips{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}
.chip{border:1px solid #fff6;color:#fff;padding:5px 13px;border-radius:999px;font-size:11px;letter-spacing:.12em}
`;
  const body = `<div class="sun"></div><div class="floor"></div>
<div class="wrap">
  <div class="title">DEFACED</div>
  <div class="site">${esc(c.site)}</div>
  <div class="card">
    ${msgBlock(c)}
    <div class="chips"><span class="chip">${esc(c.defacer)}</span><span class="chip">${esc(
      c.team
    )}</span></div>
    <div class="meta">${esc(c.generated)}</div>
  </div>
</div>
${clockBlock(c)}
${marqueeBlock(c)}`;
  const script = `${CLOCK_JS}${c.matrix ? MATRIX_JS(c) : ""}`;
  return doc(`${c.site} — DEFACED`, style, matrixBlock() + body, script);
};

export const BUILDERS: Record<TemplateId, (c: Cfg) => string> = {
  terminal: buildTerminal,
  matrix: buildMatrix,
  cyber: buildCyber,
  redskull: buildRedSkull,
  notice: buildNotice,
  vapor: buildVapor,
};

const ACCENTS = [
  { name: "Green", value: "#22c55e" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Amber", value: "#f59e0b" },
  { name: "White", value: "#e2e8f0" },
];

const DEVICES = [
  { id: "desktop", label: "Desktop", width: "100%", icon: Monitor },
  { id: "tablet", label: "Tablet", width: "768px", icon: Tablet },
  { id: "mobile", label: "Mobile", width: "375px", icon: Smartphone },
] as const;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function PageBuilder({ onBack }: PageBuilderProps) {
  const [template, setTemplate] = useState<TemplateId>("terminal");
  const [site, setSite] = useState("target.example.com");
  const [defacer, setDefacer] = useState("0x6ick");
  const [team, setTeam] = useState("6ickzone");
  const [message, setMessage] = useState(
    "This page was modified during an authorized security test.\nAlways obtain written permission before testing any system."
  );
  const [marquee, setMarquee] = useState(
    "EDUCATIONAL & RESEARCH PURPOSES ONLY — 6ickzone"
  );
  const [accent, setAccent] = useState("#22c55e");
  const [clock, setClock] = useState(true);
  const [matrix, setMatrix] = useState(false);
  const [device, setDevice] = useState<(typeof DEVICES)[number]["id"]>("desktop");
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const cfg: Cfg = useMemo(
    () => ({
      site: site.trim() || "target.example.com",
      defacer: defacer.trim() || "anonymous",
      team: team.trim() || "6ickzone",
      message:
        message.trim() ||
        "This page was modified during an authorized security test.",
      marquee,
      accent,
      clock,
      matrix,
      generated: new Date().toLocaleString(),
    }),
    [site, defacer, team, message, marquee, accent, clock, matrix]
  );

  const html = useMemo(
    () => BUILDERS[template](cfg),
    [template, cfg]
  );

  const sizeKb = (html.length / 1024).toFixed(1);

  const copyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html);
    } catch {
      // Clipboard API blocked (e.g. HTTP) — fall back to execCommand
      const ta = document.createElement("textarea");
      ta.value = html;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [html]);

  const download = useCallback(() => {
    const slug =
      (site.trim() || "target").replace(/[^a-z0-9]+/gi, "-").toLowerCase() ||
      "target";
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-${template}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, [html, site, template]);

  const deviceWidth =
    DEVICES.find((d) => d.id === device)?.width ?? "100%";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-5 mb-6">
          <div className="flex size-14 items-center justify-center rounded-xl bg-red/10 border border-red/20 shrink-0">
            <FileCode className="size-7 text-red" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Page Builder
              </h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">
                Active
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Deface page generator — pick a template, customize, live-preview, and export
              a standalone HTML file. Runs entirely in your browser.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-[10px] border-cyan/30 text-cyan">
                6 Templates
              </Badge>
              <Badge variant="outline" className="text-[10px] border-purple/30 text-purple">
                Client-side
              </Badge>
              <Badge variant="outline" className="text-[10px] border-amber/30 text-amber">
                Export .html
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ---------------- Left: config ---------------- */}
          <div className="lg:col-span-2 space-y-5">
            {/* Templates */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="size-4 text-purple" />
                <h2 className="text-sm font-semibold tracking-tight">Templates</h2>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {TEMPLATES.map((t) => {
                  const active = template === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        active
                          ? "border-cyan/50 bg-cyan/10 shadow-[0_0_18px_rgba(6,182,212,0.15)]"
                          : "border-border/40 hover:border-border bg-background/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.color }}
                        />
                        <span
                          className={`text-xs font-semibold truncate ${
                            active ? "text-cyan" : "text-foreground"
                          }`}
                        >
                          {t.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        {t.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content fields */}
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Type className="size-4 text-cyan" />
                <h2 className="text-sm font-semibold tracking-tight">Content</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Target / Site
                  </label>
                  <Input
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    placeholder="target.example.com"
                    className="h-9 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Defacer Nick
                  </label>
                  <Input
                    value={defacer}
                    onChange={(e) => setDefacer(e.target.value)}
                    placeholder="0x6ick"
                    className="h-9 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Team / Group
                  </label>
                  <Input
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="6ickzone"
                    className="h-9 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Message (line breaks preserved)
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="font-mono text-sm resize-y"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Marquee text (empty = hidden)
                  </label>
                  <Input
                    value={marquee}
                    onChange={(e) => setMarquee(e.target.value)}
                    placeholder="EDUCATIONAL & RESEARCH PURPOSES ONLY"
                    className="h-9 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-amber" />
                <h2 className="text-sm font-semibold tracking-tight">Options</h2>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Accent color
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAccent(a.value)}
                      title={a.name}
                      className={`size-8 rounded-lg border-2 transition-all ${
                        accent === a.value
                          ? "scale-110 border-foreground/70"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: a.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>Live clock</span>
                </div>
                <Switch checked={clock} onCheckedChange={setClock} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-xs text-emerald">01</span>
                  <span>Matrix rain background</span>
                </div>
                <Switch checked={matrix} onCheckedChange={setMatrix} />
              </div>
            </div>
          </div>

          {/* ---------------- Right: preview ---------------- */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-xl overflow-hidden lg:sticky lg:top-4">
              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap border-b border-border/50 px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-auto">
                  Live Preview
                </span>
                <div className="flex rounded-lg border border-border/50 overflow-hidden">
                  {DEVICES.map((d) => {
                    const Icon = d.icon;
                    const active = device === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setDevice(d.id)}
                        title={d.label}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] transition-colors ${
                          active
                            ? "bg-cyan/15 text-cyan"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        <span className="hidden sm:inline">{d.label}</span>
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  title="Reload preview"
                  onClick={() => setRefreshKey((k) => k + 1)}
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>

              {/* Frame */}
              <div className="bg-black/60 p-3 flex justify-center">
                <div
                  className="transition-all duration-300 w-full"
                  style={{ maxWidth: deviceWidth }}
                >
                  <iframe
                    key={`${template}-${refreshKey}`}
                    title="Deface page preview"
                    srcDoc={html}
                    sandbox="allow-scripts"
                    className="w-full h-[540px] rounded-lg border border-border/40 bg-black"
                  />
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-t border-border/50">
                <span className="text-[11px] text-muted-foreground font-mono">
                  {sizeKb} KB · {html.split("\n").length} lines ·{" "}
                  {TEMPLATES.find((t) => t.id === template)?.name}
                </span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyHtml}
                    className="gap-1.5 h-8"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy HTML"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={download}
                    className="gap-1.5 h-8 bg-cyan hover:bg-cyan/90 text-black font-semibold"
                  >
                    <Download className="size-3.5" /> Download .html
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-3 px-1 leading-relaxed">
              Output is a single self-contained HTML file (inline CSS/JS, no external
              dependencies). The preview runs inside a sandboxed iframe. Use generated
              pages for authorized testing, reports, and educational demos only.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
