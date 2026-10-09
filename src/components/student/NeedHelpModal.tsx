import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Info
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { ChangeRequest, RequestType } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface NeedHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

export const NeedHelpModal: React.FC<NeedHelpModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted
}) => {
  const { refreshUser } = useAuth();

  const [requestType, setRequestType] = useState<RequestType>('CHANGE_DATESHEET');
  const [reason, setReason] = useState('');
  const [myRequests, setMyRequests] = useState<ChangeRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getMyRequests();
      setMyRequests(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a clear justification / reason.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.submitChangeRequest(requestType, reason.trim());
      setSuccessMsg('Your change request has been submitted to the administration.');
      setReason('');
      await fetchHistory();
      await refreshUser();
      onRequestSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingOfSameType = myRequests.some(
    r => r.requestType === requestType && r.status === 'PENDING'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in font-ui">
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#DDE3E8] dark:border-slate-800 bg-[#F7F7F3] dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#C8F85A] text-[#08090B] rounded-2xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white">
                Need Help: Examination Change Request
              </h3>
              <p className="text-xs text-[#68717D]">
                Submit an official change petition to unlock your branch or date sheet.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-[#68717D] rounded-full hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#68717D]">
              Submit New Change Request
            </h4>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-[#D43D3D] text-xs rounded-2xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#16865B] text-xs rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1.5">
                  Request Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestType('CHANGE_BRANCH')}
                    className={`p-3.5 rounded-2xl border text-xs font-semibold text-left transition ${
                      requestType === 'CHANGE_BRANCH'
                        ? 'border-[#08090B] dark:border-[#C8F85A] bg-[#D9ECF8]/70 dark:bg-slate-800 text-[#08090B] dark:text-white ring-2 ring-[#8ECCFF]/30'
                        : 'border-[#DDE3E8] dark:border-slate-800 bg-white dark:bg-slate-800 text-[#68717D]'
                    }`}
                  >
                    <div className="font-bold text-sm text-[#08090B] dark:text-white">1. Change Exam Branch</div>
                    <div className="text-[11px] text-[#68717D] mt-0.5">Switch your campus center</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestType('CHANGE_DATESHEET')}
                    className={`p-3.5 rounded-2xl border text-xs font-semibold text-left transition ${
                      requestType === 'CHANGE_DATESHEET'
                        ? 'border-[#08090B] dark:border-[#C8F85A] bg-[#D9ECF8]/70 dark:bg-slate-800 text-[#08090B] dark:text-white ring-2 ring-[#8ECCFF]/30'
                        : 'border-[#DDE3E8] dark:border-slate-800 bg-white dark:bg-slate-800 text-[#68717D]'
                    }`}
                  >
                    <div className="font-bold text-sm text-[#08090B] dark:text-white">2. Change Date Sheet</div>
                    <div className="text-[11px] text-[#68717D] mt-0.5">Unlock slot selection</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                  Reason for Request
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you require this modification..."
                  required
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                />
              </div>

              {hasPendingOfSameType && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-[#D58A13] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>You already have a <strong>PENDING</strong> request of this type.</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-[#68717D] flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-[#16865B]" />
                  <span>Approval grants a single-use unlock.</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || hasPendingOfSameType}
                  className="px-5 py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Past History */}
          <div className="space-y-3 pt-4 border-t border-[#DDE3E8] dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#68717D] flex items-center justify-between">
              <span>Your Requests History</span>
              <button
                type="button"
                onClick={fetchHistory}
                className="text-[11px] text-[#16865B] dark:text-[#C8F85A] hover:underline flex items-center gap-1 normal-case font-bold"
              >
                <RotateCcw className="w-3 h-3" /> Refresh Status
              </button>
            </h4>

            {loadingHistory ? (
              <div className="py-4 text-center text-xs text-[#68717D]">Loading history...</div>
            ) : myRequests.length === 0 ? (
              <div className="p-4 bg-[#F7F7F3] dark:bg-slate-800/40 rounded-2xl text-center text-xs text-[#68717D]">
                No previous requests submitted.
              </div>
            ) : (
              <div className="space-y-2.5">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl border border-[#DDE3E8] dark:border-slate-800 bg-[#F7F7F3] dark:bg-slate-800/50 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#08090B] dark:text-white">
                        {req.requestType === 'CHANGE_BRANCH' ? 'Change Campus Branch' : 'Change Date Sheet'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status === 'PENDING'
                            ? 'bg-amber-50 text-[#D58A13]'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-[#16865B]'
                            : 'bg-rose-50 text-[#D43D3D]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            req.status === 'PENDING'
                              ? 'bg-[#D58A13]'
                              : req.status === 'APPROVED'
                              ? 'bg-[#16865B]'
                              : 'bg-[#D43D3D]'
                          }`}
                        />
                        {req.status}
                      </span>
                    </div>

                    <p className="text-[#68717D] italic text-[11px]">"{req.reason}"</p>

                    {req.adminRemark && (
                      <div className="text-[11px] text-[#08090B] dark:text-slate-200 bg-white dark:bg-slate-800 p-2 rounded-xl border border-[#DDE3E8] dark:border-slate-700">
                        <strong>Remark:</strong> {req.adminRemark}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#DDE3E8] dark:border-slate-800 bg-[#F7F7F3] dark:bg-slate-800/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-[#08090B] dark:text-white rounded-2xl text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
