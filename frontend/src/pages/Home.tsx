import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface border border-border rounded-xl p-8 shadow-2xl text-center"
      >
        <div className="text-6xl mb-6">🧪</div>
        <h1 className="text-3xl font-bold text-text mb-2 tracking-tight">Escape the Lab</h1>
        <p className="text-text-muted mb-8">
          An AI-powered immersive learning platform. Debug production outages, stop cyberattacks, and recover cloud infrastructure.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Get Started
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-surface hover:bg-border text-text font-semibold py-3 px-4 rounded-lg border border-border transition-colors"
          >
            Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
