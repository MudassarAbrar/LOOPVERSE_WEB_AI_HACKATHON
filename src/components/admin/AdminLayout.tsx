import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  Calendar,
  HelpCircle,
  Shield,
  Layers,
  Search,
  Bell,
  ChevronDown,
  Bot
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard.tsx';
import { BranchManagement } from './BranchManagement.tsx';
import { CourseManagement } from './CourseManagement.tsx';
import { StudentManagement } from './StudentManagement.tsx';
import { CourseAssignmentModal } from './CourseAssignmentModal.tsx';
import { ExamScheduleManagement } from './ExamScheduleManagement.tsx';
import { StudentRequestsReview } from './StudentRequestsReview.tsx';
import { AdminAuditLogs } from './AdminAuditLogs.tsx';
import { StudentProfile } from '../../types/index.ts';
import { ExamSlotLogo } from '../common/ExamSlotLogo.tsx';
import { AiAssistantView } from '../common/AiAssistantView.tsx';

export const AdminLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'branches' | 'courses' | 'students' | 'schedules' | 'requests' | 'audit' | 'assistant'
  >('dashboard');

  const [assigningStudent, setAssigningStudent] = useState<StudentProfile | null>(null);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'branches', label: 'Branches', icon: Building2 },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'schedules', label: 'Exam Schedules', icon: Calendar },
    { id: 'requests', label: 'Change Requests', icon: HelpCircle },
    { id: 'audit', label: 'Audit Trail', icon: Shield },
    { id: 'assistant', label: 'AI Assistant', icon: Bot }
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Section 06: SIDEBAR NAVIGATION */}
        <aside className="lg:col-span-3 bg-[#08090B] dark:bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800">
          <div className="mb-6 px-1">
            <ExamSlotLogo iconClassName="w-8 h-8" lightText={true} />
          </div>

          <div className="text-[11px] font-bold text-[#68717D] uppercase tracking-wider px-3 mb-2 font-ui">
            Navigation
          </div>

          <nav className="space-y-1.5 font-ui">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#C8F85A] text-[#08090B] shadow-md shadow-[#C8F85A]/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-5 border-t border-slate-800/80 px-2 text-xs text-[#68717D]">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Academic Year:</span>
              <span className="font-semibold text-white">2026-2027</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Sitting Session:</span>
              <span className="font-semibold text-[#C8F85A]">Fall 2026</span>
            </div>
          </div>
        </aside>

        {/* Section 08: MAIN CONTENT AREA */}
        <main className="lg:col-span-9 space-y-6">
          {/* Top Search & Filter Bar from Image 2 preview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-[#DDE3E8] dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68717D]" />
              <input
                type="text"
                placeholder="Search students, courses, or branches..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#F7F7F3] dark:bg-slate-800/80 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-[#08090B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8ECCFF]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 rounded-2xl text-xs font-semibold text-[#08090B] dark:text-slate-200">
                <span>Fall 2026</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#68717D]" />
              </div>

              <div className="p-2 rounded-2xl bg-[#F7F7F3] dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 text-[#08090B] dark:text-slate-200">
                <Bell className="w-4 h-4" />
              </div>

              <div className="flex items-center gap-2 pl-2 border-l border-[#DDE3E8] dark:border-slate-700">
                <div className="w-7 h-7 rounded-full bg-[#08090B] text-[#C8F85A] font-bold text-xs flex items-center justify-center">
                  A
                </div>
                <span className="text-xs font-bold text-[#08090B] dark:text-white hidden sm:inline">
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* Active View */}
          <div className="animate-in fade-in duration-200">
            {activeTab === 'dashboard' && (
              <AdminDashboard onNavigateTab={(tab) => setActiveTab(tab as any)} />
            )}
            {activeTab === 'branches' && <BranchManagement />}
            {activeTab === 'courses' && <CourseManagement />}
            {activeTab === 'students' && (
              <StudentManagement
                onAssignCoursesClick={(student) => setAssigningStudent(student)}
              />
            )}
            {activeTab === 'schedules' && <ExamScheduleManagement />}
            {activeTab === 'requests' && <StudentRequestsReview />}
            {activeTab === 'audit' && <AdminAuditLogs />}
            {activeTab === 'assistant' && <AiAssistantView />}
          </div>
        </main>
      </div>

      {/* Course Assignment Modal */}
      {assigningStudent && (
        <CourseAssignmentModal
          student={assigningStudent}
          onClose={() => setAssigningStudent(null)}
          onSuccess={() => {
            setAssigningStudent(null);
          }}
        />
      )}
    </div>
  );
};
