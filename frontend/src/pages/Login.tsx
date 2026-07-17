import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { login, getMe } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await login(formData);
      localStorage.setItem('token', res.token);
      const user = await getMe();
      loginUser(res.token, user);
      navigate('/catalog');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface border border-border rounded-xl p-8 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-text mb-6">Welcome Back</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full bg-bg border border-border rounded p-2 text-text focus:border-blue-500 focus:outline-none"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-bg border border-border rounded p-2 text-text focus:border-blue-500 focus:outline-none"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-text-muted">
          Don't have an account? <button onClick={() => navigate('/onboarding')} className="text-blue-400 hover:underline">Get Started</button>
        </p>
      </motion.div>
    </div>
  );
}
