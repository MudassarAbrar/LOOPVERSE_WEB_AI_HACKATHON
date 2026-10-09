import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { api } from '../../api/client.ts';

export const AdminDashboard: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { counts, branchStats, courseStats } = data;

  return (
    <div className="space-y-6">
      {/* Header Heading matching Section 08 */}
      <div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#08090B] dark:text-white tracking-tight">
          Overview
        </h1>
        <p className="text-xs sm:text-sm text-[#68717D] dark:text-slate-400 mt-1 font-ui">
          Manage your university examination system across all nationwide branches.
        </p>
      </div>

      {/* Row of 6 High-Contrast Stat Cards (matching Section 08 in Image 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Branches */}
        <div
          onClick={() => onNavigateTab('branches')}
          className="p-4 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl shadow-sm hover:border-[#8ECCFF] transition cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#D9ECF8] dark:bg-slate-800 text-[#08090B] dark:text-[#8ECCFF] flex items-center justify-center mb-2">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="font-display font-bold text-2xl text-[#08090B] dark:text-white">
            {counts.totalBranches}
          </div>
          <div className="text-[11px] font-medium text-[#68717D] dark:text-slate-400 font-ui">
            Branches
          </div>
        </div>

        {/* Courses */}
        <div
          onClick={() => onNavigateTab('courses')}
          className="p-4 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl shadow-sm hover:border-[#8ECCFF] transition cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#16865B] dark:text-emerald-400 flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="font-display font-bold text-2xl text-[#08090B] dark:text-white">
            {counts.totalCourses}
          </div>
          <div className="text-[11px] font-medium text-[#68717D] dark:text-slate-400 font-ui">
            Courses
          </div>
        </div>

        {/* Students */}
        <div
          onClick={() => onNavigateTab('students')}
          className="p-4 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl shadow-sm hover:border-[#8ECCFF] transition cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#8ECCFF]/30 dark:bg-slate-800 text-sky-600 dark:text-[#8ECCFF] flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <div className="font-display font-bold text-2xl text-[#08090B] dark:text-white">
            {counts.totalStudents}
          </div>
          <div className="text-[11px] font-medium text-[#68717D] dark:text-slate-400 font-ui">
            Students
          </div>
        </div>

        {/* Completed Date Sheets */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#C8F85A]/40 dark:bg-[#C8F85A]/20 text-[#16865B] dark:text-[#C8F85A] flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="font-display font-bold text-2xl text-[#08090B] dark:text-white">
            {counts.savedDateSheets}
          </div>
          <div className="text-[11px] font-medium text-[#68717D] dark:text-slate-400 font-ui">
            Saved Sheets
          </div>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => onNavigateTab('requests')}
          className="p-4 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl shadow-sm hover:border-amber-300 transition cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-[#D58A13] flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <div className="font-display font-bold text-2xl text-[#D58A13]">
            {counts.pendingRequests}
          </div>
          <div className="text-[11px] font-medium text-[#68717D] dark:text-slate-400 font-ui">
            Pending Reqs
          </div>
        </div>

        {/* Upcoming Slots */}
        <div
          onClick={() => onNavigateTab('schedules')}
          className="p-4 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl shadow-sm hover:border-[#8ECCFF] transition cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="font-display font-bold text-2xl text-[#08090B] dark:text-white">
            {counts.totalSlots}
          </div>
          <div className="text-[11px] font-medium text-[#68717D] dark:text-slate-400 font-ui">
            Exam Slots
          </div>
        </div>
      </div>

      {/* Signature Widgets Row (from Image 1 & Image 2 Section 08) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Signature Gradient Curve Card ("Exam Slot Selections") */}
        <div className="lg:col-span-7 gradient-accent-card rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between text-[#08090B]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-xl text-[#08090B]">
                Exam Slot Selections
              </h3>
              <p className="text-xs text-[#08090B]/70 font-ui">
                Active examination shift enrollment trend
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/70 backdrop-blur-md rounded-full text-xs font-semibold shadow-xs">
              <span>This week</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-2">
            <div className="font-display font-black text-5xl text-[#08090B] tracking-tight">
              138
            </div>
            <div className="text-xs font-semibold text-[#08090B]/80 font-ui mt-1 flex items-center gap-1">
              <span>↑ 14% higher than last examination cycle</span>
            </div>
          </div>

          {/* SVG Smooth Curve Graph from Image 1 & 2 */}
          <div className="relative pt-6 pb-2">
            <svg viewBox="0 0 500 160" className="w-full h-32 stroke-[#08090B] fill-none stroke-[2.5] overflow-visible">
              <path
                d="M 10 130 C 50 140, 70 80, 110 90 C 150 100, 170 140, 210 120 C 250 100, 270 30, 310 40 C 350 50, 370 110, 410 70 C 450 30, 480 50, 495 65"
              />
              {/* Highlight Circle Dot with "12" like in Image 1 */}
              <circle cx="210" cy="120" r="14" fill="#08090B" />
              <text x="210" y="124" textAnchor="middle" fill="#C8F85A" fontSize="11" fontWeight="bold" fontFamily="Inter">
                12
              </text>
            </svg>

            <div className="flex justify-between text-[11px] font-bold text-[#08090B]/80 pt-2 border-t border-[#08090B]/20 font-ui">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Right: Recent Change Requests Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white">
                Recent Change Requests
              </h3>
              <p className="text-xs text-[#68717D] dark:text-slate-400 font-ui">
                Student petitions for campus / timetable changes
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('requests')}
              className="text-xs font-bold text-[#16865B] dark:text-[#C8F85A] hover:underline font-ui"
            >
              View all
            </button>
          </div>

          <div className="space-y-3 font-ui text-xs">
            <div className="p-3 bg-[#F7F7F3] dark:bg-slate-800/60 rounded-2xl border border-[#DDE3E8] dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#08090B] dark:text-white">Ayesha Khan</div>
                <div className="text-[11px] text-[#68717D]">Date Sheet Change · 15 Apr 2026</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-[#D58A13] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D58A13]" />
                Pending
              </span>
            </div>

            <div className="p-3 bg-[#F7F7F3] dark:bg-slate-800/60 rounded-2xl border border-[#DDE3E8] dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#08090B] dark:text-white">Bilal Ahmed</div>
                <div className="text-[11px] text-[#68717D]">Branch Change · 14 Apr 2026</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-[#16865B] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16865B]" />
                Approved
              </span>
            </div>

            <div className="p-3 bg-[#F7F7F3] dark:bg-slate-800/60 rounded-2xl border border-[#DDE3E8] dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#08090B] dark:text-white">Sara Ali</div>
                <div className="text-[11px] text-[#68717D]">Date Sheet Change · 14 Apr 2026</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-[#D58A13] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D58A13]" />
                Pending
              </span>
            </div>

            <div className="p-3 bg-[#F7F7F3] dark:bg-slate-800/60 rounded-2xl border border-[#DDE3E8] dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#08090B] dark:text-white">Hamza Malik</div>
                <div className="text-[11px] text-[#68717D]">Date Sheet Change · 13 Apr 2026</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-[#D43D3D] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D43D3D]" />
                Rejected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics / Campus Distribution Section (from Image 1 Demographics Widget) */}
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-xl text-[#08090B] dark:text-white">
              Campus Distribution
            </h3>
            <p className="text-xs text-[#68717D] dark:text-slate-400 font-ui">
              Student enrollment and seat allocations across nationwide campuses
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-full text-xs font-semibold font-ui">
            <span>This month</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#68717D]" />
          </div>
        </div>

        {/* Visual Rounded Bars matching Demographics in Image 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end pt-4 pb-2">
          {branchStats.map((br: any, i: number) => {
            const isLime = i % 2 === 1;
            const height = Math.max(28, (br.studentCount || 1) * 35);

            return (
              <div key={br.code} className="flex flex-col items-center gap-3">
                <div className="w-full flex items-end justify-center h-40 bg-[#F7F7F3] dark:bg-slate-800/40 rounded-2xl p-2">
                  <div
                    className={`w-16 rounded-xl transition-all duration-500 shadow-sm ${
                      isLime ? 'bg-[#C8F85A]' : 'bg-[#8ECCFF]'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                </div>
                <div className="text-center font-ui">
                  <div className="font-bold text-xs text-[#08090B] dark:text-white">
                    {br.name.split(' ')[0]}
                  </div>
                  <div className="text-[11px] text-[#68717D]">
                    {br.studentCount} students
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
