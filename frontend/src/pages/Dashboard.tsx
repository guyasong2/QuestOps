import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTracks, getSkills } from '../lib/api';
import type { Track, StudentSkill } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import SkillsetPanel from '../components/SkillsetPanel';
import { HiOutlineShieldCheck, HiOutlineCode, HiOutlineCloud } from 'react-icons/hi';

// ── Icons (inline to avoid extra deps) ────────────────────────────────────────
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const BookIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const StarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);
const ChatIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);
const SkillsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default function Dashboard() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [skills, setSkills] = useState<StudentSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSkillsDrawer, setShowSkillsDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrack, setFilterTrack] = useState('all');
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData(showLoading = true) {
      if (showLoading) setLoading(true);
      try {
        const [tracksData, skillsData] = await Promise.all([getTracks(), getSkills()]);
        setTracks(tracksData);
        setSkills(skillsData);
      } catch (err) {
        console.error('Failed to load catalog data', err);
      } finally {
        if (showLoading) setLoading(false);
      }
    }
    loadData(true);
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted font-mono text-sm px-4 text-center">
        Loading Quest Dashboard...
      </div>
    );
  }

  const totalXP = skills.reduce((acc, skill) => acc + skill.xp, 0);

  // Sidebar nav items shared between desktop sidebar & mobile bottom bar
  const navItems = [
    { label: 'Home',      icon: <HomeIcon />, action: () => navigate('/'),          active: false },
    { label: 'Quests',    icon: <BookIcon />, action: () => {},                     active: true  },
    { label: 'Favorites', icon: <StarIcon />, action: () => navigate('/favorites'), active: false },
    { label: 'Chat',      icon: <ChatIcon />, action: () => navigate('/chat'),      active: false },
    { label: 'Skills',    icon: <SkillsIcon />, action: () => setShowSkillsDrawer(true), active: false, mobileOnly: true },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col text-text font-body">

      {/* ── Top Nav ─────────────────────────────────────────────────────────── */}
      <header className="h-14 md:h-16 border-b-2 border-text bg-surface flex items-center px-3 md:px-6 justify-between sticky top-0 z-20 shadow-[2px_2px_0_#111214]">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img src="/QuestOps_logo.png" alt="QuestOps" className="h-7 md:h-8 object-contain" />
        </div>

        {/* XP + profile */}
        <div className="flex items-center gap-2 md:gap-6">
          {/* Stats — always show XP on mobile, coins only sm+ */}
          <div className="flex items-center gap-2 text-xs md:text-sm font-bold">
            <span className="hidden sm:flex items-center gap-1 text-yellow-500">🪙 230</span>
            <span className="flex items-center gap-1 bg-border/50 px-2 py-1 rounded text-text">
              🏆 {totalXP} XP
            </span>
          </div>

          {/* Profile button */}
          <div className="flex items-center gap-2 border-l border-border pl-3 md:pl-6 relative">
            <span className="text-sm font-medium hidden md:block">{user?.username}</span>
            <button
              id="profile-menu-btn"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden bg-blue-500 hover:ring-2 hover:ring-blue-400 border-2 border-text shadow-[2px_2px_0_#111214] flex items-center justify-center font-bold uppercase transition-all shrink-0"
              title="Profile Options"
            >
              {user?.avatar
                ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                : <span className="text-white text-xs">{user?.username?.[0] || 'U'}</span>
              }
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-3 w-44 bg-surface border-[3px] border-text shadow-[4px_4px_0_#111214] rounded-lg overflow-hidden flex flex-col z-50"
                >
                  <button onClick={() => { setShowProfileDropdown(false); navigate('/profile'); }}
                    className="px-4 py-3 text-left text-sm font-bold text-text hover:bg-border/30 border-b border-border transition-colors">
                    Edit Profile
                  </button>
                  <button onClick={() => { setShowProfileDropdown(false); handleLogout(); }}
                    className="px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop Left Sidebar */}
        <aside className="hidden md:flex w-16 border-r-2 border-text bg-surface flex-col items-center py-6 gap-5 z-10 shrink-0">
          {navItems.filter(n => !n.mobileOnly).map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              title={item.label}
              className={`p-2 rounded-lg transition-colors ${
                item.active
                  ? 'text-blue-600 bg-blue-50 border border-blue-200'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </aside>

        {/* Center Main Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 pb-24 md:pb-8">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 bg-surface p-3 md:p-4 border-[3px] border-text shadow-[4px_4px_0_#111214] rounded-xl">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search scenarios..."
                  className="w-full bg-bg border-2 border-text rounded-lg pl-9 pr-3 py-2 text-text focus:outline-none focus:border-blue-500 font-mono text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="bg-bg border-2 border-text rounded-lg px-3 py-2 text-text font-bold focus:outline-none focus:border-blue-500 text-sm w-full sm:w-auto"
                value={filterTrack}
                onChange={(e) => setFilterTrack(e.target.value)}
              >
                <option value="all">All Tracks</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="software">Software Engineering</option>
                <option value="cloud">Cloud Infrastructure</option>
              </select>
            </div>

            {/* Tracks + Scenario Cards */}
            {tracks.map((track) => {
              if (filterTrack !== 'all' && track.slug !== filterTrack) return null;
              const filteredScenarios = track.scenarios.filter(
                (s) =>
                  s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.narrative.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (filteredScenarios.length === 0) return null;

              return (
                <div key={track.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl text-text">
                      {track.slug === 'cybersecurity' && <HiOutlineShieldCheck />}
                      {track.slug === 'software'      && <HiOutlineCode />}
                      {track.slug === 'cloud'         && <HiOutlineCloud />}
                    </span>
                    <h2 className="text-lg md:text-xl font-display font-bold text-text">{track.name} Track</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {filteredScenarios.map((scenario, idx) => (
                      <motion.div
                        key={scenario.id}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ delay: idx * 0.1, type: 'spring', stiffness: 200, damping: 22 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/lesson/${scenario.id}`)}
                        className="bg-surface border-[3px] border-text rounded-xl overflow-hidden shadow-[2px_2px_0_#111214] hover:shadow-[4px_4px_0_#111214] transition-all cursor-pointer group flex flex-col"
                      >
                        {/* Card Cover */}
                        <div
                          className="h-24 sm:h-28 p-3 flex flex-col justify-between relative overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${track.accent_color}22, ${track.accent_color}77)` }}
                        >
                          <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
                            backgroundSize: '14px 14px',
                          }} />
                          <div className="flex justify-between items-start relative z-10">
                            <span className="text-xs font-bold px-2 py-0.5 bg-white/60 backdrop-blur rounded text-gray-900 border border-white/20">
                              {Math.floor(scenario.time_limit_seconds / 60)} MIN
                            </span>
                            <span className="text-gray-900 bg-white/60 p-1 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              ▶
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-display font-black text-gray-900 uppercase tracking-widest drop-shadow relative z-10 leading-tight line-clamp-2">
                            {scenario.title}
                          </h3>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex flex-col flex-1">
                          <p className="text-text-muted text-sm line-clamp-2 mb-3 flex-1">{scenario.narrative}</p>
                          <div className="flex gap-2 flex-wrap mt-auto">
                            <span className="text-xs font-mono px-2 py-0.5 border-2 border-text rounded text-text-muted bg-bg">
                              {track.name}
                            </span>
                            <span className="text-xs font-mono px-2 py-0.5 border-2 border-text rounded text-text-muted bg-bg">
                              Simulation
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Desktop Right Sidebar — Skills */}
        <aside className="hidden lg:block w-72 xl:w-80 border-l-2 border-text bg-surface p-5 overflow-y-auto shrink-0">
          <SkillsetPanel skills={skills} />
        </aside>
      </div>

      {/* ── Mobile Bottom Tab Bar ───────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t-2 border-text z-30 flex items-center justify-around px-2 py-2 shadow-[0_-2px_0_#111214]">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
              item.active
                ? 'text-blue-600'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Mobile Skills Drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSkillsDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSkillsDrawer(false)}
            />
            {/* Drawer */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-surface border-t-[3px] border-text rounded-t-2xl z-50 md:hidden max-h-[80vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-border rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 className="font-display font-bold text-lg">Your Skills</h2>
                <button
                  onClick={() => setShowSkillsDrawer(false)}
                  className="text-text-muted hover:text-text p-1"
                >
                  ✕
                </button>
              </div>
              <div className="p-5 pb-10">
                <SkillsetPanel skills={skills} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
