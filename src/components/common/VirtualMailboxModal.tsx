import React from 'react';
import { Mail, X, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../api/client.ts';

interface VirtualMailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToToken?: (tokenUrl: string) => void;
}

export const VirtualMailboxModal: React.FC<VirtualMailboxModalProps> = ({
  isOpen,
  onClose,
  onNavigateToToken
}) => {
  const { emails, fetchEmails } = useAuth();

  if (!isOpen) return null;

  const handleOpenLink = async (emailId: string, link: string) => {
    await api.markEmailRead(emailId);
    await fetchEmails();
    onClose();
    if (onNavigateToToken) {
      onNavigateToToken(link);
    } else {
      window.location.href = link;
    }
  };

  const handleMarkRead = async (emailId: string) => {
    await api.markEmailRead(emailId);
    await fetchEmails();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in font-ui">
      <div className="bg-white dark:bg-slate-900 border border-[#DDE3E8] dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE3E8] dark:border-slate-800 bg-[#F7F7F3] dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D9ECF8] dark:bg-slate-800 text-[#08090B] dark:text-[#8ECCFF] rounded-2xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-[#08090B] dark:text-white flex items-center gap-2">
                Simulated University Mailbox
                <span className="text-[11px] font-bold px-2 py-0.5 bg-[#C8F85A] text-[#08090B] rounded-full font-ui">
                  Live Dispatch
                </span>
              </h2>
              <p className="text-xs text-[#68717D] dark:text-slate-400">
                Inspect onboarding password setup links and request status alerts sent by the server.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#68717D] hover:text-[#08090B] dark:hover:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {emails.length === 0 ? (
            <div className="text-center py-12 text-[#68717D] dark:text-slate-400">
              <Mail className="w-12 h-12 mx-auto stroke-1 text-[#DDE3E8] dark:text-slate-700 mb-2" />
              <p className="font-semibold">No emails dispatched yet.</p>
              <p className="text-xs mt-1">Creating a new student or submitting an admin review will generate an email here.</p>
            </div>
          ) : (
            emails.map((mail) => (
              <div
                key={mail.id}
                className={`p-4 rounded-2xl border transition-all ${
                  mail.read
                    ? 'bg-[#F7F7F3] dark:bg-slate-800/40 border-[#DDE3E8] dark:border-slate-800'
                    : 'bg-[#D9ECF8]/20 dark:bg-slate-800/90 border-[#8ECCFF] dark:border-[#8ECCFF]/50 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#08090B] dark:text-white text-sm">
                        {mail.subject}
                      </span>
                      {!mail.read && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#C8F85A] text-[#08090B] rounded-full">
                          NEW
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-white dark:bg-slate-700 text-[#08090B] dark:text-slate-200 border border-[#DDE3E8] dark:border-slate-600">
                        To: {mail.to}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#68717D]">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(mail.timestamp).toLocaleTimeString()} - {new Date(mail.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {!mail.read && (
                    <button
                      onClick={() => handleMarkRead(mail.id)}
                      className="text-xs font-semibold text-[#68717D] hover:text-[#08090B] dark:hover:text-[#C8F85A] flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}
                </div>

                <p className="text-xs text-[#08090B]/80 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-3">
                  {mail.body}
                </p>

                {mail.link && (
                  <div className="pt-2 border-t border-[#DDE3E8] dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-mono text-[#68717D] truncate max-w-xs">
                      {mail.link}
                    </span>
                    <button
                      onClick={() => handleOpenLink(mail.id, mail.link!)}
                      className="px-3.5 py-1.5 bg-[#C8F85A] hover:bg-[#bbf048] text-[#08090B] rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Password Setup Link
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DDE3E8] dark:border-slate-800 bg-[#F7F7F3] dark:bg-slate-800/60 flex items-center justify-between text-xs text-[#68717D] dark:text-slate-400">
          <span>Password links expire in 24 hours. Single-use only.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-[#DDE3E8] dark:border-slate-700 text-[#08090B] dark:text-slate-200 rounded-2xl font-bold transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
