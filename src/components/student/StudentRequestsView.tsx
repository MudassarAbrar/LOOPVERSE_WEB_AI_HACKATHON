import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Send,
  Plus,
  RefreshCw,
  FileQuestion
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { ChangeRequest } from '../../types/index.ts';

interface StudentRequestsViewProps {
  onOpenNewRequest: () => void;
}

export const StudentRequestsView: React.FC<StudentRequestsViewProps> = ({ onOpenNewRequest }) => {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMyRequests();
      setRequests(res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load change requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="space-y-6 font-ui">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-xl text-[#08090B] dark:text-white">
              My Examination Change Requests
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D9ECF8] dark:bg-slate-800 text-[#08090B] dark:text-[#8ECCFF] font-bold text-xs">
              {requests.length} {requests.length === 1 ? 'Request' : 'Requests'}
            </span>
          </div>
          <p className="text-xs text-[#68717D] dark:text-slate-400 mt-1 max-w-xl">
            Track and review your submissions for campus branch re-selection or date sheet timetable unlocking.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchRequests}
            className="p-2.5 rounded-2xl bg-[#F7F7F3] dark:bg-slate-800 hover:bg-slate-200 text-[#08090B] dark:text-slate-200 text-xs font-bold transition"
            title="Refresh Requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenNewRequest}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Submit New Request</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-[#D43D3D] text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#68717D] dark:text-slate-400">Loading your request history...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-3xl bg-[#D9ECF8] dark:bg-slate-800 text-[#08090B] dark:text-[#8ECCFF] flex items-center justify-center mx-auto">
            <FileQuestion className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white">
              No Change Requests Submitted
            </h3>
            <p className="text-xs text-[#68717D] dark:text-slate-400 leading-relaxed">
              You haven't requested any changes to your examination center branch or finalized date sheet timetable.
            </p>
          </div>
          <button
            onClick={onOpenNewRequest}
            className="px-5 py-2.5 bg-[#08090B] dark:bg-[#C8F85A] text-white dark:text-[#08090B] rounded-2xl text-xs font-bold inline-flex items-center gap-2 transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit a Change Request</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 transition hover:border-slate-400 dark:hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl text-xs font-bold ${
                    req.requestType === 'CHANGE_BRANCH'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  }`}>
                    {req.requestType === 'CHANGE_BRANCH' ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#08090B] dark:text-white">
                      {req.requestType === 'CHANGE_BRANCH'
                        ? 'Request: Re-select Examination Campus Branch'
                        : 'Request: Unlock Examination Date Sheet'}
                    </h4>
                    <span className="text-[11px] text-[#68717D] dark:text-slate-400 font-mono">
                      Submitted on {new Date(req.dateRaised).toLocaleDateString()} at{' '}
                      {new Date(req.dateRaised).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div>
                  {req.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending Review</span>
                    </span>
                  )}
                  {req.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16865B]" />
                      <span>Approved by Admin</span>
                    </span>
                  )}
                  {req.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-xs">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rejected</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Justification */}
              <div className="bg-[#F7F7F3] dark:bg-slate-800/60 rounded-2xl p-3.5 text-xs text-[#08090B] dark:text-slate-200">
                <span className="font-bold text-[#68717D] dark:text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">
                  Your Submitted Justification:
                </span>
                <p className="leading-relaxed">{req.reason}</p>
              </div>

              {/* Admin Remark if reviewed */}
              {req.adminRemark && (
                <div className={`rounded-2xl p-3.5 text-xs border ${
                  req.status === 'APPROVED'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                }`}>
                  <span className="font-bold block mb-1 uppercase tracking-wider text-[10px]">
                    Controller of Examination Remark:
                  </span>
                  <p className="leading-relaxed">{req.adminRemark}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
