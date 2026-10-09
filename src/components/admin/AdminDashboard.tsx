import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Check
} from 'lucide-react';
import { api } from '../../api/client.ts';

type TimeRangeKey = 'today' | 'week' | 'month' | 'session';

interface TimeRangeConfig {
  key: TimeRangeKey;
  label: string;
  count: number;
  trend: string;
  peakLabel: string;
  peakX: number;
  peakY: number;
  path: string;
  labels: string[];
  activeLabelIndex: number;
}

const TIME_RANGES: Record<TimeRangeKey, TimeRangeConfig> = {
  week: {
    key: 'week',
    label: 'This week',
    count: 138,
    trend: '↑ 14% higher than last examination cycle',
    peakLabel: '12',
    peakX: 210,
    peakY: 120,
    path: 'M 10 130 C 50 140, 70 80, 110 90 C 150 100, 170 140, 210 120 C 250 100, 270 30, 310 40 C 350 50, 370 110, 410 70 C 450 30, 480 50, 495 65',
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    activeLabelIndex: 3
  },
  today: {
    key: 'today',
    label: 'Today',
    count: 26,
    trend: '↑ 8% higher than yesterday at this hour',
    peakLabel: '7',
    peakX: 260,
    peakY: 45,
    path: 'M 10 140 C 60 135, 100 110, 150 105 C 190 100, 220 50, 260 45 C 310 40, 350 90, 390 70 C 430 50, 470 30, 495 25',
    labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    activeLabelIndex: 3
  },
  month: {
    key: 'month',
    label: 'This month',
    count: 512,
    trend: '↑ 24% higher than previous calendar month',
    peakLabel: '86',
    peakX: 320,
    peakY: 35,
    path: 'M 10 120 C 70 110, 110 80, 160 85 C 220 90, 260 40, 320 35 C 380 30, 430 70, 495 40',
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    activeLabelIndex: 2
  },
  session: {
    key: 'session',
    label: 'Fall 2026 Session',
    count: 1420,
    trend: '94% total registered student enrollment',
    peakLabel: '312',
    peakX: 330,
    peakY: 45,
    path: 'M 10 145 C 60 130, 120 110, 180 95 C 240 80, 280 60, 330 45 C 390 25, 440 35, 495 20',
    labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    activeLabelIndex: 3
  }
};

