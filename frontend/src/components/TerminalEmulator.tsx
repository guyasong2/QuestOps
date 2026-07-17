import React, { useState, useRef, useEffect } from 'react';
import {
  HiOutlineTerminal,
} from 'react-icons/hi';

// Simulated Linux filesystem & command responses
const BOOT_MESSAGES = [
  'Linux kali 6.1.0-kali7-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.20-2kali1 x86_64',
  'Welcome to Kali Linux — the leading pentesting distribution.',
  'Type your commands below. When ready, run: submit',
  '',
];

const SIM_RESPONSES: Record<string, (args: string[]) => string> = {
  ls: (args) => {
    const path = args[0] || '.';
    return `auth.log  fail2ban.log  kern.log  syslog  /var/log -> ../${path}\nid_rsa  id_rsa.pub  authorized_keys  .ssh/ -> ~/.ssh/`;
  },
  cat: (args) => {
    if (!args.length) return 'cat: missing operand';
    if (args[0].includes('auth.log')) return `Jul 17 14:01:23 server sshd[4471]: Failed password for root from 192.168.1.105 port 52344 ssh2\nJul 17 14:01:25 server sshd[4471]: Failed password for root from 192.168.1.105 port 52344 ssh2\nJul 17 14:01:28 server sshd[4471]: Accepted password for root from 192.168.1.105 port 52344 ssh2`;
    if (args[0].includes('syslog')) return `Jul 17 13:55:01 server CRON[2345]: pam_unix(cron:session): session opened for user root\nJul 17 14:00:00 server kernel: Oops: general protection fault...`;
    return `cat: ${args[0]}: File not found or permission denied`;
  },
  grep: (args) => {
    if (args.length < 2) return 'Usage: grep PATTERN FILE';
    return `${args[1]}:14:01:23 server sshd: Failed password for root from 192.168.1.105\n${args[1]}:14:01:25 server sshd: Failed password for root from 192.168.1.105\n${args[1]}:14:01:28 server sshd: Accepted password for root from 192.168.1.105`;
  },
  netstat: () =>
    `Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN\ntcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN\ntcp        0      0 192.168.1.105:22        192.168.1.1:52344       ESTABLISHED`,
  ps: () =>
    `  PID TTY          TIME CMD\n 1234 pts/0    00:00:01 bash\n 4471 ?        00:00:00 sshd\n 4499 pts/1    00:00:00 python3 -c import socket...\n 4512 ?        00:00:03 nc -lvp 4444`,
  'ps aux': () =>
    `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot      4471  0.0  0.1  65536  3456 ?        Ss   14:01   0:00 sshd: root@pts/1\nroot      4499  0.3  0.5 124416 20480 pts/1    S    14:02   0:00 python3 -c "import socket"\nroot      4512  0.0  0.0   3856   564 ?        S    14:02   0:03 nc -lvp 4444`,
  ifconfig: () =>
    `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0`,
  'ip addr': () =>
    `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500\n    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0`,
  nmap: (args) =>
    `Starting Nmap 7.93 scan on ${args[0] || '192.168.1.105'}\nPORT   STATE SERVICE\n22/tcp open  ssh\n80/tcp open  http\n443/tcp closed https\n\nNmap done: 1 IP address scanned in 2.43 seconds`,
  fail2ban: () => `fail2ban-client status sshd\nStatus for the jail: sshd\n|- Filter\n|  |- Currently failed:\t3\n|  |- Total failed:\t47\n|  \`- File list:\t/var/log/auth.log\n\`- Actions\n   |- Currently banned:\t1\n   |- Total banned:\t2\n   \`- Banned IP list:\t192.168.1.105`,
  'fail2ban-client': (args) => {
    if (args.includes('ban')) return `1\n# Banned 192.168.1.105 successfully`;
    if (args.includes('status')) return `|- Currently failed: 3\n|- Total failed: 47\n\`- Banned IP list: 192.168.1.105`;
    return 'fail2ban-client: command not found (try: fail2ban-client status sshd)';
  },
  iptables: (args) =>
    args.includes('-A') || args.includes('-I')
      ? `iptables: Rule applied successfully`
      : `Chain INPUT (policy ACCEPT)\ntarget     prot opt source               destination\nDROP       tcp  --  192.168.1.105        0.0.0.0/0`,
  ufw: (args) =>
    args[0] === 'status' ? `Status: active\nTo                         Action      From\n--                         ------      ----\n22/tcp                     ALLOW       Anywhere` :
    args[0] === 'deny' ? `Rule added` :
    `ufw: ${args.join(' ')} executed`,
  chmod: (args) => `chmod: permissions on ${args[1] || '?'} changed to ${args[0]}`,
  sudo: (args) => {
    const inner = args.join(' ');
    const fn = SIM_RESPONSES[args[0]];
    return fn ? fn(args.slice(1)) : `sudo: ${inner}: command executed with root privileges`;
  },
  clear: () => '\x1b[2J\x1b[H',
  whoami: () => 'root',
  pwd: () => '/root',
  history: () => `1  cat /var/log/auth.log\n2  grep "Failed password" /var/log/auth.log\n3  netstat -tulnp\n4  fail2ban-client status sshd\n5  iptables -A INPUT -s 192.168.1.105 -j DROP`,
  echo: (args) => args.join(' '),
  date: () => new Date().toUTCString(),
  uname: () => 'Linux kali 6.1.0-kali7-amd64 #1 SMP x86_64 GNU/Linux',
  help: () =>
    `Available commands: ls, cat, grep, netstat, ps, ifconfig, ip, nmap, iptables, ufw,\n                  fail2ban-client, chmod, sudo, whoami, pwd, history, echo, date, uname\n\nType 'submit' to submit your session for AI evaluation.`,
};

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'boot' | 'error';
  content: string;
}

