import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { Course } from '../../types/index.ts';
import { Pagination } from '../common/Pagination.tsx';

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    creditHours: 3,
    department: 'Computer Science',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCourses = async (page = currentPage, query = search, dept = departmentFilter) => {
    try {
      setLoading(true);
      const res = await api.getCourses(page, pageSize, query, dept);
      setCourses(res.data);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
      setCurrentPage(res.pagination.currentPage);
    } catch (err: any) {
      console.error(err);
      setAlertMessage({ type: 'error', text: err.message || 'Failed to load courses.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(1, search, departmentFilter);
  }, [search, departmentFilter, pageSize]);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      title: '',
      creditHours: 3,
      department: 'Computer Science',
      status: 'ACTIVE'
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      title: course.title,
      creditHours: course.creditHours,
      department: course.department,
      status: course.status
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, formData);
        setAlertMessage({ type: 'success', text: `Course '${formData.code}' updated successfully.` });
      } else {
        await api.createCourse(formData);
        setAlertMessage({ type: 'success', text: `Course '${formData.code}' created successfully.` });
      }
      setModalOpen(false);
      fetchCourses(currentPage, search, departmentFilter);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`Are you sure you want to delete course '${course.code}: ${course.title}'?`)) {
      return;
    }

    try {
      await api.deleteCourse(course.id);
      setAlertMessage({ type: 'success', text: `Course ${course.code} removed successfully.` });
      fetchCourses(currentPage, search, departmentFilter);
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Cannot delete course.' });
    }
  };

  return (
    <div className="space-y-4 font-ui">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#08090B] dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#16865B] dark:text-[#C8F85A]" />
            University Course Catalog
          </h2>
          <p className="text-xs text-[#68717D] dark:text-slate-400">
            Define curriculum subjects. Each student is assigned between 4 and 6 courses by the administration.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Course</span>
        </button>
      </div>

      {/* Alert Message */}
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
            placeholder="Search code, title or department..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label htmlFor="deptFilterSelect" className="text-xs text-[#68717D] dark:text-slate-400">Department:</label>
          <select
            id="deptFilterSelect"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter courses by department"
            className="py-1.5 px-3 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Basic Sciences">Basic Sciences</option>
            <option value="Humanities">Humanities</option>
            <option value="Management Sciences">Management Sciences</option>
          </select>
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#68717D] dark:text-slate-400">
            No courses found matching your query.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F7F3] dark:bg-slate-800/60 border-b border-[#DDE3E8] dark:border-slate-800 text-[11px] font-bold text-[#68717D] dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Course Code</th>
                    <th className="py-3.5 px-4">Title</th>
                    <th className="py-3.5 px-4">Credits</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Exam Slots</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3E8] dark:divide-slate-800 text-xs">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F7F7F3]/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#08090B] dark:text-slate-200">
                        {c.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#08090B] dark:text-white">
                        {c.title}
                      </td>
                      <td className="py-3.5 px-4 text-[#68717D] dark:text-slate-300">
                        {c.creditHours} CH
                      </td>
                      <td className="py-3.5 px-4 text-[#68717D]">
                        {c.department}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#08090B] dark:text-slate-200">
                        {c.slotCount || 0} slots
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-[#16865B] dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-[#68717D]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-[#16865B]' : 'bg-[#68717D]'}`} />
                          {c.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-[#68717D] hover:text-[#08090B] dark:hover:text-white rounded-xl hover:bg-[#D9ECF8] transition"
                            title="Edit Course"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-[#68717D] hover:text-[#D43D3D] rounded-xl hover:bg-rose-50 transition"
                            title="Delete Course"
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

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[#DDE3E8] dark:divide-slate-800">
              {courses.map((c) => (
                <div key={c.id} className="p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#08090B] dark:text-slate-200">
                        {c.code}
                      </span>
                      <h4 className="font-bold text-sm text-[#08090B] dark:text-white">
                        {c.title}
                      </h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D9ECF8] text-[#08090B] font-bold">
                      {c.creditHours} CH
                    </span>
                  </div>
                  <div className="text-xs text-[#68717D] flex items-center justify-between pt-1">
                    <span>{c.department}</span>
                    <span className="font-bold text-[#16865B]">{c.slotCount || 0} exam slots</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[#DDE3E8] dark:border-slate-800">
                    <button onClick={() => handleOpenEdit(c)} className="px-3 py-1 bg-[#F7F7F3] text-xs font-semibold rounded-xl">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(c)} className="px-3 py-1 bg-rose-50 text-[#D43D3D] text-xs font-semibold rounded-xl">
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
              onPageChange={(page) => fetchCourses(page, search, departmentFilter)}
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
                <BookOpen className="w-5 h-5 text-[#16865B]" />
                {editingCourse ? 'Edit Course' : 'Create Course'}
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
                    Course Code (Unique)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CS101"
                    required
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                    Credit Hours
                  </label>
                  <select
                    value={formData.creditHours}
                    onChange={(e) => setFormData({ ...formData, creditHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                  >
                    <option value={1}>1 Credit Hour</option>
                    <option value={2}>2 Credit Hours</option>
                    <option value={3}>3 Credit Hours</option>
                    <option value={4}>4 Credit Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Data Structures and Algorithms"
                  required
                  className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Basic Sciences">Basic Sciences</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Management Sciences">Management Sciences</option>
                  </select>
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
                  {submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
