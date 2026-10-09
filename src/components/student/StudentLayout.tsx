import React, { useState } from 'react';
import {
  CalendarDays,
  LayoutDashboard,
  Calendar,
  HelpCircle,
  Building2,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BranchSelectionPage } from './BranchSelectionPage.tsx';
import { DateSheetBuilder } from './DateSheetBuilder.tsx';
import { PrintableDateSheet } from './PrintableDateSheet.tsx';
import { NeedHelpModal } from './NeedHelpModal.tsx';

export const StudentLayout: React.FC = () => {
  const { studentProfile, refreshUser } = useAuth();
  const [needHelpOpen, setNeedHelpOpen] = useState(false);
  const [studentNav, setStudentNav] = useState<'dashboard' | 'datesheet' | 'requests'>('dashboard');

  if (!studentProfile) return null;

  const needsBranchSelection = !studentProfile.isBranchSelected || studentProfile.branchUnlocked;
  const isDateSheetFinalized = studentProfile.isDateSheetSaved && !studentProfile.dateSheetUnlocked;

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6 font-ui">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Section 09: STUDENT SIDEBAR */}
        <aside className="lg:col-span-3 bg-[#08090B] dark:bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800">
          <div className="flex items-center gap-2 mb-6 px-2">
            <div className="w-8 h-8 rounded-lg bg-[#C8F85A] flex items-center justify-center text-[#08090B] font-bold text-sm">
              ES
            </div>
            <span className="font-display font-bold text-lg text-white">
              Exam<span className="text-[#C8F85A]">Slot</span>
            </span>
          </div>

          <div className="text-[11px] font-bold text-[#68717D] uppercase tracking-wider px-3 mb-2 font-ui">
            Student Portal
          </div>

          <nav className="space-y-1.5 font-ui">
            <button
              onClick={() => setStudentNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                studentNav === 'dashboard'
                  ? 'bg-[#C8F85A] text-[#08090B] shadow-md shadow-[#C8F85A]/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setStudentNav('datesheet')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                studentNav === 'datesheet'
                  ? 'bg-[#C8F85A] text-[#08090B] shadow-md shadow-[#C8F85A]/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>My Date Sheet</span>
            </button>

            <button
              onClick={() => {
                setStudentNav('requests');
                setNeedHelpOpen(true);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                studentNav === 'requests'
                  ? 'bg-[#C8F85A] text-[#08090B] shadow-md shadow-[#C8F85A]/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>My Requests</span>
            </button>
          </nav>

          {/* Quick Profile Summary in sidebar */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 px-2 text-xs text-[#68717D] space-y-1.5">
            <div className="text-[11px] font-bold text-white uppercase tracking-wider">
              Registration Card
            </div>
            <div className="text-slate-300 font-mono text-[11px]">
              {studentProfile.regNumber}
            </div>
            <div className="text-slate-400 text-[11px]">
              {studentProfile.program}
            </div>
            <div className="text-slate-400 text-[11px]">
              Campus: <span className="text-[#C8F85A] font-bold">{studentProfile.branchName || 'Not Chosen'}</span>
            </div>
          </div>
        </aside>

        {/* MAIN STUDENT CONTENT */}
        <main className="lg:col-span-9 space-y-6">
          {/* Top User Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-[#DDE3E8] dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#68717D]">
              <span>Portal Session:</span>
              <span className="font-bold text-[#08090B] dark:text-white">Fall 2026 Examination</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setNeedHelpOpen(true)}
                className="px-3 py-1.5 bg-[#D9ECF8] hover:bg-[#8ECCFF] text-[#08090B] rounded-2xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Need Help?</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-[#DDE3E8] dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-[#08090B] dark:bg-[#C8F85A] text-white dark:text-[#08090B] font-bold text-xs flex items-center justify-center">
                  {studentProfile.fullName[0]}
                </div>
                <div className="text-xs font-bold text-[#08090B] dark:text-white hidden sm:block">
                  {studentProfile.fullName}
                </div>
              </div>
            </div>
          </div>

          {/* Router */}
          <div className="animate-in fade-in duration-200">
            {needsBranchSelection ? (
              <BranchSelectionPage onSuccess={() => refreshUser()} />
            ) : isDateSheetFinalized || studentNav === 'datesheet' ? (
              <PrintableDateSheet onOpenNeedHelp={() => setNeedHelpOpen(true)} />
            ) : (
              <DateSheetBuilder onSavedSuccess={() => refreshUser()} />
            )}
          </div>
        </main>
      </div>

      <NeedHelpModal
        isOpen={needHelpOpen}
        onClose={() => setNeedHelpOpen(false)}
        onRequestSubmitted={() => refreshUser()}
      />
    </div>
  );
};
