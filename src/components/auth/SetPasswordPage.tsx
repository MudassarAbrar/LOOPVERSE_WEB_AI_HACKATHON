import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { api, setStoredToken } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface SetPasswordPageProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SetPasswordPage: React.FC<SetPasswordPageProps> = ({
  token,
  onSuccess,
  onCancel
}) => {
  const { refreshUser } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function checkToken() {
      try {
        setVerifying(true);
        const res = await api.verifyToken(token);
        setValid(true);
        setEmail(res.email);
      } catch (err: any) {
        setTokenError(err.message || 'Invalid or expired setup link.');
        setValid(false);
      } finally {
        setVerifying(false);
      }
    }
    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.setPassword(token, password);
      // Store session token and refresh auth state
      setStoredToken(res.token);
      await refreshUser();
      onSuccess();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to set password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F7F7F3] dark:bg-[#08090B] font-ui transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-[#DDE3E8] dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Banner with Ink Black Background matching design theme */}
        <div className="bg-[#08090B] p-7 text-white text-center border-b border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C8F85A] text-[#08090B] flex items-center justify-center mb-3 font-bold shadow-sm">
            <KeyRound className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-white">
            Set Your Portal Password
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-ui">
            Secure Student Onboarding · Virtual University
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {verifying ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#68717D] dark:text-slate-400">Verifying security token validity...</p>
            </div>
          ) : tokenError || !valid ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-[#D43D3D] flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#08090B] dark:text-white">
                  Link Invalid or Expired
                </h3>
                <p className="text-xs text-[#68717D] dark:text-slate-400 mt-1">
                  {tokenError || 'This password setup link has already been used or exceeded its 24-hour validity limit.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-[#08090B] dark:bg-slate-800 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3.5 bg-[#D9ECF8]/40 dark:bg-slate-800/60 rounded-2xl border border-[#DDE3E8] dark:border-slate-800">
                <span className="text-xs font-medium text-[#68717D] dark:text-slate-400">Account:</span>
                <p className="text-sm font-bold text-[#08090B] dark:text-slate-200 font-mono">
                  {email}
                </p>
                <p className="text-[11px] text-[#68717D] dark:text-slate-400 mt-0.5">
                  Single-use onboarding link verified. Please choose a strong password.
                </p>
              </div>

              {submitError && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-[#D43D3D] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#08090B] dark:text-slate-300 mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#68717D]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#08090B] dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#68717D]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#F7F7F3] dark:bg-slate-800/50 rounded-2xl text-[#68717D] dark:text-slate-400 text-[11px] space-y-1 border border-[#DDE3E8] dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[#08090B] dark:text-slate-300 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#16865B] dark:text-[#C8F85A]" />
                    Security Standards:
                  </div>
                  <div>• Passwords are encrypted with salted Bcrypt hashes.</div>
                  <div>• Never stored or transmitted in plain text.</div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs font-semibold text-[#68717D] hover:text-[#08090B] dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2.5 px-5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-[0.99] disabled:opacity-60"
                  >
                    {submitting ? (
                      'Securing...'
                    ) : (
                      <>
                        <span>Activate & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
