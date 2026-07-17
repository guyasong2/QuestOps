
import { motion } from 'framer-motion';

interface HotspotProps {
  label: string;
  onClick: () => void;
  status: 'pending' | 'active' | 'completed';
  x: number;
  y: number;
}

export default function Hotspot({ label, onClick, status, x, y }: HotspotProps) {
  let bgColor = 'bg-gray-600';
  let pulseColor = 'rgba(156, 163, 175, 0.5)';
  
  if (status === 'active') {
    bgColor = 'bg-blue-500';
    pulseColor = 'rgba(59, 130, 246, 0.6)';
  } else if (status === 'completed') {
    bgColor = 'bg-green-500';
    pulseColor = 'transparent';
  }

  return (
    <div 
      className="absolute flex items-center justify-center cursor-pointer group"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      onClick={status !== 'completed' ? onClick : undefined}
    >
      {/* Pulse effect */}
      {status === 'active' && (
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-8 h-8 rounded-full"
          style={{ backgroundColor: pulseColor }}
        />
      )}
      
      {/* Core dot */}
      <div className={`relative w-4 h-4 rounded-full shadow-[4px_4px_0_#111214] border-[3px] border-text ${bgColor} z-10 transition-colors`} />
      
      {/* Label popup */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black border-[3px] border-text text-text text-xs px-2 py-1 rounded font-mono z-20 pointer-events-none">
        {label}
      </div>
    </div>
  );
}
