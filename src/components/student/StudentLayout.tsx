import React, { useState } from 'react';
import {
  CalendarDays,
  LayoutDashboard,
  Calendar,
  HelpCircle,
  Building2,
  Lock,
  UserCheck,
  Bot,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { StudentDashboard } from './StudentDashboard.tsx';
import { StudentRequestsView } from './StudentRequestsView.tsx';
import { BranchSelectionPage } from './BranchSelectionPage.tsx';
import { DateSheetBuilder } from './DateSheetBuilder.tsx';
import { PrintableDateSheet } from './PrintableDateSheet.tsx';
import { NeedHelpModal } from './NeedHelpModal.tsx';
import { ExamSlotLogo } from '../common/ExamSlotLogo.tsx';
import { AiAssistantView } from '../common/AiAssistantView.tsx';

export const StudentLayout: React.FC = () => {
  const { studentProfile, refreshUser } = useAuth();
  const [needHelpOpen, setNeedHelpOpen] = useState(false);
  const [studentNav, setStudentNav] = useState<'dashboard' | 'datesheet' | 'requests' | 'assistant'>('dashboard');

  if (!studentProfile) return null;

  const needsBranchSelection = !studentProfile.isBranchSelected || studentProfile.branchUnlocked;
  const isDateSheetFinalized = studentProfile.isDateSheetSaved && !studentProfile.dateSheetUnlocked;

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6 font-ui">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Section 09: STUDENT SIDEBAR */}
        <aside className="lg:col-span-3 bg-[#08090B] dark:bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800">
          <div className="mb-6 px-1">
            <ExamSlotLogo iconClassName="w-8 h-8" lightText={true} />
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
              <span>Exam Date Sheet</span>
            </button>

            <button
              onClick={() => setStudentNav('requests')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                studentNav === 'requests'
                  ? 'bg-[#C8F85A] text-[#08090B] shadow-md shadow-[#C8F85A]/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>My Requests</span>
            </button>

            <button
              onClick={() => setStudentNav('assistant')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                studentNav === 'assistant'
                  ? 'bg-[#C8F85A] text-[#08090B] shadow-md shadow-[#C8F85A]/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bot className="w-4 h-4 shrink-0" />
              <span>AI Assistant</span>
              <span className="ml-auto text-[9px] bg-[#C8F85A]/20 text-[#C8F85A] px-1.5 py-0.5 rounded-full font-bold">
                LIVE
              </span>
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
          {/* Active View Router */}
          <div className="animate-in fade-in duration-200">
            {studentNav === 'dashboard' && (
              <StudentDashboard
                onNavigate={(tab) => setStudentNav(tab)}
                onOpenNeedHelp={() => setNeedHelpOpen(true)}
              />
            )}

            {studentNav === 'datesheet' && (
              needsBranchSelection ? (
                <BranchSelectionPage onSuccess={() => refreshUser()} />
              ) : isDateSheetFinalized ? (
                <PrintableDateSheet onOpenNeedHelp={() => setNeedHelpOpen(true)} />
              ) : (
                <DateSheetBuilder onSavedSuccess={() => refreshUser()} />
              )
            )}

            {studentNav === 'requests' && (
              <StudentRequestsView onOpenNewRequest={() => setNeedHelpOpen(true)} />
            )}

            {studentNav === 'assistant' && (
              <AiAssistantView
                studentId={studentProfile.id}
                studentName={studentProfile.fullName}
                onNavigateToDatesheet={() => setStudentNav('datesheet')}
                onNavigateToRequests={() => setStudentNav('requests')}
              />
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
