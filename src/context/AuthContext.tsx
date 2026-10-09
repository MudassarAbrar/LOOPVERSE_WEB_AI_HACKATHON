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
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('examslot_dark_mode') === 'true';
  });
  const [emails, setEmails] = useState<EmailLog[]>([]);

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
    fetchEmails();
    return { role: res.user.role };
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setStudentProfile(null);
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
        toggleDarkMode,
        login,
        logout,
        refreshUser,
        fetchEmails,
        quickLogin
      }}
    >
      {children}
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
