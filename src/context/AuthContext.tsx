import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, StudentProfile, EmailLog } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../api/client.ts';

interface AuthContextType {
  user: User | null;
  studentProfile: StudentProfile | null;
  token: string | null;
  loading: boolean;
  darkMode: boolean;
  unreadEmailsCount: number;
  emails: EmailLog[];
  sessionExpiredModalOpen: boolean;
  closeSessionExpiredModal: () => void;
  toggleDarkMode: () => void;
  login: (email: string, pass: string) => Promise<{ role: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  fetchEmails: () => Promise<void>;
  quickLogin: (preset: 'admin' | 'stu1' | 'stu2' | 'stu3' | 'stu4') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionExpiredModalOpen, setSessionExpiredModalOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('examslot_dark_mode') === 'true';
  });
  const [emails, setEmails] = useState<EmailLog[]>([]);

  useEffect(() => {
    const handleUnauthorized = (e: any) => {
      clearStoredToken();
      setToken(null);
      setUser(null);
      setStudentProfile(null);
      setSessionExpiredModalOpen(true);
    };

    window.addEventListener('examslot_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('examslot_unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('examslot_dark_mode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const closeSessionExpiredModal = () => {
    setSessionExpiredModalOpen(false);
  };

  const fetchEmails = async () => {
    try {
      const emailList = await api.getEmails(user?.role === 'STUDENT' ? user.email : undefined);
      setEmails(emailList);
    } catch {
      // ignore
    }
  };

  const refreshUser = async () => {
    const activeToken = getStoredToken();
    if (!activeToken) {
      setUser(null);
      setStudentProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setStudentProfile(res.studentProfile);
      setToken(activeToken);
    } catch {
      clearStoredToken();
      setToken(null);
      setUser(null);
      setStudentProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setStudentProfile(res.studentProfile);
    setSessionExpiredModalOpen(false);
    fetchEmails();
    return { role: res.user.role };
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setStudentProfile(null);
    setSessionExpiredModalOpen(false);
  };

  const quickLogin = async (preset: 'admin' | 'stu1' | 'stu2' | 'stu3' | 'stu4') => {
    const map = {
      admin: { email: 'admin@examslot.edu', pass: 'Admin@123' },
      stu1: { email: 'ali.khan@student.examslot.edu', pass: 'Student@123' }, // Ready for slot selection
      stu2: { email: 'fatima.noor@student.examslot.edu', pass: 'Student@123' }, // Already saved & approved branch change
      stu3: { email: 'bilal.ahmed@student.examslot.edu', pass: 'Student@123' }, // Needs one-time branch selection
      stu4: { email: 'zainab.tariq@student.examslot.edu', pass: 'Student@123' } // Incomplete course assignment (<4 courses)
    };
    const cred = map[preset];
    await login(cred.email, cred.pass);
  };

  const unreadEmailsCount = emails.filter(e => !e.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        token,
        loading,
        darkMode,
        unreadEmailsCount,
        emails,
        sessionExpiredModalOpen,
        closeSessionExpiredModal,
        toggleDarkMode,
        login,
        logout,
        refreshUser,
        fetchEmails,
        quickLogin
      }}
    >
      {children}

      {/* Session Expired Modal */}
      {sessionExpiredModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-[#D58A13]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#08090B] dark:text-white">
                Session Expired or Invalid
              </h3>
              <p className="text-xs text-[#68717D] dark:text-slate-300 mt-1">
                Your authenticated session has ended or is invalid. Please log in again to continue safely. Unsaved changes have been cached.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setSessionExpiredModalOpen(false);
                  window.location.href = '/login';
                }}
                className="w-full py-2.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold shadow-sm transition active:scale-95"
              >
                Log In Again
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
