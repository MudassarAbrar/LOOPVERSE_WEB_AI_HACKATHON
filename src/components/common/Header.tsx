import React, { useState } from 'react';
import {
  CalendarDays,
  Moon,
  Sun,
  Mail,
  LogOut,
  User,
  ShieldCheck,
  GraduationCap,
  RotateCcw,
  Sparkles,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { VirtualMailboxModal } from './VirtualMailboxModal.tsx';
import { api } from '../../api/client.ts';

interface HeaderProps {
  onNavigateToToken?: (tokenUrl: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToToken }) => {
  const {
    user,
    studentProfile,
    darkMode,
    toggleDarkMode,
    logout,
    unreadEmailsCount,
    quickLogin,
    refreshUser
  } = useAuth();

  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo data back to default university seed? Any newly created branches, courses or selections will be restored to seed values.')) {
      setResetting(true);
      try {
        await api.resetDemo();
        await refreshUser();
        window.location.reload();
      } catch (err) {
        console.error(err);
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F7F7F3]/95 dark:bg-[#08090B]/95 backdrop-blur-md border-b border-[#DDE3E8] dark:border-slate-800 transition-colors">
        {/* Top Demo Quick Bar */}
        <div className="bg-[#D9ECF8]/60 dark:bg-slate-900/90 px-4 py-1.5 border-b border-[#DDE3E8] dark:border-slate-800 text-xs text-[#68717D] dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 demo-bar">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#08090B] dark:text-[#C8F85A] flex items-center gap-1 font-ui">
              <Sparkles className="w-3.5 h-3.5 text-[#D58A13]" />
              Role Switcher:
            </span>
            <button
              onClick={() => quickLogin('admin')}
              className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 hover:bg-[#8ECCFF] hover:text-[#08090B] dark:hover:bg-[#C8F85A] dark:hover:text-[#08090B] text-[#08090B] dark:text-slate-200 border border-[#DDE3E8] dark:border-slate-700 font-medium transition text-[11px]"
            >
              Admin Controller
            </button>
            <button
              onClick={() => quickLogin('stu1')}
              className="px-2.5 py-0.5 rounded-full bg-[#C8F85A]/40 dark:bg-[#C8F85A]/20 hover:bg-[#C8F85A] hover:text-[#08090B] text-[#08090B] dark:text-[#C8F85A] border border-[#C8F85A]/50 font-medium transition text-[11px]"
              title="Ali Khan: Branch chosen, ready to pick exam slots"
            >
              Ali Khan (Slot Builder)
            </button>
            <button
              onClick={() => quickLogin('stu2')}
              className="px-2.5 py-0.5 rounded-full bg-[#8ECCFF]/40 dark:bg-[#8ECCFF]/20 hover:bg-[#8ECCFF] hover:text-[#08090B] text-[#08090B] dark:text-[#8ECCFF] border border-[#8ECCFF]/50 font-medium transition text-[11px]"
              title="Fatima Noor: Date Sheet Saved & Approved Branch Change"
            >
              Fatima (Saved & Unlocked)
            </button>
            <button
              onClick={() => quickLogin('stu3')}
              className="px-2.5 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-950/40 hover:bg-[#D58A13] hover:text-white text-[#D58A13] border border-amber-300/50 font-medium transition text-[11px]"
              title="Bilal Ahmed: Needs one-time branch selection"
            >
              Bilal (Branch Selection)
            </button>
            <button
              onClick={() => quickLogin('stu4')}
              className="px-2.5 py-0.5 rounded-full bg-rose-100/70 dark:bg-rose-950/40 hover:bg-[#D43D3D] hover:text-white text-[#D43D3D] border border-rose-300/50 font-medium transition text-[11px]"
              title="Zainab Tariq: Only 2 courses assigned (Incomplete rule test)"
            >
              Zainab (Incomplete &lt;4)
            </button>
          </div>

          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="flex items-center gap-1 text-[11px] text-[#68717D] hover:text-[#D43D3D] transition ml-auto"
            title="Reset to clean initial state"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Data</span>
          </button>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & University Brand matching Section 06/08 in Image 2 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#08090B] dark:bg-[#C8F85A] flex items-center justify-center text-[#C8F85A] dark:text-[#08090B] shadow-sm">
              <CalendarDays className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-xl text-[#08090B] dark:text-white tracking-tight">
                  Exam<span className="text-[#16865B] dark:text-[#C8F85A]">Slot</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#C8F85A] text-[#08090B] rounded-full uppercase tracking-wider font-ui">
                  Portal
                </span>
              </div>
              <p className="text-[11px] text-[#68717D] dark:text-slate-400 hidden sm:block font-ui">
                A self-service exam date sheet system for a multi-branch virtual university
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Virtual Mailbox Drawer Trigger */}
            <button
              onClick={() => setIsMailboxOpen(true)}
              className="relative p-2 rounded-xl text-[#08090B] dark:text-slate-200 hover:bg-[#D9ECF8] dark:hover:bg-slate-800 transition"
              title="Open Virtual University Mailbox (Inspect sent token emails)"
            >
              <Mail className="w-5 h-5" />
              {unreadEmailsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D43D3D] rounded-full animate-ping" />
              )}
              {unreadEmailsCount > 0 && (
                <span className="absolute top-1 right-1 px-1 min-w-[16px] h-4 text-[10px] font-bold bg-[#D43D3D] text-white rounded-full flex items-center justify-center">
                  {unreadEmailsCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle (Bonus +1) */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-[#08090B] dark:text-slate-200 hover:bg-[#D9ECF8] dark:hover:bg-slate-800 transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-[#C8F85A]" /> : <Moon className="w-5 h-5 text-[#08090B]" />}
            </button>

            {/* User Profile Info / Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#DDE3E8] dark:border-slate-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#08090B] dark:text-slate-100 font-ui">
                    {studentProfile?.fullName || user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-[#68717D] dark:text-slate-400 flex items-center justify-end gap-1">
                    {user.role === 'ADMIN' ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-[#16865B]" />
                        Admin Controller
                      </>
                    ) : (
                      <>
                        <GraduationCap className="w-3 h-3 text-[#8ECCFF]" />
                        {studentProfile?.regNumber || 'Student'}
                      </>
                    )}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#08090B] text-white dark:bg-[#C8F85A] dark:text-[#08090B] flex items-center justify-center font-bold text-xs uppercase font-ui">
                  {user.role === 'ADMIN' ? 'A' : studentProfile?.fullName?.[0] || 'S'}
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-[#68717D] hover:text-[#D43D3D] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#68717D] dark:text-slate-400 hidden sm:inline">
                  Guest Access
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <VirtualMailboxModal
        isOpen={isMailboxOpen}
        onClose={() => setIsMailboxOpen(false)}
        onNavigateToToken={onNavigateToToken}
      />
    </>
  );
};
