import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Download,
  HelpCircle,
  BookOpen,
  Calendar,
  Lock,
  FileText,
  AlertCircle,
  ExternalLink,
  Bot
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Course, Branch } from '../../types/index.ts';
import { jsPDF } from 'jspdf';

interface DateSheetEntry {
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  department: string;
  examDate: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface StudentDashboardProps {
  onNavigate: (tab: 'dashboard' | 'datesheet' | 'requests' | 'assistant') => void;
  onOpenNeedHelp: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onOpenNeedHelp
}) => {
  const { studentProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [dateSheetEntries, setDateSheetEntries] = useState<DateSheetEntry[]>([]);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        // Load student profile & assigned courses
        const profileRes = await api.getStudentProfile();
        setAssignedCourses(profileRes.assignedCourses || []);
        setBranch(profileRes.branch || null);

        // If date sheet is saved, load the date sheet entries
        if (studentProfile?.isDateSheetSaved) {
          try {
            const dsRes = await api.getDateSheet();
            setDateSheetEntries(dsRes.entries || []);
          } catch (e) {
            console.error('Failed to load date sheet entries for dashboard', e);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [studentProfile?.isDateSheetSaved]);

  if (!studentProfile) return null;

  const isFinalized = studentProfile.isDateSheetSaved && !studentProfile.dateSheetUnlocked;
  const needsBranch = !studentProfile.isBranchSelected || studentProfile.branchUnlocked;

  // Sort date sheet entries chronologically
  const sortedEntries = [...dateSheetEntries].sort((a, b) => {
    const dateComp = a.examDate.localeCompare(b.examDate);
    if (dateComp !== 0) return dateComp;
    return a.startTime.localeCompare(b.startTime);
  });

  const nextExam = sortedEntries.length > 0 ? sortedEntries[0] : null;

  const handleDownloadPdf = async () => {
    if (!studentProfile || dateSheetEntries.length === 0) return;
    setPdfGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // University Header
      doc.setFillColor(8, 9, 11);
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('VIRTUAL UNIVERSITY OF ADVANCED STUDIES', 105, 12, { align: 'center' });

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL EXAMINATION ROLL NO SLIP & DATE SHEET · FALL 2026', 105, 19, { align: 'center' });
      doc.text('CONTROLLER OF EXAMINATIONS', 105, 24, { align: 'center' });

      // Student and Center info box
      doc.setTextColor(8, 9, 11);
      doc.setDrawColor(221, 227, 232);
      doc.setFillColor(247, 247, 243);
      doc.roundedRect(14, 34, 182, 38, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('CANDIDATE DETAILS', 18, 41);
      doc.text('EXAM VENUE DETAILS', 110, 41);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Student Name: ${studentProfile.fullName}`, 18, 48);
      doc.text(`Registration No: ${studentProfile.regNumber}`, 18, 54);
      doc.text(`Program / Degree: ${studentProfile.program}`, 18, 60);
      doc.text(`CNIC / B-Form: ${studentProfile.cnic}`, 18, 66);

      if (branch) {
        doc.text(`Campus: ${branch.name} (${branch.code})`, 110, 48);
        doc.text(`City: ${branch.city}`, 110, 54);
        doc.text(`Venue Address: ${branch.address.substring(0, 40)}`, 110, 60);
        doc.text(`Contact: ${branch.contactNumber}`, 110, 66);
      }

      // Timetable Table Header
      let y = 80;
      doc.setFillColor(8, 9, 11);
      doc.rect(14, y, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('COURSE CODE', 18, y + 5.5);
      doc.text('COURSE TITLE', 40, y + 5.5);
      doc.text('DATE', 110, y + 5.5);
      doc.text('DAY', 140, y + 5.5);
      doc.text('SESSION TIME', 170, y + 5.5);

      y += 8;
      doc.setTextColor(8, 9, 11);

      sortedEntries.forEach((row, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(247, 247, 243);
          doc.rect(14, y, 182, 7.5, 'F');
        }
        doc.setFont('helvetica', 'bold');
        doc.text(row.courseCode, 18, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(row.courseTitle.substring(0, 38), 40, y + 5);
        doc.text(row.examDate, 110, y + 5);
        doc.text(row.day, 140, y + 5);
        doc.text(`${row.startTime} - ${row.endTime}`, 170, y + 5);
        y += 7.5;
      });

      // Instructions
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('INSTRUCTIONS FOR THE CANDIDATE:', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('1. Candidates must arrive at the examination hall at least 30 minutes prior to scheduled start time.', 14, y);
      y += 4;
      doc.text('2. Original CNIC / B-Form and this printed Roll Number Slip are strictly mandatory for entry.', 14, y);
      y += 4;
      doc.text('3. Mobile phones, smartwatches, and programmable devices are strictly prohibited inside the hall.', 14, y);
      y += 4;
      doc.text('4. This timetable was customized and finalized by the student under self-service date sheet regulations.', 14, y);

      // Sign-off
      y += 16;
      doc.setFont('helvetica', 'bold');
      doc.text('Controller of Examinations', 150, y);
      doc.setFont('helvetica', 'normal');
      doc.text('Virtual University System', 150, y + 4);

      doc.save(`ExamSlot_DateSheet_${studentProfile.regNumber}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#68717D] dark:text-slate-400 font-medium">Loading your student dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-ui">
      {/* 1. HERO BANNER: Personalized Student Overview */}
      <div className="bg-[#08090B] dark:bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle decorative glow & ambient light */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8ECCFF]/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#C8F85A]/15 rounded-full blur-3xl pointer-events-none -mb-28" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Welcome back, {studentProfile.fullName}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300 font-mono">
              <span className="text-white font-bold">{studentProfile.regNumber}</span>
              <span className="text-slate-600">·</span>
              <span className="font-ui text-slate-300">{studentProfile.program}</span>
            </div>
          </div>

          {/* Status Badge & Quick Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isFinalized ? (
              <div className="px-4 py-2.5 rounded-2xl bg-[#C8F85A]/15 border border-[#C8F85A]/40 text-[#C8F85A] flex items-center gap-2 text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#C8F85A] shrink-0" />
                <span>Date Sheet Locked & Finalized</span>
              </div>
            ) : needsBranch ? (
              <button
                onClick={() => onNavigate('datesheet')}
                className="px-5 py-2.5 rounded-2xl bg-[#C8F85A] text-[#08090B] font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-[#bbf048] transition active:scale-95"
              >
                <span>Select Campus Branch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate('datesheet')}
                className="px-5 py-2.5 rounded-2xl bg-[#C8F85A] text-[#08090B] font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:bg-[#bbf048] transition active:scale-95"
              >
                <span>Build Exam Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {isFinalized && (
              <button
                onClick={() => onNavigate('datesheet')}
                className="px-5 py-2.5 rounded-2xl bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
              >
                <FileText className="w-3.5 h-3.5 text-[#08090B]" />
                <span>View Official Roll No Slip</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('assistant')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/15 transition active:scale-95"
            >
              <Bot className="w-3.5 h-3.5 text-[#C8F85A]" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Courses */}
        <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#68717D] dark:text-slate-400">Exam Courses</span>
            <div className="w-8 h-8 rounded-xl bg-[#D9ECF8] dark:bg-slate-800 text-[#08090B] dark:text-[#8ECCFF] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-bold text-2xl text-[#08090B] dark:text-white">
            {assignedCourses.length}
          </div>
          <p className="text-[11px] text-[#68717D] dark:text-slate-400">
            {assignedCourses.reduce((sum, c) => sum + (c.creditHours || 3), 0)} Total Credit Hours
          </p>
        </div>

        {/* Card 2: Campus Branch */}
        <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#68717D] dark:text-slate-400">Exam Center</span>
            <div className="w-8 h-8 rounded-xl bg-[#D9ECF8] dark:bg-slate-800 text-[#08090B] dark:text-[#8ECCFF] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-bold text-lg text-[#08090B] dark:text-white truncate">
            {branch ? branch.city : 'Not Chosen'}
          </div>
          <p className="text-[11px] text-[#68717D] dark:text-slate-400 truncate">
            {branch ? branch.name : 'Selection pending'}
          </p>
        </div>

        {/* Card 3: Date Sheet Status */}
        <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#68717D] dark:text-slate-400">Schedule Status</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isFinalized
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
            }`}>
              {isFinalized ? <Lock className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
          <div className="font-display font-bold text-lg text-[#08090B] dark:text-white">
            {isFinalized ? 'Confirmed' : 'Pending'}
          </div>
          <p className="text-[11px] text-[#68717D] dark:text-slate-400">
            {isFinalized ? '100% Papers Scheduled' : 'Action Required'}
          </p>
        </div>

        {/* Card 4: Roll No Slip */}
        <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#68717D] dark:text-slate-400">Roll No Slip</span>
            <div className="w-8 h-8 rounded-xl bg-[#D9ECF8] dark:bg-slate-800 text-[#08090B] dark:text-[#8ECCFF] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-bold text-lg text-[#08090B] dark:text-white">
            {isFinalized ? 'Ready' : 'Locked'}
          </div>
          <p className="text-[11px] text-[#68717D] dark:text-slate-400">
            {isFinalized ? 'PDF & Print Available' : 'Requires finalization'}
          </p>
        </div>
      </div>

      {/* 3. SPOTLIGHT: NEXT UPCOMING EXAM or SCHEDULE PROMPT */}
      {isFinalized && nextExam ? (
        <div className="bg-gradient-to-r from-[#D9ECF8] via-[#E8F3FA] to-[#F7F7F3] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-[#8ECCFF]/40 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#08090B] dark:bg-[#C8F85A] text-white dark:text-[#08090B] rounded-full text-xs font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Next Scheduled Examination Paper</span>
              </div>

              <div className="space-y-1">
                <h3 className="font-display font-bold text-xl text-[#08090B] dark:text-white">
                  {nextExam.courseCode}: {nextExam.courseTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#68717D] dark:text-slate-300">
                  <span className="flex items-center gap-1 font-semibold text-[#08090B] dark:text-white">
                    <CalendarDays className="w-3.5 h-3.5 text-[#16865B]" />
                    {nextExam.day}, {nextExam.examDate}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-semibold text-[#08090B] dark:text-white">
                    <Clock className="w-3.5 h-3.5 text-[#16865B]" />
                    {nextExam.startTime} - {nextExam.endTime}
                  </span>
                  {branch && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {branch.name} ({branch.city})
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleDownloadPdf}
                disabled={pdfGenerating}
                className="px-4 py-2.5 bg-[#08090B] dark:bg-[#C8F85A] text-white dark:text-[#08090B] rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm hover:opacity-90 transition active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{pdfGenerating ? 'Generating...' : 'Download Slip PDF'}</span>
              </button>

              <button
                onClick={() => onNavigate('datesheet')}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 text-[#08090B] dark:text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition"
              >
                <span>View Slip</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : !isFinalized ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-[#08090B] dark:text-white">
                Examination Date Sheet Not Yet Finalized
              </h3>
              <p className="text-xs text-[#68717D] dark:text-slate-300 max-w-xl">
                You have {assignedCourses.length} assigned courses waiting for date and time slot selection. Seat availability is first-come, first-served.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('datesheet')}
            className="px-6 py-3 bg-[#08090B] dark:bg-[#C8F85A] text-white dark:text-[#08090B] rounded-2xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition shrink-0 active:scale-95"
          >
            <span>Proceed to Date Sheet</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      {/* 4. EXAMINATION SCHEDULE TABLE or ASSIGNED COURSES */}
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DDE3E8] dark:border-slate-800">
          <div>
            <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white">
              {isFinalized ? 'Your Confirmed Examination Timetable' : 'Your Registered Courses (Fall 2026)'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {isFinalized && (
              <button
                onClick={() => onNavigate('datesheet')}
                className="text-xs font-bold text-[#08090B] dark:text-[#C8F85A] hover:underline flex items-center gap-1"
              >
                <span>Full Roll No Slip</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {isFinalized && sortedEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DDE3E8] dark:border-slate-800 text-[#68717D] dark:text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Date & Day</th>
                  <th className="py-3 px-3">Time Window</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE3E8]/70 dark:divide-slate-800">
                {sortedEntries.map((item, idx) => (
                  <tr
                    key={item.courseCode}
                    className="hover:bg-[#F7F7F3] dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-[#08090B] dark:text-white">
                      {item.courseCode}
                    </td>
                    <td className="py-3.5 px-3 text-[#08090B] dark:text-slate-200 font-medium">
                      {item.courseTitle}
                      <span className="block text-[11px] text-[#68717D] dark:text-slate-400 font-normal">
                        {item.department} · {item.creditHours} Cr. Hrs
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-[#08090B] dark:text-white">
                        {item.examDate}
                      </div>
                      <div className="text-[11px] text-[#68717D] dark:text-slate-400">
                        {item.day}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[#08090B] dark:text-slate-200">
                      {item.startTime} - {item.endTime}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-[#16865B]" />
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DDE3E8] dark:border-slate-800 text-[#68717D] dark:text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Course Title</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 text-center">Credit Hours</th>
                  <th className="py-3 px-3 text-right">Scheduling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE3E8]/70 dark:divide-slate-800">
                {assignedCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F7F3] dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-[#08090B] dark:text-white">
                      {c.code}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#08090B] dark:text-white">
                      {c.title}
                    </td>
                    <td className="py-3 px-3 text-[#68717D] dark:text-slate-400">
                      {c.department}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-[#08090B] dark:text-slate-300">
                      {c.creditHours}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                        Awaiting Slot
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. ESSENTIAL EXAMINATION RULES & GUIDELINES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#08090B] dark:text-white font-display font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-[#16865B]" />
            <h4>Mandatory Examination Regulations</h4>
          </div>

          <ul className="space-y-2.5 text-xs text-[#68717D] dark:text-slate-300 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] mt-1.5 shrink-0" />
              <span>
                <strong>Original CNIC / B-Form:</strong> Entry into the examination hall is strictly prohibited without authentic government photo identification and your printed Roll No Slip.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] mt-1.5 shrink-0" />
              <span>
                <strong>Reporting Time:</strong> Arrive at your allocated campus branch at least 30 minutes before exam commencement.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] mt-1.5 shrink-0" />
              <span>
                <strong>Electronic Gadgets Ban:</strong> Mobile phones, smartwatches, digital pens, and unauthorized materials are strictly forbidden inside the hall.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#08090B] dark:text-white font-display font-bold text-base">
              <HelpCircle className="w-5 h-5 text-[#8ECCFF]" />
              <h4>Need to Change Branch or Schedule?</h4>
            </div>

            <p className="text-xs text-[#68717D] dark:text-slate-300 leading-relaxed">
              Once finalized, student date sheets and examination centers are locked in the university system. If you have a verified academic clash, medical emergency, or relocation, submit an official change request for administrative review.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onOpenNeedHelp}
              className="px-4 py-2.5 bg-[#D9ECF8] hover:bg-[#8ECCFF] text-[#08090B] rounded-2xl text-xs font-bold flex items-center gap-2 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Submit Change Request</span>
            </button>

            <button
              onClick={() => onNavigate('requests')}
              className="px-4 py-2.5 bg-[#F7F7F3] dark:bg-slate-800 hover:bg-slate-200 text-[#08090B] dark:text-slate-200 rounded-2xl text-xs font-bold transition"
            >
              <span>View My Requests</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
