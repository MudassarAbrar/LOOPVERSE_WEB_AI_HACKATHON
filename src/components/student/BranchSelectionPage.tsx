import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { Branch } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface BranchSelectionPageProps {
  onSuccess: () => void;
}

export const BranchSelectionPage: React.FC<BranchSelectionPageProps> = ({ onSuccess }) => {
  const { studentProfile, refreshUser } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBranches() {
      try {
        setLoading(true);
        const res = await api.getBranches(1, 50, '', 'ACTIVE');
        setBranches(res.data);
        if (res.data.length > 0) {
          setSelectedBranchId(res.data[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load active branches.');
      } finally {
        setLoading(false);
      }
    }
    loadBranches();
  }, []);

  const handleConfirmBranch = async () => {
    if (!selectedBranchId) {
      setError('Please choose a campus branch from the list.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.selectBranch(selectedBranchId);
      await refreshUser();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Branch selection failed.');
    } finally {
      setSaving(false);
    }
  };

  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-ui">
      {/* Header Banner with Stepper Step 1 active */}
      <div className="bg-[#08090B] dark:bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-800 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-[#C8F85A]">
          <Lock className="w-3.5 h-3.5" />
          <span>Step 1: One-Time Campus Finalization Rule</span>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
          Select Your Examination Campus Branch
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-ui">
          All university students sit papers in person. Choose the campus branch where you want to take your exams.
        </p>
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#C8F85A] shrink-0 mt-0.5" />
          <span>
            <strong>Single-Use Decision: </strong> This selection can be made <strong>only once</strong>. Once saved, this screen will never be shown again, and you will go straight to the date sheet designer.
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-[#D43D3D] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b) => {
              const isSelected = selectedBranchId === b.id;

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-[#08090B] dark:border-[#C8F85A] bg-[#D9ECF8]/50 dark:bg-slate-800 shadow-md'
                      : 'border-[#DDE3E8] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-[#08090B] text-white dark:bg-[#C8F85A] dark:text-[#08090B]">
                          {b.code}
                        </span>
                        <span className="text-xs font-bold text-[#68717D]">{b.city}</span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white mt-2">
                        {b.name}
                      </h3>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-[#08090B] bg-[#08090B] dark:border-[#C8F85A] dark:bg-[#C8F85A]'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 bg-white dark:bg-[#08090B] rounded-full" />}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DDE3E8] dark:border-slate-800 text-xs text-[#68717D] space-y-1.5">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#68717D] shrink-0 mt-0.5" />
                      <span>{b.address}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-[#68717D] shrink-0" />
                      <span>{b.contactNumber}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-[#68717D]">Selected Examination Center:</span>
              <div className="text-sm font-bold text-[#08090B] dark:text-white mt-0.5">
                {selectedBranch?.name} ({selectedBranch?.city})
              </div>
            </div>

            <button
              onClick={handleConfirmBranch}
              disabled={saving || !selectedBranchId}
              className="w-full sm:w-auto px-7 py-3 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-60"
            >
              {saving ? 'Confirming...' : 'Confirm Campus & Proceed →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
