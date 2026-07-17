import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { HiOutlineArrowLeft } from 'react-icons/hi';

const MOCK_LEADERBOARD = [
  { rank: 1, username: "ShadowByte", xp: 14500, level: "Expert", track: "Cybersecurity" },
  { rank: 2, username: "KernelPanic", xp: 12300, level: "Specialist", track: "Software Eng" },
  { rank: 3, username: "CloudStrife", xp: 11950, level: "Specialist", track: "Cloud Infra" },
  { rank: 4, username: "NullPointer", xp: 9800, level: "Analyst", track: "Software Eng" },
  { rank: 5, username: "SysAdminBob", xp: 8200, level: "Analyst", track: "Cloud Infra" },
];

export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col text-text font-body">
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

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-16 border-r border-border bg-surface flex flex-col items-center py-6 gap-6 z-10 shrink-0">
          <button onClick={() => navigate('/')} className="text-text-muted hover:text-text transition-colors p-2" title="Home">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-text-muted hover:text-text transition-colors p-2" title="Dashboard">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </button>
          <button onClick={() => navigate('/favorites')} className="text-text-muted hover:text-text transition-colors p-2" title="Favorites">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </button>
          <button className="text-blue-600 bg-blue-50 border border-blue-100 p-2 rounded-lg" title="Community">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl text-blue-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </span>
              <h2 className="text-3xl font-display font-bold text-text">Global Leaderboard</h2>
            </div>
            
            <div className="bg-surface border-[3px] border-text rounded-xl shadow-[4px_4px_0_#111214] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-[3px] border-text">
                    <th className="p-4 font-bold text-text uppercase tracking-wider text-sm">Rank</th>
                    <th className="p-4 font-bold text-text uppercase tracking-wider text-sm">Operator</th>
                    <th className="p-4 font-bold text-text uppercase tracking-wider text-sm">Level</th>
                    <th className="p-4 font-bold text-text uppercase tracking-wider text-sm">Primary Track</th>
                    <th className="p-4 font-bold text-text uppercase tracking-wider text-sm text-right">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LEADERBOARD.map((p, i) => (
                    <motion.tr 
                      key={p.username}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="border-b border-text/20 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        {p.rank === 1 ? <span className="text-2xl">🥇</span> : 
                         p.rank === 2 ? <span className="text-2xl">🥈</span> : 
                         p.rank === 3 ? <span className="text-2xl">🥉</span> : 
                         <span className="font-bold text-gray-500 px-2">{p.rank}</span>}
                      </td>
                      <td className="p-4 font-bold text-text text-lg">{p.username}</td>
                      <td className="p-4">
                        <span className="bg-blue-500/10 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                          {p.level}
                        </span>
                      </td>
                      <td className="p-4 text-text-muted font-mono text-sm">{p.track}</td>
                      <td className="p-4 text-right font-bold text-blue-600 font-mono text-lg">{p.xp.toLocaleString()}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
