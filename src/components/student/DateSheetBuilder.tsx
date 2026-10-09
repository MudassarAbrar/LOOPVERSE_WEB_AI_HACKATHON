import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  User,
  HeartHandshake,
  GraduationCap,
  Building2,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { StudentProfile, Branch, Course, ExamSlot } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface DateSheetBuilderProps {
  onSavedSuccess: () => void;
}

export const DateSheetBuilder: React.FC<DateSheetBuilderProps> = ({ onSavedSuccess }) => {
  const { refreshUser } = useAuth();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [courseSlots, setCourseSlots] = useState<Record<string, ExamSlot[]>>({});
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({});
  const [isIncomplete, setIsIncomplete] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const profileRes = await api.getStudentProfile();
        setStudent(profileRes.student);
        setBranch(profileRes.branch);

        if (profileRes.student.assignedCourseIds.length < 4) {
          setIsIncomplete(true);
          setAssignedCourses(profileRes.assignedCourses);
          setLoading(false);
          return;
        }

        const slotsRes = await api.getAvailableSlots();
        setAssignedCourses(slotsRes.assignedCourses);
        setCourseSlots(slotsRes.courseSlots);
      } catch (err: any) {
        setGeneralError(err.message || 'Failed to load scheduling data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isTimeOverlapping = (startA: string, endA: string, startB: string, endB: string) => {
    return startA < endB && startB < endA;
  };

  useEffect(() => {
    const selectedList: Array<{ courseId: string; slot: ExamSlot }> = [];

    for (const [courseId, slotId] of Object.entries(selectedSlots)) {
      const slotsForCourse = courseSlots[courseId] || [];
      const foundSlot = slotsForCourse.find(s => s.id === slotId);
      if (foundSlot) {
        selectedList.push({ courseId, slot: foundSlot });
      }
    }

    let conflictFound: string | null = null;

    for (let i = 0; i < selectedList.length; i++) {
      for (let j = i + 1; j < selectedList.length; j++) {
        const itemA = selectedList[i];
        const itemB = selectedList[j];

        if (itemA.slot.examDate === itemB.slot.examDate) {
          if (
            isTimeOverlapping(
              itemA.slot.startTime,
              itemA.slot.endTime,
              itemB.slot.startTime,
              itemB.slot.endTime
            )
          ) {
            const courseA = assignedCourses.find(c => c.id === itemA.courseId)?.code || 'Course A';
            const courseB = assignedCourses.find(c => c.id === itemB.courseId)?.code || 'Course B';
            conflictFound = `Conflict Detected! ${courseA} and ${courseB} overlap on ${itemA.slot.examDate} between ${itemA.slot.startTime}-${itemA.slot.endTime} and ${itemB.slot.startTime}-${itemB.slot.endTime}.`;
            break;
          }
        }
      }
      if (conflictFound) break;
    }

    setConflictError(conflictFound);
  }, [selectedSlots, courseSlots, assignedCourses]);

  const handleSelectSlot = (courseId: string, slotId: string) => {
    setSelectedSlots(prev => ({
      ...prev,
      [courseId]: slotId
    }));
  };

  const handleSaveDateSheet = async () => {
    if (conflictError) {
      setGeneralError('Please resolve schedule conflicts before saving your date sheet.');
      return;
    }

    const missingCourses = assignedCourses.filter(c => !selectedSlots[c.id]);
    if (missingCourses.length > 0) {
      setGeneralError(
        `Please select an exam date and time slot for every assigned course. Missing: ${missingCourses.map(c => c.code).join(', ')}.`
      );
      return;
    }

    setSaving(true);
    setGeneralError(null);

    try {
      const selectionsPayload = Object.entries(selectedSlots).map(([courseId, slotId]) => ({
        courseId,
        slotId
      }));

      await api.saveDateSheet(selectionsPayload);
      await refreshUser();
      onSavedSuccess();
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to save date sheet.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isIncomplete) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 font-ui">
        <div className="p-8 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-3xl text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-[#D58A13] rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-[#08090B] dark:text-amber-200">
              Course Assignment Incomplete
            </h2>
            <p className="text-xs sm:text-sm text-[#68717D] dark:text-amber-300 max-w-lg mx-auto mt-2 leading-relaxed">
              University regulations require each candidate to be assigned <strong>between 4 and 6 courses</strong> before self-designing an exam date sheet. You currently have only {student?.assignedCourseIds?.length || 0} courses assigned.
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl text-xs text-[#68717D] max-w-md mx-auto text-left border border-[#DDE3E8]">
            <strong>Action:</strong> Please contact the examination administration or switch to Admin Controller in the top demo bar to assign more courses.
          </div>
        </div>
      </div>
    );
  }

  const selectedCount = Object.keys(selectedSlots).length;
  const allAssignedSelected = assignedCourses.length > 0 && assignedCourses.every(c => !!selectedSlots[c.id]);

  return (
    <div className="space-y-6 font-ui">
      {/* Section 09: Header with Welcome and Stepper */}
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#08090B] dark:text-white tracking-tight">
            Welcome, {student?.fullName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold text-[#68717D] dark:text-slate-400 mt-2">
            <span>Program: <strong className="text-[#08090B] dark:text-white">{student?.program}</strong></span>
            <span>·</span>
            <span>Roll No: <strong className="font-mono text-[#08090B] dark:text-white">{student?.regNumber}</strong></span>
            <span>·</span>
            <span>Branch: <strong className="text-[#08090B] dark:text-white">{branch?.name || student?.branchName}</strong></span>
          </div>
        </div>

        {/* The 3-Step Stepper from Section 09 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#DDE3E8] dark:border-slate-800">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#C8F85A]/20 dark:bg-[#C8F85A]/10 border border-[#C8F85A]/40 text-xs font-bold text-[#08090B] dark:text-[#C8F85A]">
            <div className="w-5 h-5 rounded-full bg-[#16865B] text-white flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>1. Select Branch</span>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#8ECCFF]/30 dark:bg-slate-800 border-2 border-[#8ECCFF] text-xs font-bold text-[#08090B] dark:text-white shadow-xs">
            <div className="w-5 h-5 rounded-full bg-[#8ECCFF] text-[#08090B] flex items-center justify-center font-bold">
              2
            </div>
            <span>2. Select Exam Slots</span>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F7F7F3] dark:bg-slate-800/40 border border-[#DDE3E8] dark:border-slate-800 text-xs font-semibold text-[#68717D]">
            <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 text-[#68717D] flex items-center justify-center font-bold">
              3
            </div>
            <span>3. Review & Finalize</span>
          </div>
        </div>
      </div>

      {/* Conflict Banner */}
      {conflictError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/70 border-2 border-[#D43D3D] rounded-3xl text-[#D43D3D] text-xs flex items-start gap-3 shadow-sm animate-bounce-short">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Schedule Conflict Detected — Saving Blocked</div>
            <p className="mt-0.5 leading-relaxed">{conflictError}</p>
          </div>
        </div>
      )}

      {generalError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-[#D43D3D] text-xs rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Section 09: Table of Assigned Courses */}
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE3E8] dark:border-slate-800">
          <div>
            <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white">
              Your Assigned Courses ({selectedCount} of {assignedCourses.length} selected)
            </h3>
            <p className="text-xs text-[#68717D]">
              Select one available exam shift for each course offered at {branch?.name}.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F7F3] dark:bg-slate-800/60 border-b border-[#DDE3E8] dark:border-slate-800 text-[11px] font-bold text-[#68717D] uppercase tracking-wider">
                <th className="py-3.5 px-4">Course Code</th>
                <th className="py-3.5 px-4">Course Title</th>
                <th className="py-3.5 px-4">Credit Hours</th>
                <th className="py-3.5 px-4">Select Exam Slot</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E8] dark:divide-slate-800 text-xs">
              {assignedCourses.map((course) => {
                const slots = courseSlots[course.id] || [];
                const currentSlotId = selectedSlots[course.id];
                const currentSlot = slots.find(s => s.id === currentSlotId);
                const isSelected = !!currentSlotId;

                return (
                  <tr key={course.id} className="hover:bg-[#F7F7F3]/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-mono font-bold text-[#08090B] dark:text-white">
                      {course.code}
                    </td>
                    <td className="py-4 px-4 font-bold text-[#08090B] dark:text-white">
                      {course.title}
                    </td>
                    <td className="py-4 px-4 text-[#68717D] font-bold">
                      {course.creditHours}
                    </td>
                    <td className="py-4 px-4">
                      {/* Slot selection selector */}
                      <div className="relative">
                        <select
                          value={currentSlotId || ''}
                          onChange={(e) => handleSelectSlot(course.id, e.target.value)}
                          className="w-full max-w-sm px-3 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
                        >
                          <option value="">-- Choose exam date & time shift --</option>
                          {slots.map((s) => {
                            const isFull = s.remainingSeats !== undefined && s.remainingSeats <= 0;
                            return (
                              <option key={s.id} value={s.id} disabled={isFull}>
                                {s.examDate} ({s.startTime} - {s.endTime}) {isFull ? '[FULL]' : `[${s.remainingSeats} seats left]`}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#C8F85A]/30 text-[#08090B] dark:text-[#C8F85A]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16865B]" />
                          Selected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-[#D58A13]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D58A13]" />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom CTA Button: Review Date Sheet matching Section 09 */}
        <div className="pt-4 border-t border-[#DDE3E8] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#68717D]">
            All {assignedCourses.length} assigned courses must have a slot selected before locking.
          </div>

          <button
            onClick={handleSaveDateSheet}
            disabled={saving || !allAssignedSelected || !!conflictError}
            className="w-full sm:w-auto px-6 py-3 bg-[#8ECCFF] hover:bg-[#7bc0fa] text-[#08090B] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              'Finalizing Date Sheet...'
            ) : (
              <>
                <span>Review Date Sheet →</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
