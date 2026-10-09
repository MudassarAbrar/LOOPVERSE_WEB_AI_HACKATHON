import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Eye,
  Trash2,
  Send,
  AlertTriangle,
  CheckCircle2,
  X,
  Mail,
  User,
  GraduationCap,
  HeartHandshake
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { StudentProfile } from '../../types/index.ts';
import { Pagination } from '../common/Pagination.tsx';

interface StudentManagementProps {
  onAssignCoursesClick: (student: StudentProfile) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ onAssignCoursesClick }) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalStudent, setViewModalStudent] = useState<StudentProfile | null>(null);

  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'parent' | 'academic'>('personal');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cnic: '',
    dob: '2004-01-15',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    address: '',
    photoUrl: '',
    fatherName: '',
    parentCnic: '',
    parentOccupation: '',
    parentPhone: '',
    emergencyContact: '',
    regNumber: '',
    program: 'BS Computer Science',
    semester: 1,
    sessionBatch: 'Fall 2026',
    prevQual: 'HSSC / FSc Pre-Engineering',
    prevInstitute: 'Punjab College',
    cgpa: 3.5
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string; link?: string } | null>(null);

  const fetchStudents = async (page = currentPage, query = search) => {
    try {
      setLoading(true);
      const res = await api.getStudents(page, pageSize, query);
      setStudents(res.data);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
      setCurrentPage(res.pagination.currentPage);
    } catch (err: any) {
      console.error(err);
      setAlertMessage({ type: 'error', text: err.message || 'Failed to fetch students.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(1, search);
  }, [search, pageSize]);

  const handleOpenCreate = () => {
    setActiveFormTab('personal');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      cnic: '',
      dob: '2004-01-15',
      gender: 'Male',
      address: '',
      photoUrl: '',
      fatherName: '',
      parentCnic: '',
      parentOccupation: '',
      parentPhone: '',
      emergencyContact: '',
      regNumber: `BC${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
      program: 'BS Computer Science',
      semester: 1,
      sessionBatch: 'Fall 2026',
      prevQual: 'HSSC / FSc Pre-Engineering',
      prevInstitute: 'Punjab Group of Colleges',
      cgpa: 3.5
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await api.createStudent(formData);
      setAlertMessage({
        type: 'success',
        text: `Student ${formData.fullName} created. Onboarding email dispatched with 24-hr token link!`,
        link: `/set-password?token=${res.setupToken}`
      });
      setModalOpen(false);
      fetchStudents(currentPage, search);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvite = async (student: StudentProfile) => {
    try {
      const res = await api.resendStudentInvite(student.id);
      setAlertMessage({
        type: 'success',
        text: `Fresh onboarding email dispatched to ${student.email}.`,
        link: `/set-password?token=${res.token}`
      });
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Failed to resend invite.' });
    }
  };

  const handleDelete = async (student: StudentProfile) => {
    if (!window.confirm(`Are you sure you want to delete student '${student.fullName}' (${student.regNumber})? This will delete all course selections and credentials.`)) {
      return;
    }

    try {
      await api.deleteStudent(student.id);
      setAlertMessage({ type: 'success', text: `Student record deleted successfully.` });
      fetchStudents(currentPage, search);
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Cannot delete student.' });
    }
  };

  return (
    <div className="space-y-4 font-ui">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#08090B] dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#16865B] dark:text-[#C8F85A]" />
            Student Administration & Onboarding
          </h2>
          <p className="text-xs text-[#68717D] dark:text-slate-400">
            Enrolls candidates across 3 information groups and triggers automated single-use password creation links.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Student</span>
        </button>
      </div>

      {/* Alert */}
      {alertMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-[#16865B] dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-[#D43D3D]'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16865B]" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#D43D3D]" />
            )}
            <span>{alertMessage.text}</span>
            {alertMessage.link && (
              <a
                href={alertMessage.link}
                className="font-mono text-[#08090B] dark:text-[#C8F85A] underline font-bold ml-1 hover:opacity-80"
              >
                [Open Setup Link directly]
              </a>
            )}
          </div>
          <button onClick={() => setAlertMessage(null)} className="p-1 hover:opacity-70 self-end sm:self-auto">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#68717D]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search name, reg number, email or CNIC..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
          />
        </div>
        <div className="text-xs text-[#68717D] dark:text-slate-400 hidden sm:block">
          Total Enrolled: <span className="font-bold text-[#08090B] dark:text-white">{totalItems}</span>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#68717D] dark:text-slate-400">
            No students found.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F7F7F3] dark:bg-slate-800/60 border-b border-[#DDE3E8] dark:border-slate-800 text-[11px] font-bold text-[#68717D] dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Roll No</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Program</th>
                    <th className="py-3.5 px-4">Courses (4-6)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3E8] dark:divide-slate-800 text-xs">
                  {students.map((s) => {
                    const courseCount = s.assignedCourseIds?.length || 0;
                    const isCourseIncomplete = courseCount < 4;

                    return (
                      <tr key={s.id} className="hover:bg-[#F7F7F3]/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#08090B] dark:text-slate-200">
                          {s.regNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#08090B] dark:text-white">{s.fullName}</div>
                          <div className="text-[11px] text-[#68717D]">{s.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#68717D] dark:text-slate-300">
                          {s.branchName || 'Not Selected'}
                        </td>
                        <td className="py-3.5 px-4 text-[#68717D]">
                          <div>{s.program}</div>
                          <div className="text-[10px] text-[#68717D]">Sem {s.semester}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => onAssignCoursesClick(s)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition ${
                              isCourseIncomplete
                                ? 'bg-rose-100 text-[#D43D3D] hover:bg-rose-200'
                                : 'bg-[#D9ECF8] text-[#08090B] hover:bg-[#8ECCFF]'
                            }`}
                            title="Click to manage course assignments"
                          >
                            <span>{courseCount} courses</span>
                            {isCourseIncomplete && (
                              <span className="text-[10px] text-[#D43D3D]">
                                (Incomplete)
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              s.isDateSheetSaved
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-[#16865B] dark:text-emerald-300'
                                : 'bg-amber-50 dark:bg-amber-950 text-[#D58A13]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                s.isDateSheetSaved ? 'bg-[#16865B]' : 'bg-[#D58A13]'
                              }`}
                            />
                            {s.isDateSheetSaved ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewModalStudent(s)}
                              className="p-1.5 text-[#68717D] hover:text-[#08090B] dark:hover:text-white rounded-xl hover:bg-[#D9ECF8]"
                              title="View Full Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleResendInvite(s)}
                              className="p-1.5 text-[#68717D] hover:text-[#16865B] rounded-xl hover:bg-emerald-50"
                              title="Resend Setup Email"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-1.5 text-[#68717D] hover:text-[#D43D3D] rounded-xl hover:bg-rose-50"
                              title="Delete Student"
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
              {students.map((s) => (
                <div key={s.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#08090B] dark:text-slate-200">
                        {s.regNumber}
                      </span>
                      <h4 className="font-bold text-sm text-[#08090B] dark:text-white">
                        {s.fullName}
                      </h4>
                      <div className="text-xs text-[#68717D]">{s.email}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9ECF8] text-[#08090B]">
                      {s.isDateSheetSaved ? 'Completed' : 'Pending'}
                    </span>
                  </div>

                  <div className="text-xs text-[#68717D] space-y-1 pt-1">
                    <div>{s.program} · Branch: {s.branchName || 'Not chosen'}</div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => onAssignCoursesClick(s)}
                        className="text-xs font-bold text-[#16865B] dark:text-[#C8F85A] underline"
                      >
                        {s.assignedCourseIds?.length || 0} Courses Assigned
                      </button>
                      <button
                        onClick={() => handleResendInvite(s)}
                        className="text-xs text-[#68717D] hover:text-[#16865B] flex items-center gap-1 font-semibold"
                      >
                        <Send className="w-3 h-3" /> Resend Setup
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(page) => fetchStudents(page, search)}
              onPageSizeChange={(size) => setPageSize(size)}
            />
          </>
        )}
      </div>

      {/* Onboard New Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#DDE3E8] dark:border-slate-800">
              <div>
                <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#16865B]" />
                  Onboard Candidate Student Record
                </h3>
                <p className="text-xs text-[#68717D]">
                  Captures all mandatory fields across 3 official categories.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 text-[#68717D] rounded-full hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-3 border-b border-[#DDE3E8] dark:border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveFormTab('personal')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                  activeFormTab === 'personal'
                    ? 'border-[#08090B] dark:border-[#C8F85A] text-[#08090B] dark:text-[#C8F85A]'
                    : 'border-transparent text-[#68717D] hover:text-[#08090B]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                1. Personal Details
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('parent')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                  activeFormTab === 'parent'
                    ? 'border-[#08090B] dark:border-[#C8F85A] text-[#08090B] dark:text-[#C8F85A]'
                    : 'border-transparent text-[#68717D] hover:text-[#08090B]'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                2. Parent / Guardian
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('academic')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                  activeFormTab === 'academic'
                    ? 'border-[#08090B] dark:border-[#C8F85A] text-[#08090B] dark:text-[#C8F85A]'
                    : 'border-transparent text-[#68717D] hover:text-[#08090B]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                3. Academic Profile
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-[#D43D3D] text-xs rounded-2xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {activeFormTab === 'personal' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Ali Khan"
                        required
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Email (Unique)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="student@student.examslot.edu"
                        required
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+92-300-1234567"
                        required
                        className="w-full px-3 py-2 text-xs font-mono bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        CNIC or B-Form
                      </label>
                      <input
                        type="text"
                        value={formData.cnic}
                        onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                        placeholder="35202-1234567-1"
                        required
                        className="w-full px-3 py-2 text-xs font-mono bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        required
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="City, Street"
                        required
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeFormTab === 'parent' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Father / Guardian Name
                      </label>
                      <input
                        type="text"
                        value={formData.fatherName}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                        placeholder="e.g. Tariq Khan"
                        required
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Parent CNIC
                      </label>
                      <input
                        type="text"
                        value={formData.parentCnic}
                        onChange={(e) => setFormData({ ...formData, parentCnic: e.target.value })}
                        placeholder="35202-9876543-1"
                        required
                        className="w-full px-3 py-2 text-xs font-mono bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Occupation
                      </label>
                      <input
                        type="text"
                        value={formData.parentOccupation}
                        onChange={(e) => setFormData({ ...formData, parentOccupation: e.target.value })}
                        placeholder="Civil Engineer"
                        required
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Parent Phone
                      </label>
                      <input
                        type="text"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        placeholder="+92-321-9876543"
                        required
                        className="w-full px-3 py-2 text-xs font-mono bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        placeholder="+92-42-35889900"
                        required
                        className="w-full px-3 py-2 text-xs font-mono bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeFormTab === 'academic' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Registration Number (Unique)
                      </label>
                      <input
                        type="text"
                        value={formData.regNumber}
                        onChange={(e) => setFormData({ ...formData, regNumber: e.target.value.toUpperCase() })}
                        placeholder="e.g. BC210401890"
                        required
                        className="w-full px-3 py-2 text-xs font-mono uppercase bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Degree Program
                      </label>
                      <select
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      >
                        <option value="BS Computer Science">BS Computer Science</option>
                        <option value="BS Software Engineering">BS Software Engineering</option>
                        <option value="BS Information Technology">BS Information Technology</option>
                        <option value="BBA Management">BBA Management</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Semester
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                        required
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Batch / Session
                      </label>
                      <input
                        type="text"
                        value={formData.sessionBatch}
                        onChange={(e) => setFormData({ ...formData, sessionBatch: e.target.value })}
                        placeholder="Fall 2026"
                        required
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#08090B] dark:text-slate-200 mb-1">
                        Current CGPA
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4.00"
                        value={formData.cgpa}
                        onChange={(e) => setFormData({ ...formData, cgpa: Number(e.target.value) })}
                        required
                        className="w-full px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-[#D9ECF8]/70 border border-[#DDE3E8] rounded-2xl text-xs text-[#08090B] space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#16865B]" /> Automated Password Onboarding Link:
                </span>
                <p className="text-[11px] text-[#68717D]">
                  Saving dispatches a secure, single-use, 24-hour setup link to the student email address.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#DDE3E8] dark:border-slate-800">
                <div className="text-xs text-[#68717D]">
                  {activeFormTab === 'personal' && 'Step 1 of 3'}
                  {activeFormTab === 'parent' && 'Step 2 of 3'}
                  {activeFormTab === 'academic' && 'Step 3 of 3'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#68717D] hover:bg-slate-100 rounded-2xl"
                  >
                    Cancel
                  </button>

                  {activeFormTab !== 'academic' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'personal') setActiveFormTab('parent');
                        else if (activeFormTab === 'parent') setActiveFormTab('academic');
                      }}
                      className="px-4 py-2 bg-[#8ECCFF] text-[#08090B] rounded-2xl text-xs font-bold"
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-60"
                    >
                      {submitting ? 'Registering...' : 'Create Student & Send Invite'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Student Record Modal */}
      {viewModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE3E8] dark:border-slate-800">
              <div>
                <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white">
                  {viewModalStudent.fullName}
                </h3>
                <p className="text-xs font-mono text-[#16865B] dark:text-[#C8F85A]">
                  {viewModalStudent.regNumber} · {viewModalStudent.program}
                </p>
              </div>
              <button onClick={() => setViewModalStudent(null)} className="p-1 text-[#68717D] rounded-full hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F7F7F3] dark:bg-slate-800/60 rounded-2xl border border-[#DDE3E8] dark:border-slate-700 space-y-2 text-xs">
              <div className="font-bold text-[#08090B] dark:text-white flex items-center gap-1.5 text-sm">
                <User className="w-4 h-4 text-[#8ECCFF]" />
                Personal Information
              </div>
              <div className="grid grid-cols-2 gap-2 text-[#68717D] dark:text-slate-300">
                <div><span className="text-[#68717D]">Email:</span> {viewModalStudent.email}</div>
                <div><span className="text-[#68717D]">Phone:</span> {viewModalStudent.phone}</div>
                <div><span className="text-[#68717D]">CNIC:</span> {viewModalStudent.cnic}</div>
                <div><span className="text-[#68717D]">DOB:</span> {viewModalStudent.dob}</div>
                <div className="col-span-2"><span className="text-[#68717D]">Address:</span> {viewModalStudent.address}</div>
              </div>
            </div>

            <div className="p-4 bg-[#F7F7F3] dark:bg-slate-800/60 rounded-2xl border border-[#DDE3E8] dark:border-slate-700 space-y-2 text-xs">
              <div className="font-bold text-[#08090B] dark:text-white flex items-center gap-1.5 text-sm">
                <HeartHandshake className="w-4 h-4 text-[#C8F85A]" />
                Parent / Guardian Information
              </div>
              <div className="grid grid-cols-2 gap-2 text-[#68717D] dark:text-slate-300">
                <div><span>Father:</span> {viewModalStudent.fatherName}</div>
                <div><span>Parent CNIC:</span> {viewModalStudent.parentCnic}</div>
                <div><span>Occupation:</span> {viewModalStudent.parentOccupation}</div>
                <div><span>Contact:</span> {viewModalStudent.parentPhone}</div>
              </div>
            </div>

            <div className="p-4 bg-[#F7F7F3] dark:bg-slate-800/60 rounded-2xl border border-[#DDE3E8] dark:border-slate-700 space-y-2 text-xs">
              <div className="font-bold text-[#08090B] dark:text-white flex items-center gap-1.5 text-sm">
                <GraduationCap className="w-4 h-4 text-[#16865B]" />
                Academic Standing
              </div>
              <div className="grid grid-cols-2 gap-2 text-[#68717D] dark:text-slate-300">
                <div><span>Degree:</span> {viewModalStudent.program}</div>
                <div><span>Semester:</span> Sem {viewModalStudent.semester} ({viewModalStudent.sessionBatch})</div>
                <div><span>CGPA:</span> {viewModalStudent.cgpa}</div>
                <div><span>Prev Qual:</span> {viewModalStudent.prevQual}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewModalStudent(null)}
                className="px-4 py-2 bg-[#F7F7F3] dark:bg-slate-800 text-[#08090B] dark:text-white rounded-2xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
