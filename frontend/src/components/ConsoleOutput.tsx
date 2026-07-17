import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'system';
}

export default function ConsoleOutput({ logs }: { logs: LogEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black border-t border-border h-48 flex flex-col font-mono text-xs">
      <div className="bg-bg px-4 py-1 text-text-muted uppercase tracking-widest text-[10px] border-b border-border flex justify-between">
        <span>Incident Log // Auto-recording</span>
        <span>STATUS: LIVE</span>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            let colorClass = 'text-text-muted';
            if (log.type === 'error') colorClass = 'text-red-400';
            if (log.type === 'success') colorClass = 'text-green-400';
            if (log.type === 'system') colorClass = 'text-blue-400';

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-3 ${colorClass}`}
              >
                <span className="opacity-50 shrink-0">[{log.timestamp}]</span>
                <span className="whitespace-pre-wrap">{log.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
