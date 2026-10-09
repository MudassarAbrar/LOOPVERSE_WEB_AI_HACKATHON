import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { Branch } from '../../types/index.ts';
import { Pagination } from '../common/Pagination.tsx';

export const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    address: '',
    contactNumber: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  const fetchBranches = async (page = currentPage, query = search, status = statusFilter) => {
    try {
      setLoading(true);
      const res = await api.getBranches(page, pageSize, query, status);
      setBranches(res.data);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
      setCurrentPage(res.pagination.currentPage);
    } catch (err: any) {
      console.error(err);
      setAlertMessage({ type: 'error', text: err.message || 'Failed to load branches.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches(1, search, statusFilter);
  }, [search, statusFilter, pageSize]);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      code: '',
      city: '',
      address: '',
      contactNumber: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      city: branch.city,
      address: branch.address,
      contactNumber: branch.contactNumber,
      status: branch.status
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingBranch) {
        await api.updateBranch(editingBranch.id, formData);
        setAlertMessage({ type: 'success', text: `Branch '${formData.name}' updated successfully.` });
      } else {
        await api.createBranch(formData);
        setAlertMessage({ type: 'success', text: `New branch '${formData.name}' added successfully.` });
      }
      setModalOpen(false);
      fetchBranches(currentPage, search, statusFilter);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save branch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (branch: Branch) => {
    if (!window.confirm(`Are you sure you want to remove '${branch.name}' (${branch.code})?`)) {
      return;
    }

    try {
      const res = await api.deleteBranch(branch.id);
      if (res.softDeleted) {
        setAlertMessage({
          type: 'warning',
          text: res.message
        });
      } else {
        setAlertMessage({
          type: 'success',
          text: res.message || 'Branch deleted successfully.'
        });
      }
      fetchBranches(currentPage, search, statusFilter);
    } catch (err: any) {
      setAlertMessage({
        type: 'error',
        text: err.message || 'Cannot delete branch.'
      });
    }
  };

  return (
    <div className="space-y-4 font-ui">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#08090B] dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#16865B] dark:text-[#C8F85A]" />
            Campus Branch Management
          </h2>
          <p className="text-xs text-[#68717D] dark:text-slate-400">
            Configure examination venues across the country. Students select one active campus to sit papers in.
          </p>
        </div>

        {/* Accent Button matching Section 03 & Section 07 */}
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Branch</span>
        </button>
      </div>

      {/* Alert Notification */}
      {alertMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-[#16865B] dark:text-emerald-300'
              : alertMessage.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-[#D58A13]'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-[#D43D3D]'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16865B]" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="p-1 hover:opacity-70 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Safe Delete Rule Explanation Box */}
      <div className="p-4 bg-[#D9ECF8]/70 dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl text-xs text-[#08090B] dark:text-slate-200 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 shrink-0 text-[#D58A13] mt-0.5" />
        <div>
          <span className="font-bold">Safe-Delete Rule Enforced: </span>
          A branch that has already been chosen by students cannot be hard deleted. Attempting to delete an enrolled branch automatically marks it <code className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold">INACTIVE</code> to protect student records.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#68717D]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, code or city..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label htmlFor="branchStatusSelect" className="text-xs text-[#68717D] dark:text-slate-400">Status:</label>
          <select
            id="branchStatusSelect"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter branches by status"
            className="py-1.5 px-3 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table matching Section 07 */}
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : branches.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#68717D] dark:text-slate-400">
            No campus branches match your search criteria.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F7F3] dark:bg-slate-800/60 border-b border-[#DDE3E8] dark:border-slate-800 text-[11px] font-bold text-[#68717D] dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Campus Name</th>
                    <th className="py-3.5 px-4">City</th>
                    <th className="py-3.5 px-4">Address</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Enrolled</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3E8] dark:divide-slate-800 text-xs">
                  {branches.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F7F7F3]/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#08090B] dark:text-slate-200">
                        {b.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#08090B] dark:text-white">
                        {b.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#68717D] dark:text-slate-300">
                        {b.city}
                      </td>
                      <td className="py-3.5 px-4 text-[#68717D] max-w-xs truncate" title={b.address}>
                        {b.address}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#68717D]">
                        {b.contactNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#08090B] dark:text-slate-200">
                        {b.studentCount || 0} students
                      </td>
                      <td className="py-3.5 px-4">
                        {/* Status Badge from Section 05 */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            b.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-[#16865B] dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-[#68717D]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              b.status === 'ACTIVE' ? 'bg-[#16865B]' : 'bg-[#68717D]'
                            }`}
                          />
                          {b.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 text-[#68717D] hover:text-[#08090B] dark:hover:text-white rounded-xl hover:bg-[#D9ECF8] transition"
                            title="Edit Branch"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(b)}
                            className="p-1.5 text-[#68717D] hover:text-[#D43D3D] rounded-xl hover:bg-rose-50 transition"
                            title="Delete or Safe-Deactivate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-[#DDE3E8] dark:divide-slate-800">
              {branches.map((b) => (
                <div key={b.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#08090B] dark:text-slate-200">
                        {b.code}
                      </span>
                      <h4 className="font-bold text-sm text-[#08090B] dark:text-white">
                        {b.name}
                      </h4>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        b.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-[#16865B]'
                          : 'bg-slate-100 text-[#68717D]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'ACTIVE' ? 'bg-[#16865B]' : 'bg-[#68717D]'}`} />
                      {b.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#68717D] space-y-1">
                    <div>{b.city} · {b.address}</div>
                    <div className="font-mono">{b.contactNumber}</div>
                    <div className="font-bold text-[#08090B] dark:text-white pt-1">
                      Enrolled: {b.studentCount || 0} students
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DDE3E8] dark:border-slate-800">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="px-3 py-1 bg-[#F7F7F3] dark:bg-slate-800 text-xs font-semibold rounded-xl"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      className="px-3 py-1 bg-rose-50 text-[#D43D3D] text-xs font-semibold rounded-xl"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(page) => fetchBranches(page, search, statusFilter)}
              onPageSizeChange={(size) => setPageSize(size)}
            />
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DDE3E8] dark:border-slate-800">
              <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#16865B]" />
                {editingBranch ? 'Edit Campus Branch' : 'Register New Campus Branch'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-[#68717D] rounded-full hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-[#D43D3D] text-xs rounded-2xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. LHR-01"
                    required
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Lahore"
                    required
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                  Full Campus Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Lahore Central Campus"
                  required
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                  Physical Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete campus address"
                  required
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                    Helpline Contact
                  </label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="+92-42-111-887-887"
                    required
                    className="w-full px-3 py-2 text-xs font-mono bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DDE3E8] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#68717D] hover:bg-slate-100 rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingBranch ? 'Update Campus' : 'Create Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
