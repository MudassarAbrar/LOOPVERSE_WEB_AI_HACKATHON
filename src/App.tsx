import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/common/Header.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { SetPasswordPage } from './components/auth/SetPasswordPage.tsx';
import { AdminLayout } from './components/admin/AdminLayout.tsx';
import { StudentLayout } from './components/student/StudentLayout.tsx';
import { ChatWidget } from './components/common/ChatWidget.tsx';

function MainApp() {
  const { user, studentProfile, loading } = useAuth();
  const [tokenParam, setTokenParam] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameters for password token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setTokenParam(token);
    }
  }, []);

  const handleNavigateToToken = (tokenUrl: string) => {
    try {
      const url = new URL(tokenUrl, window.location.origin);
      const token = url.searchParams.get('token');
      if (token) {
        setTokenParam(token);
        window.history.pushState({}, '', tokenUrl);
      }
    } catch {
      // Fallback
      if (tokenUrl.includes('token=')) {
        const parts = tokenUrl.split('token=');
        setTokenParam(parts[1]);
      }
    }
  };

  const handleClearToken = () => {
    setTokenParam(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F3] dark:bg-[#08090B]">
        <div className="text-center space-y-3 font-ui">
          <div className="w-10 h-10 border-3 border-[#8ECCFF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#68717D] dark:text-slate-400 font-medium">Loading ExamSlot Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F3] dark:bg-[#08090B] text-[#08090B] dark:text-[#F7F7F3] flex flex-col font-ui transition-colors relative">
      <Header onNavigateToToken={handleNavigateToToken} />

      <main className="flex-1">
        {tokenParam ? (
          <SetPasswordPage
            token={tokenParam}
            onSuccess={() => handleClearToken()}
            onCancel={() => handleClearToken()}
          />
        ) : !user ? (
          <LoginPage onOpenPasswordSetup={(t) => setTokenParam(t)} />
        ) : user.role === 'ADMIN' ? (
          <AdminLayout />
        ) : (
          <StudentLayout />
        )}
      </main>

      {/* Floating AI Assistant Chatbot */}
      {user && <ChatWidget studentId={studentProfile?.id} />}

      <footer className="print:hidden border-t border-[#DDE3E8] dark:border-slate-800 py-4 px-6 text-center text-xs text-[#68717D] dark:text-slate-400 bg-white/70 dark:bg-[#08090B] backdrop-blur-sm transition-colors">
        ExamSlot Portal · Loopverse 3.0 Hackathon Solution · Virtual University Self-Service Exam Timetable System
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
