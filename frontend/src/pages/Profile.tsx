import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getMe, updateProfile, updateAvatar, changePassword } from '../lib/api';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineMail,
  HiOutlinePencil,
  HiOutlineLockClosed,
  HiOutlineCamera,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineIdentification,
  HiOutlineShieldExclamation,
  HiOutlineAnnotation,
  HiOutlineAtSymbol,
} from 'react-icons/hi';

type Tab = 'profile' | 'password';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loginUser, token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Profile form state
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',
    bio: '',
  });

  // Password form state
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getMe();
        setFormData({
          fullname: data.fullname || '',
          username: data.username || '',
          email: data.email || '',
          bio: data.bio || '',
        });
        if (data.avatar) setAvatarPreview(data.avatar);
      } catch {
        toast.error('Failed to load profile data.');
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant preview
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);

    try {
      const updated = await updateAvatar(file);
      setAvatarPreview(updated.avatar);
      // Update auth context with new data
      loginUser(token!, updated);
      toast.success('Profile picture updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateProfile(formData);
      loginUser(token!, updated);
      setFormData({
        fullname: updated.fullname || '',
        username: updated.username || '',
        email: updated.email || '',
        bio: updated.bio || '',
      });
      toast.success('Profile saved successfully!');
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        const firstErr = Object.values(parsed)[0] as string[];
        toast.error(firstErr[0] || 'Failed to save profile.');
      } catch {
        toast.error(err.message || 'Failed to save profile.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pwForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await changePassword(pwForm.current_password, pwForm.new_password);
      // Server re-issues token — update stored token
      if (res.token) {
        localStorage.setItem('token', res.token);
        loginUser(res.token, user!);
      }
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed! Stay secure, operator.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = formData.fullname
    ? formData.fullname.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (formData.username?.[0] || 'U').toUpperCase();

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted font-mono">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col text-text font-body">
      {/* Header */}
      <header className="h-16 border-b-[3px] border-text bg-surface flex items-center px-6 gap-4 sticky top-0 z-20 shadow-[2px_2px_0_#111214]">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-text-muted hover:text-text transition-colors flex items-center gap-1.5 text-sm font-bold"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex-1" />
        <span className="text-sm font-bold text-text-muted font-mono hidden sm:block">
          OPERATOR PROFILE
        </span>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* Avatar + Name Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border-[3px] border-text rounded-2xl shadow-[6px_6px_0_#111214] p-8 flex flex-col sm:flex-row items-center gap-6"
          >
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div
                onClick={handleAvatarClick}
                className="w-24 h-24 rounded-2xl border-[3px] border-text overflow-hidden shadow-[4px_4px_0_#111214] cursor-pointer bg-blue-500 flex items-center justify-center relative"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-white">{initials}</span>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <HiOutlineCamera className="w-8 h-8 text-white" />
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-display font-black text-text">{formData.fullname || formData.username}</h1>
              <p className="text-text-muted font-mono text-sm">@{formData.username}</p>
              <p className="text-text-muted text-sm mt-1">{formData.email}</p>
              <button
                onClick={handleAvatarClick}
                className="mt-3 text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
              >
                <HiOutlineCamera className="w-3.5 h-3.5" />
                Change profile picture
              </button>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex border-[3px] border-text rounded-xl overflow-hidden shadow-[4px_4px_0_#111214] bg-surface">
            {(['profile', 'password'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                  activeTab === tab
                    ? 'bg-text text-bg'
                    : 'text-text-muted hover:bg-bg'
                }`}
              >
                {tab === 'profile' ? (
                  <><HiOutlineIdentification className="w-4 h-4" /> Edit Profile</>
                ) : (
                  <><HiOutlineShieldExclamation className="w-4 h-4" /> Change Password</>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'profile' ? (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <form
                  onSubmit={handleProfileSave}
                  className="bg-surface border-[3px] border-text rounded-2xl shadow-[6px_6px_0_#111214] p-8 space-y-6"
                >
                  <h2 className="text-xl font-display font-black text-text flex items-center gap-2">
                    <HiOutlinePencil className="w-5 h-5" />
                    Edit Profile Info
                  </h2>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <HiOutlineIdentification className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        value={formData.fullname}
                        onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                        className="w-full bg-bg border-[3px] border-text rounded-xl pl-10 pr-4 py-3 text-text font-medium focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <HiOutlineAtSymbol className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-bg border-[3px] border-text rounded-xl pl-10 pr-4 py-3 text-text font-mono focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="shadow_byte"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-bg border-[3px] border-text rounded-xl pl-10 pr-4 py-3 text-text focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="operator@questops.io"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Bio
                    </label>
                    <div className="relative">
                      <HiOutlineAnnotation className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={3}
                        className="w-full bg-bg border-[3px] border-text rounded-xl pl-10 pr-4 py-3 text-text focus:outline-none focus:border-blue-500 transition-colors resize-none"
                        placeholder="Brief description about you and your expertise..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full bg-text text-bg border-[3px] border-text font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.3)] transition-all disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <div className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiOutlineCheck className="w-5 h-5" />
                    )}
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="password-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form
                  onSubmit={handlePasswordChange}
                  className="bg-surface border-[3px] border-text rounded-2xl shadow-[6px_6px_0_#111214] p-8 space-y-6"
                >
                  <h2 className="text-xl font-display font-black text-text flex items-center gap-2">
                    <HiOutlineShieldExclamation className="w-5 h-5" />
                    Change Password
                  </h2>

                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        value={pwForm.current_password}
                        onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                        required
                        className="w-full bg-bg border-[3px] border-text rounded-xl px-4 pr-11 py-3 text-text focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                      >
                        {showCurrentPw ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        value={pwForm.new_password}
                        onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                        required
                        minLength={8}
                        className="w-full bg-bg border-[3px] border-text rounded-xl px-4 pr-11 py-3 text-text focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                      >
                        {showNewPw ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {pwForm.new_password.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              pwForm.new_password.length >= i * 3
                                ? i <= 1 ? 'bg-red-500'
                                  : i <= 2 ? 'bg-yellow-500'
                                  : i <= 3 ? 'bg-blue-500'
                                  : 'bg-green-500'
                                : 'bg-border'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={pwForm.confirm_password}
                      onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                      required
                      className={`w-full bg-bg border-[3px] rounded-xl px-4 py-3 text-text focus:outline-none transition-colors ${
                        pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-text focus:border-blue-500'
                      }`}
                      placeholder="Repeat new password"
                    />
                    {pwForm.confirm_password && pwForm.confirm_password !== pwForm.new_password && (
                      <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword || pwForm.new_password !== pwForm.confirm_password}
                    className="w-full bg-text text-bg border-[3px] border-text font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.3)] transition-all disabled:opacity-50"
                  >
                    {savingPassword ? (
                      <div className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiOutlineLockClosed className="w-5 h-5" />
                    )}
                    {savingPassword ? 'Changing...' : 'Update Password'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
