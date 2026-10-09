import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { ExamSlot, Course } from '../../types/index.ts';
import { Pagination } from '../common/Pagination.tsx';

export const ExamScheduleManagement: React.FC = () => {
  const [slots, setSlots] = useState<ExamSlot[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ExamSlot | null>(null);
  const [formData, setFormData] = useState({
    courseId: '',
    examDate: '2026-11-15',
    startTime: '09:00',
    endTime: '12:00',
    capacity: 30
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSlots = async (page = currentPage, query = search, crs = courseFilter) => {
    try {
      setLoading(true);
      const res = await api.getSlots(page, pageSize, query, crs);
      setSlots(res.data);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
      setCurrentPage(res.pagination.currentPage);
    } catch (err: any) {
      console.error(err);
      setAlertMessage({ type: 'error', text: err.message || 'Failed to fetch exam slots.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await api.getCourses(1, 100);
        setCourses(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    fetchSlots(1, search, courseFilter);
  }, [search, courseFilter, pageSize]);

  const handleOpenCreate = () => {
    setEditingSlot(null);
    setFormData({
      courseId: courses[0]?.id || '',
      examDate: '2026-11-15',
      startTime: '09:00',
      endTime: '12:00',
      capacity: 30
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (slot: ExamSlot) => {
    setEditingSlot(slot);
    setFormData({
      courseId: slot.courseId,
      examDate: slot.examDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.endTime <= formData.startTime) {
      setFormError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingSlot) {
        await api.updateSlot(editingSlot.id, formData);
        setAlertMessage({ type: 'success', text: 'Exam slot updated successfully.' });
      } else {
        await api.createSlot(formData);
        setAlertMessage({ type: 'success', text: 'New exam schedule slot published successfully.' });
      }
      setModalOpen(false);
      fetchSlots(currentPage, search, courseFilter);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save exam slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slot: ExamSlot) => {
    if (!window.confirm(`Delete exam slot for ${slot.courseCode} on ${slot.examDate}?`)) {
      return;
    }

    try {
      await api.deleteSlot(slot.id);
      setAlertMessage({ type: 'success', text: 'Exam slot removed.' });
      fetchSlots(currentPage, search, courseFilter);
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Cannot delete slot.' });
    }
  };

  return (
    <div className="space-y-4 font-ui">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#08090B] dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#16865B] dark:text-[#C8F85A]" />
            Exam Schedule Management
          </h2>
          <p className="text-xs text-[#68717D] dark:text-slate-400">
            Publish multiple examination dates and time shifts per course with seat capacities.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Exam Slot</span>
        </button>
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
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16865B]" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#D43D3D]" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="p-1 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
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
            placeholder="Search by course code, title or date..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label htmlFor="courseFilterSelect" className="text-xs text-[#68717D]">Filter Course:</label>
          <select
            id="courseFilterSelect"
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter schedule by course"
            className="py-1.5 px-3 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#68717D]">
            No exam slots found.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F7F3] dark:bg-slate-800/60 border-b border-[#DDE3E8] dark:border-slate-800 text-[11px] font-bold text-[#68717D] dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Exam Date</th>
                    <th className="py-3.5 px-4">Time Shift</th>
                    <th className="py-3.5 px-4">Seat Capacity (Bonus)</th>
                    <th className="py-3.5 px-4">Bookings</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3E8] dark:divide-slate-800 text-xs">
                  {slots.map((s) => {
                    const booked = s.bookedSeats || 0;
                    const remaining = Math.max(0, s.capacity - booked);

                    return (
                      <tr key={s.id} className="hover:bg-[#F7F7F3]/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[#08090B] dark:text-white mr-2">
                            {s.courseCode}
                          </span>
                          <span className="font-semibold text-[#08090B] dark:text-slate-200">
                            {s.courseTitle}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#08090B] dark:text-slate-300">
                          {s.examDate}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#68717D]">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#68717D]" />
                            {s.startTime} - {s.endTime}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#08090B] dark:text-slate-200">
                          {s.capacity} seats
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#08090B] dark:text-white">
                              {booked} / {s.capacity}
                            </span>
                            {remaining === 0 ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-[#D43D3D] rounded-full">
                                FULL
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#16865B] font-bold">
                                ({remaining} left)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 text-[#68717D] hover:text-[#08090B] dark:hover:text-white rounded-xl hover:bg-[#D9ECF8]"
                              title="Edit Slot"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-1.5 text-[#68717D] hover:text-[#D43D3D] rounded-xl hover:bg-rose-50"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-[#DDE3E8] dark:divide-slate-800">
              {slots.map((s) => (
                <div key={s.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#08090B] dark:text-white">
                        {s.courseCode}
                      </span>
                      <h4 className="font-bold text-sm text-[#08090B] dark:text-white">
                        {s.courseTitle}
                      </h4>
                    </div>
                  </div>
                  <div className="text-xs text-[#68717D] flex flex-wrap gap-3">
                    <span>Date: {s.examDate}</span>
                    <span>Time: {s.startTime} - {s.endTime}</span>
                    <span>Bookings: {s.bookedSeats || 0} / {s.capacity}</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[#DDE3E8] dark:border-slate-800">
                    <button onClick={() => handleOpenEdit(s)} className="px-3 py-1 bg-[#F7F7F3] text-xs font-semibold rounded-xl">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(s)} className="px-3 py-1 bg-rose-50 text-[#D43D3D] text-xs font-semibold rounded-xl">
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
              onPageChange={(page) => fetchSlots(page, search, courseFilter)}
              onPageSizeChange={(size) => setPageSize(size)}
            />
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DDE3E8] dark:border-slate-800">
              <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#16865B]" />
                {editingSlot ? 'Edit Exam Slot' : 'Publish Exam Slot'}
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
              <div>
                <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                  Course
                </label>
                <select
                  value={formData.courseId}
                  disabled={!!editingSlot}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                  Seat Capacity (Bonus Feature)
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                />
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
                  {submitting ? 'Saving...' : editingSlot ? 'Update Slot' : 'Publish Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
