import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  initialSeconds: number;
  onExpire: () => void;
  isActive: boolean;
}

export default function Timer({ initialSeconds, onExpire, isActive }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalId);
          onExpire();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isActive, timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const isDanger = timeLeft < 60; // Less than 1 minute

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xl font-bold tracking-widest border transition-colors ${isDanger ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-black border-border text-text'}`}>
      <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <motion.span 
        key={timeLeft}
        initial={isDanger ? { scale: 1.1 } : false}
        animate={isDanger ? { scale: 1 } : false}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </motion.span>
    </div>
  );
}
