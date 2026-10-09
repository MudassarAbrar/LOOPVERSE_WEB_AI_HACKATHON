import React, { useState, useEffect } from 'react';
import {
  Layers,
  Info,
  Lock,
  AlertTriangle,
  X
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { StudentProfile, Course } from '../../types/index.ts';

interface CourseAssignmentModalProps {
  student: StudentProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CourseAssignmentModal: React.FC<CourseAssignmentModalProps> = ({
  student,
  onClose,
  onSuccess
}) => {
  if (!student) return null;

  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    student.assignedCourseIds || []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = student.isDateSheetSaved && !student.dateSheetUnlocked;

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const res = await api.getCourses(1, 100);
        setAllCourses(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load course list.');
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const handleToggleCourse = (courseId: string) => {
    if (isLocked) return;

    if (selectedCourseIds.includes(courseId)) {
      setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
    } else {
      if (selectedCourseIds.length >= 6) {
        setError('Maximum 6 courses limit reached.');
        return;
      }
      setSelectedCourseIds(prev => [...prev, courseId]);
      setError(null);
    }
  };

  const handleSave = async () => {
    if (selectedCourseIds.length < 4 || selectedCourseIds.length > 6) {
      setError(`Course Assignment Rule Violation: Must select between 4 and 6 courses (currently ${selectedCourseIds.length}).`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.assignCourses(student.id, selectedCourseIds);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save course assignments.');
    } finally {
      setSaving(false);
    }
  };

  const count = selectedCourseIds.length;
  const isRuleSatisfied = count >= 4 && count <= 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in font-ui">
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE3E8] dark:border-slate-800">
          <div>
            <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#16865B]" />
              Course Enrollment Assignment
            </h3>
            <p className="text-xs text-[#68717D]">
              Candidate: <span className="font-bold text-[#08090B] dark:text-white">{student.fullName}</span> ({student.regNumber})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-[#68717D] rounded-full hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 to 6 Rule Banner */}
        <div className="mt-3 p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 bg-[#F7F7F3] dark:bg-slate-800/60 border-[#DDE3E8] dark:border-slate-700">
          <div className="space-y-0.5">
            <div className="font-bold text-[#08090B] dark:text-white flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#8ECCFF]" />
              Mandatory 4 to 6 Courses Rule:
            </div>
            <div className="text-[#68717D] text-[11px]">
              Every student must have at least 4 and at most 6 assigned courses.
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isRuleSatisfied
                ? 'bg-emerald-100 text-[#16865B]'
                : 'bg-rose-100 text-[#D43D3D]'
            }`}
          >
            {count} / 6 selected
          </span>
        </div>

        {isLocked && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-[#D58A13] flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Date sheet finalized. Assignment locked unless admin approves request.</span>
          </div>
        )}

        {error && (
          <div className="mt-2 p-3 bg-rose-50 border border-rose-200 text-[#D43D3D] text-xs rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Course Catalog List */}
        <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2">
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            allCourses.map((course) => {
              const isSelected = selectedCourseIds.includes(course.id);

              return (
                <div
                  key={course.id}
                  onClick={() => !isLocked && handleToggleCourse(course.id)}
                  className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 transition cursor-pointer select-none ${
                    isLocked ? 'cursor-not-allowed opacity-75' : ''
                  } ${
                    isSelected
                      ? 'bg-[#D9ECF8]/70 dark:bg-slate-800 border-[#8ECCFF] shadow-xs'
                      : 'bg-[#F7F7F3] dark:bg-slate-800/40 border-[#DDE3E8] dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#08090B] dark:text-white">
                        {course.code}
                      </span>
                      <span className="font-bold text-[#08090B] dark:text-white">
                        {course.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#68717D]">
                      {course.department} · {course.creditHours} Credits
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isLocked}
                    onChange={() => !isLocked && handleToggleCourse(course.id)}
                    className="w-4 h-4 rounded text-[#08090B] focus:ring-[#8ECCFF] cursor-pointer"
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#DDE3E8] dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-[#68717D]">
            {count < 4
              ? `Select ${4 - count} more (min 4)`
              : count > 6
              ? `Remove ${count - 6} (max 6)`
              : 'Rule satisfied (4-6)'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#68717D] hover:bg-slate-100 rounded-2xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLocked || saving || !isRuleSatisfied}
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
