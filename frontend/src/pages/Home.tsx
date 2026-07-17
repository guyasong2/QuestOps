import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface border-[3px] border-text rounded-xl p-8 shadow-[8px_8px_0_#111214] border-[3px] border-text text-center"
      >
        <div className="text-6xl mb-6">🧪</div>
        <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Escape the Lab</h1>
        <p className="text-text-muted mb-8">
          An AI-powered immersive learning platform. Debug production outages, stop cyberattacks, and recover cloud infrastructure.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-text border-[3px] border-text shadow-[4px_4px_0_#111214] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#111214] font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Get Started
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-surface hover:bg-border text-text font-semibold py-3 px-4 rounded-lg border-[3px] border-text transition-colors"
          >
            Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
