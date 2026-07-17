import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { register, getMe } from '../lib/api';
import { HiOutlineArrowLeft } from 'react-icons/hi';

const CAREER_PATHS = [
  { id: 'software', label: 'Software Engineering', icon: '💻' },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: '🛡️' },
  { id: 'cloud', label: 'Cloud Infrastructure', icon: '☁️' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',
    password: '',
    career_paths: [] as string[],
  });

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const togglePath = (pathId: string) => {
    setFormData(prev => {
      const paths = prev.career_paths;
      if (paths.includes(pathId)) {
        return { ...prev, career_paths: paths.filter(p => p !== pathId) };
      } else {
        return { ...prev, career_paths: [...paths, pathId] };
      }
    });
  };

  const handleSubmit = async () => {
    if (formData.career_paths.length === 0) {
      setError('Please select at least one career path.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await register(formData);
      localStorage.setItem('token', res.token);
      const user = await getMe();
      loginUser(res.token, user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-text">
      <div className="max-w-md w-full">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className="h-1 flex-1 bg-blue-500 rounded-full" />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-blue-500' : 'bg-border'}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button 
                onClick={() => navigate('/')}
                className="text-text-muted hover:text-text mb-6 text-sm flex items-center gap-1"
              >
                <HiOutlineArrowLeft className="w-4 h-4" /> Home
              </button>
              <h1 className="text-3xl font-bold mb-2">Create Account</h1>
              <p className="text-text-muted mb-8">Enter your details to join Escape the Lab.</p>

              <form onSubmit={handleNextStep} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-surface border-[3px] border-text rounded-lg p-3 text-text focus:border-blue-500 focus:outline-none"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Username</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-surface border-[3px] border-text rounded-lg p-3 text-text focus:border-blue-500 focus:outline-none"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-surface border-[3px] border-text rounded-lg p-3 text-text focus:border-blue-500 focus:outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
                  <input
                    type="password"
                    required
                    className="w-full bg-surface border-[3px] border-text rounded-lg p-3 text-text focus:border-blue-500 focus:outline-none"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-text border-[3px] border-text shadow-[4px_4px_0_#111214] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#111214] font-semibold py-3 px-4 rounded-lg mt-6 transition-colors"
                >
                  Continue →
                </button>
              </form>
              
              <p className="mt-6 text-center text-sm text-text-muted">
                Already have an account? <button onClick={() => navigate('/login')} className="text-blue-400 hover:underline">Login</button>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button 
                onClick={() => setStep(1)}
                className="text-text-muted hover:text-text mb-6 text-sm flex items-center gap-1"
              >
                ← Back
              </button>

              <h1 className="text-3xl font-bold mb-2">Choose Your Path</h1>
              <p className="text-text-muted mb-8">What do you want to master? Select one or more.</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {CAREER_PATHS.map((path) => {
                  const isSelected = formData.career_paths.includes(path.id);
                  return (
                    <button
                      key={path.id}
                      onClick={() => togglePath(path.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500' 
                          : 'bg-surface border-border hover:border-text-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{path.icon}</span>
                        <span className="font-medium">{path.label}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-text-muted'
                      }`}>
                        {isSelected && <span className="text-text text-xs">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-text font-semibold py-3 px-4 rounded-lg mt-8 transition-colors"
              >
                {loading ? 'Creating Account...' : 'Finish & Enter Lab'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
