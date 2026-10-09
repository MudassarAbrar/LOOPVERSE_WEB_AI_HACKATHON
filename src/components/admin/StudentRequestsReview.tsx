import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { ChangeRequest } from '../../types/index.ts';
import { Pagination } from '../common/Pagination.tsx';

export const StudentRequestsReview: React.FC = () => {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Review modal
  const [reviewingReq, setReviewingReq] = useState<ChangeRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [adminRemark, setAdminRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRequests = async (
    page = currentPage,
    query = search,
    status = statusFilter,
    type = typeFilter
  ) => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await api.getRequests(page, pageSize, query, status, type);
      setRequests(res.data);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
      setCurrentPage(res.pagination.currentPage);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || 'Failed to fetch student requests.';
      setFetchError(errorMsg);
      setAlertMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1, search, statusFilter, typeFilter);
  }, [search, statusFilter, typeFilter, pageSize]);

  const handleOpenReview = (req: ChangeRequest, action: 'APPROVE' | 'REJECT') => {
    setReviewingReq(req);
    setReviewAction(action);
    setModalError(null);
    setAdminRemark(
      action === 'APPROVE'
        ? `Approved per examination policy. One-time unlock granted.`
        : 'Request cannot be accommodated due to schedule finalization deadlines.'
    );
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingReq || submitting) return;

    setSubmitting(true);
    setModalError(null);
    try {
      await api.reviewRequest(reviewingReq.id, reviewAction, adminRemark);
      setAlertMessage({
        type: 'success',
        text: `Request by ${reviewingReq.studentName} successfully ${reviewAction.toLowerCase()}d. One-time unlock confirmed & email notification dispatched.`
      });
      setReviewingReq(null);
      await fetchRequests(currentPage, search, statusFilter, typeFilter);
    } catch (err: any) {
      const msg = err.message || 'Failed to review request.';
      if (msg.toLowerCase().includes('session expired') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('log in')) {
        setModalError('Session expired - Log in again.');
      } else {
        setModalError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 font-ui">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#08090B] dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#16865B] dark:text-[#C8F85A]" />
            Student Change Requests Queue
          </h2>
          <p className="text-xs text-[#68717D] dark:text-slate-400">
            Review student petitions for changing branch or date sheet. Approving grants a single-use action unlock.
          </p>
        </div>
      </div>

      {/* Alert */}
      {alertMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-[#16865B] dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-[#D43D3D]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16865B]" />
            <span>{alertMessage.text}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="p-1 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#68717D]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search student, reg no or reason..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <label htmlFor="reqStatusSelect" className="text-xs text-[#68717D]">Status:</label>
            <select
              id="reqStatusSelect"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter requests by status"
              className="py-1.5 px-3 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Only</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="reqTypeSelect" className="text-xs text-[#68717D]">Type:</label>
            <select
              id="reqTypeSelect"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter requests by type"
              className="py-1.5 px-3 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
            >
              <option value="">All Types</option>
              <option value="CHANGE_BRANCH">Change Branch</option>
              <option value="CHANGE_DATESHEET">Change Date Sheet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <div className="py-12 text-center text-xs space-y-3">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[#D43D3D] rounded-2xl max-w-md mx-auto flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchRequests(currentPage, search, statusFilter, typeFilter)}
              className="px-4 py-2 bg-[#08090B] dark:bg-slate-800 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Retry Loading Requests
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#68717D]">
            No change requests found.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F7F3] dark:bg-slate-800/60 border-b border-[#DDE3E8] dark:border-slate-800 text-[11px] font-bold text-[#68717D] dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Request Type</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Admin Remark</th>
                    <th className="py-3.5 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3E8] dark:divide-slate-800 text-xs">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F7F7F3]/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#08090B] dark:text-white">{r.studentName}</div>
                        <div className="text-[11px] font-mono text-[#68717D]">{r.regNumber}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#08090B] dark:text-slate-200">
                          {r.requestType === 'CHANGE_BRANCH' ? 'Change Branch' : 'Change Date Sheet'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#68717D] max-w-xs leading-relaxed">
                        {r.reason}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#68717D] text-[11px]">
                        {new Date(r.dateRaised).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            r.status === 'PENDING'
                              ? 'bg-amber-50 text-[#D58A13]'
                              : r.status === 'APPROVED'
                              ? 'bg-emerald-50 text-[#16865B]'
                              : 'bg-rose-50 text-[#D43D3D]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.status === 'PENDING'
                                ? 'bg-[#D58A13]'
                                : r.status === 'APPROVED'
                                ? 'bg-[#16865B]'
                                : 'bg-[#D43D3D]'
                            }`}
                          />
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#68717D] text-[11px]">
                        {r.adminRemark || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReview(r, 'APPROVE')}
                              className="px-3 py-1 bg-[#16865B] hover:bg-[#126b48] text-white rounded-xl text-[11px] font-bold transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReview(r, 'REJECT')}
                              className="px-3 py-1 bg-[#D43D3D] hover:bg-[#b53232] text-white rounded-xl text-[11px] font-bold transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#68717D]">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-[#DDE3E8] dark:divide-slate-800">
              {requests.map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-[#08090B] dark:text-white">{r.studentName}</span>
                      <span className="text-xs text-[#68717D] block">{r.requestType}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9ECF8] text-[#08090B]">
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#68717D]">"{r.reason}"</p>
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2 pt-2 border-t border-[#DDE3E8] dark:border-slate-800">
                      <button
                        onClick={() => handleOpenReview(r, 'APPROVE')}
                        className="flex-1 py-1.5 bg-[#16865B] text-white rounded-xl text-xs font-bold"
                      >
                        Approve (Unlock)
                      </button>
                      <button
                        onClick={() => handleOpenReview(r, 'REJECT')}
                        className="flex-1 py-1.5 bg-[#D43D3D] text-white rounded-xl text-xs font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(page) => fetchRequests(page, search, statusFilter, typeFilter)}
              onPageSizeChange={(size) => setPageSize(size)}
            />
          </>
        )}
      </div>

      {/* Review Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DDE3E8] dark:border-slate-800">
              <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white flex items-center gap-2">
                {reviewAction === 'APPROVE' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#16865B]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#D43D3D]" />
                )}
                <span>{reviewAction === 'APPROVE' ? 'Approve' : 'Reject'} Student Request</span>
              </h3>
              <button onClick={() => setReviewingReq(null)} className="p-1 text-[#68717D] rounded-full hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-[#F7F7F3] dark:bg-slate-800/60 rounded-2xl border border-[#DDE3E8] dark:border-slate-700 text-xs space-y-1 mb-4">
              <div><strong>Student:</strong> {reviewingReq.studentName} ({reviewingReq.regNumber})</div>
              <div><strong>Request:</strong> {reviewingReq.requestType}</div>
              <div className="text-[#68717D]"><strong>Reason:</strong> "{reviewingReq.reason}"</div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[#D43D3D] text-xs rounded-2xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                  Administrative Remark (sent to student via email)
                </label>
                <textarea
                  rows={3}
                  value={adminRemark}
                  onChange={(e) => setAdminRemark(e.target.value)}
                  placeholder="Official controller remarks..."
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingReq(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#68717D] hover:bg-slate-100 rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition disabled:opacity-60 text-white ${
                    reviewAction === 'APPROVE'
                      ? 'bg-[#16865B] hover:bg-[#126b48]'
                      : 'bg-[#D43D3D] hover:bg-[#b53232]'
                  }`}
                >
                  {submitting ? 'Processing...' : reviewAction === 'APPROVE' ? 'Confirm Approval & Unlock' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
