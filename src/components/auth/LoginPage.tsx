import React, { useState } from 'react';
import {
  CalendarDays,
  Lock,
  Mail,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../api/client.ts';
import { ExamSlotIcon } from '../common/ExamSlotLogo.tsx';

interface LoginPageProps {
  onOpenPasswordSetup?: (token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password flow
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotSuccess(res.message);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to dispatch reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F7F7F3] dark:bg-[#08090B] font-ui transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-[#DDE3E8] dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Banner with Ink Black Background matching design theme */}
        <div className="bg-[#08090B] p-7 text-white text-center border-b border-slate-800">
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white px-5 py-2.5 rounded-2xl shadow-md inline-flex items-center justify-center mb-1">
              <img
                src="/examslot-logo.svg"
                alt="ExamSlot - University Examination Management System"
                className="h-10 sm:h-11 w-auto object-contain select-none"
              />
            </div>
          </div>

          {/* Role selector tabs */}
          <div className="mt-5 grid grid-cols-2 p-1 bg-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setEmail('ali.khan@student.examslot.edu');
                setPassword('Student@123');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                activeTab === 'student'
                  ? 'bg-[#C8F85A] text-[#08090B] shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setEmail('admin@examslot.edu');
                setPassword('Admin@123');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                activeTab === 'admin'
                  ? 'bg-[#8ECCFF] text-[#08090B] shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Controller
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8">
          <div className="mb-4 text-center">
            <h2 className="font-display font-bold text-xl text-[#08090B] dark:text-white">
              {activeTab === 'student' ? 'Student Sign In' : 'Administrative Controller Login'}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[#D43D3D] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                University Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#68717D]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'student' ? 'ali.khan@student.examslot.edu' : 'admin@examslot.edu'}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#08090B] dark:text-slate-200">
                  Password
                </label>
                {activeTab === 'student' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotModalOpen(true);
                    }}
                    className="text-xs text-[#16865B] dark:text-[#C8F85A] hover:underline font-bold"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#68717D]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#68717D] hover:text-[#08090B] dark:hover:text-white rounded-lg transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] disabled:opacity-60 text-[#08090B] ${
                activeTab === 'student'
                  ? 'bg-[#C8F85A] hover:bg-[#bbf048]'
                  : 'bg-[#8ECCFF] hover:bg-[#7ac2f5]'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#08090B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Footer */}
          <div className="mt-5 p-3.5 bg-[#F7F7F3] dark:bg-slate-800/60 rounded-2xl border border-[#DDE3E8] dark:border-slate-700 text-xs space-y-1.5">
            <div className="font-bold text-[#08090B] dark:text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#16865B]" />
              Quick Fill Demo Credentials:
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setEmail('admin@examslot.edu');
                  setPassword('Admin@123');
                }}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-[#DDE3E8] dark:border-slate-600 rounded-xl text-[11px] font-mono hover:bg-[#8ECCFF] hover:text-[#08090B] text-[#08090B] dark:text-slate-200 transition"
              >
                Admin (Admin@123)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('student');
                  setEmail('ali.khan@student.examslot.edu');
                  setPassword('Student@123');
                }}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-[#DDE3E8] dark:border-slate-600 rounded-xl text-[11px] font-mono hover:bg-[#C8F85A] hover:text-[#08090B] text-[#08090B] dark:text-slate-200 transition"
              >
                Ali Khan (Student@123)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white mb-1">
              Reset Your Password
            </h3>
            <p className="text-xs text-[#68717D] mb-4">
              Enter your registered student email address. We will dispatch a single-use 24-hour reset link to your university inbox.
            </p>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-[#16865B] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Reset Link Dispatched</span>
                </div>
                <p>{forgotSuccess}</p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotSuccess(null);
                  }}
                  className="w-full mt-2 py-2 bg-[#16865B] text-white rounded-2xl font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-[#D43D3D] text-xs rounded-2xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@student.examslot.edu"
                    required
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#68717D] hover:bg-slate-100 rounded-2xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2.5 text-xs font-bold bg-[#8ECCFF] text-[#08090B] rounded-2xl flex items-center gap-1.5 transition disabled:opacity-60"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