interface TerminalSandboxProps {
  onSubmit: (sessionLog: string) => void;
  disabled?: boolean;
}

export function TerminalSandbox({ onSubmit, disabled }: TerminalSandboxProps) {
  const [lines, setLines] = useState<TerminalLine[]>(
    BOOT_MESSAGES.map((m, i) => ({ id: `boot-${i}`, type: 'boot', content: m }))
  );
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [sessionCommands, setSessionCommands] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const addLine = (type: TerminalLine['type'], content: string) => {
    setLines((prev) => [...prev, { id: Math.random().toString(), type, content }]);
  };

  const execCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    addLine('input', trimmed);
    setCommandHistory((prev) => [trimmed, ...prev]);
    setHistoryIdx(-1);
    setSessionCommands((prev) => [...prev, trimmed]);

    if (trimmed === 'submit') {
      addLine('output', '▶ Submitting terminal session for AI evaluation...');
      const log = sessionCommands.concat(trimmed).join('\n');
      setTimeout(() => onSubmit(log), 500);
      return;
    }
    if (trimmed === 'clear') {
      setLines(BOOT_MESSAGES.map((m, i) => ({ id: `boot-${i}`, type: 'boot', content: m })));
      return;
    }

    const [cmd, ...args] = trimmed.split(/\s+/);
    // Handle compound commands like "ps aux"
    const compound = trimmed.split(/\s+/).slice(0, 2).join(' ');
    const fn = SIM_RESPONSES[compound] || SIM_RESPONSES[cmd];

    if (fn) {
      const resp = fn(cmd === compound.split(' ')[0] ? args : trimmed.split(/\s+/).slice(2));
      if (resp && resp.includes('\x1b')) {
        setLines(BOOT_MESSAGES.map((m, i) => ({ id: `boot-${i}`, type: 'boot', content: m })));
      } else {
        addLine('output', resp || '');
      }
    } else {
      addLine('error', `bash: ${cmd}: command not found. Type 'help' for available commands.`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      execCommand(inputValue);
      setInputValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, commandHistory.length - 1);
      setHistoryIdx(idx);
      setInputValue(commandHistory[idx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInputValue(idx === -1 ? '' : commandHistory[idx] || '');
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-[#0a0a0a] font-mono text-sm cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-gray-800 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <HiOutlineTerminal className="w-4 h-4 text-green-400" />
          <span className="text-gray-400 text-xs">root@kali-vm: ~</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-yellow-500 font-bold">Type 'submit' when done</span>
          {sessionCommands.length > 0 && (
            <span className="text-xs text-gray-500">{sessionCommands.length} cmd(s)</span>
          )}
        </div>
      </div>

      {/* Terminal output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
        {lines.map((line) => (
          <div key={line.id}>
            {line.type === 'input' && (
              <div className="flex gap-2">
                <span className="text-green-500 shrink-0">┌──(root㉿kali)-[~]</span>
              </div>
            )}
            {line.type === 'input' && (
              <div className="flex gap-2">
                <span className="text-green-500 shrink-0">└─#</span>
                <span className="text-white">{line.content}</span>
              </div>
            )}
            {line.type === 'output' && (
              <div className="text-gray-300 whitespace-pre-wrap pl-4">{line.content}</div>
            )}
            {line.type === 'error' && (
              <div className="text-red-400 whitespace-pre-wrap pl-4">{line.content}</div>
            )}
            {line.type === 'boot' && (
              <div className="text-gray-500 text-xs">{line.content}</div>
            )}
          </div>
        ))}

        {/* Live input line */}
        {!disabled && (
          <div>
            <div className="text-green-500 text-xs">┌──(root㉿kali)-[~]</div>
            <div className="flex gap-2 items-center">
              <span className="text-green-500 shrink-0">└─#</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-white caret-green-400 focus:ring-0 p-0"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                disabled={disabled}
              />
              <span className="w-2 h-4 bg-green-400 animate-pulse" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
