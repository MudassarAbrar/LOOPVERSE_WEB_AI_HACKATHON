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
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { VirtualMailboxModal } from './VirtualMailboxModal.tsx';
import { api } from '../../api/client.ts';
import { ExamSlotLogo } from './ExamSlotLogo.tsx';

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
        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <ExamSlotLogo iconClassName="w-9 h-9" />

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Reset Demo Data button */}
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="p-2 rounded-xl text-[#68717D] hover:text-[#D43D3D] hover:bg-rose-50 dark:hover:bg-slate-800 transition"
              title="Reset Demo Data"
            >
              <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            </button>
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
