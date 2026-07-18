import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTracks, getSkills } from '../lib/api';
import type { Track, StudentSkill } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import SkillsetPanel from '../components/SkillsetPanel';
import { HiOutlineShieldCheck, HiOutlineCode, HiOutlineCloud } from 'react-icons/hi';

export default function Dashboard() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [skills, setSkills] = useState<StudentSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrack, setFilterTrack] = useState('all');
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData(showLoading = true) {
      if (showLoading) setLoading(true);
      try {
        const [tracksData, skillsData] = await Promise.all([
          getTracks(),
          getSkills()
        ]);
        setTracks(tracksData);
        setSkills(skillsData);
      } catch (err) {
        console.error('Failed to load catalog data', err);
      } finally {
        if (showLoading) setLoading(false);
      }
    }

    // Initial load
    loadData(true);

    // Polling every 5 seconds for background scenario generation
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted font-mono">Loading Quest Dashboard...</div>;
  }

  // Calculate total XP across all skills for the header
  const totalXP = skills.reduce((acc, skill) => acc + skill.xp, 0);

  return (
    <div className="min-h-screen bg-bg flex flex-col text-text font-body">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-border bg-surface flex items-center px-6 justify-between sticky top-0 z-20 shadow-[2px_2px_0_#111214] border-2 border-text">
        <div className="flex items-center gap-3">
          <img src="/QuestOps_logo.png" alt="QuestOps" className="h-8 object-contain" />
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4 text-sm font-bold">
            <span className="flex items-center gap-1 text-yellow-500">
              🪙 230
            </span>
            <span className="flex items-center gap-1 bg-border/50 px-2 py-1 rounded text-text">
              🏆 {totalXP}
            </span>
          </div>

          <div className="flex items-center gap-3 border-l border-border pl-6 relative">
            <span className="text-sm font-medium hidden sm:block">{user?.username}</span>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-9 h-9 rounded-full overflow-hidden bg-blue-500 hover:ring-2 hover:ring-blue-400 text-text border-2 border-text shadow-[2px_2px_0_#111214] flex items-center justify-center font-bold uppercase transition-all"
              title="Profile Options"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.username?.[0] || 'U'}</span>
              )}
            </button>
            
            {showProfileDropdown && (
              <div className="absolute top-full right-0 mt-3 w-48 bg-surface border-[3px] border-text shadow-[4px_4px_0_#111214] rounded-lg overflow-hidden flex flex-col z-50">
                <button 
                  onClick={() => { setShowProfileDropdown(false); navigate('/profile'); }}
                  className="px-4 py-3 text-left text-sm font-bold text-text hover:bg-gray-100 border-b border-border transition-colors"
                >
                  Edit Profile
                </button>
                <button 
                  onClick={() => { setShowProfileDropdown(false); alert('Change Password coming soon!'); }}
                  className="px-4 py-3 text-left text-sm font-bold text-text hover:bg-gray-100 border-b border-border transition-colors"
                >
                  Change Password
                </button>
                <button 
                  onClick={() => { setShowProfileDropdown(false); handleLogout(); }}
                  className="px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
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
          <button className="text-blue-600 bg-blue-50 border border-blue-100 p-2 rounded-lg" title="Dashboard">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </button>
          <button onClick={() => navigate('/favorites')} className="text-text-muted hover:text-text transition-colors p-2" title="Favorites">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </button>
          <button onClick={() => navigate('/community')} className="text-text-muted hover:text-text transition-colors p-2" title="Community">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </button>
          <button onClick={() => navigate('/chat')} className="text-text-muted hover:text-blue-500 transition-colors p-2" title="AI Chat">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </button>
        </aside>

        {/* Center Grid (Main Content) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-10">
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-surface p-4 border-[3px] border-text shadow-[4px_4px_0_#111214] rounded-xl">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search scenarios by title or description..." 
                  className="w-full bg-bg border-2 border-text rounded-lg pl-10 p-2.5 text-text focus:outline-none focus:border-blue-500 font-mono text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="bg-bg border-2 border-text rounded-lg p-2.5 text-text font-bold focus:outline-none focus:border-blue-500 min-w-[200px]"
                value={filterTrack}
                onChange={(e) => setFilterTrack(e.target.value)}
              >
                <option value="all">All Tracks</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="software">Software Engineering</option>
                <option value="cloud">Cloud Infrastructure</option>
              </select>
            </div>

            {tracks.map((track) => {
              if (filterTrack !== 'all' && track.slug !== filterTrack) return null;

              const filteredScenarios = track.scenarios.filter(scenario => 
                scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                scenario.narrative.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredScenarios.length === 0) return null;

              return (
                <div key={track.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl text-text">
                      {track.slug === 'cybersecurity' && <HiOutlineShieldCheck />}
                      {track.slug === 'software' && <HiOutlineCode />}
                      {track.slug === 'cloud' && <HiOutlineCloud />}
                    </span>
                    <h2 className="text-xl font-display font-bold text-text">{track.name} Track</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredScenarios.map((scenario, idx) => (
                      <motion.div
                        key={scenario.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: idx * 0.15, type: 'spring', stiffness: 200, damping: 20 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => navigate(`/lesson/${scenario.id}`)}
                        className="bg-surface border-[3px] border-text rounded-xl overflow-hidden shadow-[2px_2px_0_#111214] border-2 border-text hover:shadow-[4px_4px_0_#111214] transition-all cursor-pointer group flex flex-col h-full"
                      >
                        {/* Card Cover (Gradient placeholder mimicking the rich images) */}
                        <div
                          className="h-32 p-4 flex flex-col justify-between relative overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${track.accent_color}11, ${track.accent_color}66)` }}
                        >
                          <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
                            backgroundSize: '16px 16px'
                          }} />

                          <div className="flex justify-between items-start relative z-10">
                            <span className="text-xs font-bold px-2 py-1 bg-white/60 backdrop-blur rounded text-gray-900 border border-white/20">
                              {Math.floor(scenario.time_limit_seconds / 60)} MIN
                            </span>
                            <span className="text-gray-900 bg-white/60 p-1 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              ▶
                            </span>
                          </div>

                          <h3 className="text-2xl font-display font-black text-gray-900 text-center uppercase tracking-widest drop-shadow-[2px_2px_0_#111214] border-2 border-text relative z-10 truncate px-4">
                            {scenario.title}
                          </h3>
                        </div>

                        {/* Card Footer */}
                        <div className="p-5 flex flex-col flex-1">
                          <h4 className="font-bold text-text text-lg mb-1 truncate">{scenario.title}</h4>
                          <p className="text-text-muted text-sm line-clamp-2 mb-4 flex-1">{scenario.narrative}</p>

                          <div className="flex gap-2 flex-wrap mt-auto">
                            <span className="text-xs font-mono px-2 py-1 border-[3px] border-text rounded text-text-muted bg-bg">
                              {track.name}
                            </span>
                            {/* Dummy tags to simulate the image */}
                            <span className="text-xs font-mono px-2 py-1 border-[3px] border-text rounded text-text-muted bg-bg">
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

        {/* Right Sidebar (Skillset) */}
        <aside className="w-80 border-l border-border bg-surface p-6 overflow-y-auto hidden lg:block shrink-0">
          <SkillsetPanel skills={skills} />
        </aside>
      </div>
    </div>
  );
}
