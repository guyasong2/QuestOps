import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { HiOutlineArrowLeft } from 'react-icons/hi';

// Mock data for favorites since there's no backend model yet
const MOCK_FAVORITES = [
  {
    id: 101,
    title: "SQL Injection in Legacy Portal",
    narrative: "A critical vulnerability was detected in the legacy authentication portal. Assess the damage and patch the code.",
    time_limit_seconds: 600,
    track_slug: "cybersecurity",
    track_name: "Cybersecurity",
    accent_color: "#ef4444"
  },
  {
    id: 201,
    title: "Memory Leak in Data Pipeline",
    narrative: "The primary data ingestion pipeline is OOM crashing every 4 hours. Find the leak and deploy a fix.",
    time_limit_seconds: 1200,
    track_slug: "software",
    track_name: "Software Engineering",
    accent_color: "#b7ed00"
  }
];

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col text-text font-body">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-border bg-surface flex items-center px-6 justify-between sticky top-0 z-20 shadow-[2px_2px_0_#111214] border-2 border-text">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-text-muted hover:text-text transition-colors flex items-center gap-1.5 text-sm"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 border-l border-border pl-6">
            <span className="text-sm font-medium hidden sm:block">{user?.username}</span>
            <div className="w-8 h-8 rounded bg-blue-500 text-text border-2 border-text shadow-[2px_2px_0_#111214] flex items-center justify-center font-bold uppercase cursor-default">
              {user?.username?.[0] || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Icon Navigation) */}
        <aside className="w-16 border-r border-border bg-surface flex flex-col items-center py-6 gap-6 z-10 shrink-0">
          <button onClick={() => navigate('/')} className="text-text-muted hover:text-text transition-colors p-2" title="Home">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-text-muted hover:text-text transition-colors p-2" title="Dashboard">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </button>
          <button className="text-blue-600 bg-blue-50 border border-blue-100 p-2 rounded-lg" title="Favorites">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </button>
          <button onClick={() => navigate('/community')} className="text-text-muted hover:text-text transition-colors p-2" title="Community">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </button>
        </aside>

        {/* Center Grid (Main Content) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl text-yellow-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              </span>
              <h2 className="text-3xl font-display font-bold text-text">Your Favorites</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MOCK_FAVORITES.map((scenario, idx) => (
                <motion.div 
                  key={scenario.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: idx * 0.15, type: 'spring', stiffness: 200, damping: 20 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-surface border-[3px] border-text rounded-xl overflow-hidden shadow-[2px_2px_0_#111214] border-2 border-text hover:shadow-[4px_4px_0_#111214] transition-all cursor-not-allowed group flex flex-col h-full opacity-80"
                  title="Mock Favorite — Endpoints Coming Soon"
                >
                  <div 
                    className="h-32 p-4 flex flex-col justify-between relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${scenario.accent_color}11, ${scenario.accent_color}66)` }}
                  >
                    <div className="absolute inset-0 opacity-20" style={{ 
                      backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
                      backgroundSize: '16px 16px' 
                    }} />
                    
                    <div className="flex justify-between items-start relative z-10">
                      <span className="text-xs font-bold px-2 py-1 bg-white/60 backdrop-blur rounded text-gray-900 border border-white/20">
                        {Math.floor(scenario.time_limit_seconds / 60)} MIN
                      </span>
                      <span className="text-gray-900 bg-white/60 p-1 rounded-full w-6 h-6 flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-display font-black text-gray-900 text-center uppercase tracking-widest drop-shadow-[2px_2px_0_#111214] border-2 border-text relative z-10 truncate px-4">
                      {scenario.title}
                    </h3>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <h4 className="font-bold text-text text-lg mb-1 truncate">{scenario.title}</h4>
                    <p className="text-text-muted text-sm line-clamp-2 mb-4 flex-1">{scenario.narrative}</p>
                    
                    <div className="flex gap-2 flex-wrap mt-auto">
                      <span className="text-xs font-mono px-2 py-1 border-[3px] border-text rounded text-text-muted bg-bg">
                        {scenario.track_name}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