export const AdminDashboard: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Time range filter for Exam Slot Selections
  const [timeRangeKey, setTimeRangeKey] = useState<TimeRangeKey>('week');
  const [isTimeRangeOpen, setIsTimeRangeOpen] = useState(false);
  const timeRangeRef = useRef<HTMLDivElement>(null);

  // Campus distribution timeframe
  const [campusFilter, setCampusFilter] = useState<'month' | 'term' | 'all'>('month');
  const [isCampusMenuOpen, setIsCampusMenuOpen] = useState(false);
  const campusFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeRangeRef.current && !timeRangeRef.current.contains(event.target as Node)) {
        setIsTimeRangeOpen(false);
      }
      if (campusFilterRef.current && !campusFilterRef.current.contains(event.target as Node)) {
        setIsCampusMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <div className="lg:col-span-7 gradient-accent-card rounded-3xl p-6 shadow-md relative overflow-visible flex flex-col justify-between text-[#08090B]">
          <div className="flex items-center justify-between mb-4 relative z-20">
            <div>
              <h3 className="font-display font-bold text-xl text-[#08090B]">
                Exam Slot Selections
              </h3>
              <p className="text-xs text-[#08090B]/70 font-ui">
                Active examination shift enrollment trend
              </p>
            </div>
            <div
              ref={timeRangeRef}
              role="button"
              tabIndex={0}
              onClick={() => setIsTimeRangeOpen(!isTimeRangeOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsTimeRangeOpen(!isTimeRangeOpen);
                } else if (e.key === 'Escape') {
                  setIsTimeRangeOpen(false);
                }
              }}
              aria-haspopup="listbox"
              aria-expanded={isTimeRangeOpen}
              className="relative flex items-center gap-1.5 px-3 py-1 bg-white/75 hover:bg-white active:scale-95 backdrop-blur-md rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer select-none border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#08090B]/40"
            >
              <span>{TIME_RANGES[timeRangeKey].label}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isTimeRangeOpen ? 'rotate-180' : ''}`} />

              {/* Interactive Dropdown Menu */}
              {isTimeRangeOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-52 bg-white/95 dark:bg-[#08090B]/95 backdrop-blur-md border border-[#DDE3E8] dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 font-ui animate-in fade-in zoom-in-95 duration-150 text-left"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#68717D] uppercase tracking-wider">
                    Select Timeframe
                  </div>
                  {(Object.keys(TIME_RANGES) as TimeRangeKey[]).map((key) => {
                    const item = TIME_RANGES[key];
                    const isSelected = key === timeRangeKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setTimeRangeKey(key);
                          setIsTimeRangeOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left cursor-pointer ${
                          isSelected
                            ? 'bg-[#08090B] text-white dark:bg-[#C8F85A] dark:text-[#08090B] font-bold'
                            : 'text-[#08090B] dark:text-slate-200 hover:bg-[#F7F7F3] dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="my-2">
            <div className="font-display font-black text-5xl text-[#08090B] tracking-tight transition-all duration-300">
              {TIME_RANGES[timeRangeKey].count}
            </div>
            <div className="text-xs font-semibold text-[#08090B]/80 font-ui mt-1 flex items-center gap-1">
              <span>{TIME_RANGES[timeRangeKey].trend}</span>
            </div>
          </div>

          {/* SVG Smooth Curve Graph */}
          <div className="relative pt-6 pb-2">
            <svg viewBox="0 0 500 160" className="w-full h-32 stroke-[#08090B] fill-none stroke-[2.5] overflow-visible">
              <path
                d={TIME_RANGES[timeRangeKey].path}
                className="transition-all duration-500"
              />
              {/* Highlight Circle Dot */}
              <circle
                cx={TIME_RANGES[timeRangeKey].peakX}
                cy={TIME_RANGES[timeRangeKey].peakY}
                r="14"
                fill="#08090B"
                className="transition-all duration-500"
              />
              <text
                x={TIME_RANGES[timeRangeKey].peakX}
                y={TIME_RANGES[timeRangeKey].peakY + 4}
                textAnchor="middle"
                fill="#C8F85A"
                fontSize="11"
                fontWeight="bold"
                fontFamily="Inter"
                className="transition-all duration-500"
              >
                {TIME_RANGES[timeRangeKey].peakLabel}
              </text>
            </svg>

            <div className="flex justify-between text-[11px] font-bold text-[#08090B]/80 pt-2 border-t border-[#08090B]/20 font-ui">
              {TIME_RANGES[timeRangeKey].labels.map((lbl, idx) => (
                <span
                  key={lbl}
                  className={idx === TIME_RANGES[timeRangeKey].activeLabelIndex ? 'underline decoration-2 underline-offset-4 font-black' : ''}
                >
                  {lbl}
                </span>
              ))}
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
              className="text-xs font-bold text-[#16865B] dark:text-[#C8F85A] hover:underline font-ui cursor-pointer"
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
          <div
            ref={campusFilterRef}
            role="button"
            tabIndex={0}
            onClick={() => setIsCampusMenuOpen(!isCampusMenuOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsCampusMenuOpen(!isCampusMenuOpen);
              } else if (e.key === 'Escape') {
                setIsCampusMenuOpen(false);
              }
            }}
            aria-haspopup="listbox"
            aria-expanded={isCampusMenuOpen}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F7F3] hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-[#DDE3E8] dark:border-slate-700 rounded-full text-xs font-semibold font-ui cursor-pointer select-none transition-all focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
          >
            <span>
              {campusFilter === 'month'
                ? 'This month'
                : campusFilter === 'term'
                ? 'Current Term'
                : 'All Academic Year'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#68717D] transition-transform duration-200 ${isCampusMenuOpen ? 'rotate-180' : ''}`} />

            {isCampusMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-40 font-ui text-left"
              >
                {[
                  { id: 'month', label: 'This month' },
                  { id: 'term', label: 'Current Term' },
                  { id: 'all', label: 'All Academic Year' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setCampusFilter(opt.id as any);
                      setIsCampusMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left cursor-pointer ${
                      campusFilter === opt.id
                        ? 'bg-[#C8F85A] text-[#08090B] font-bold'
                        : 'text-[#08090B] dark:text-slate-200 hover:bg-[#F7F7F3] dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {campusFilter === opt.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
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
