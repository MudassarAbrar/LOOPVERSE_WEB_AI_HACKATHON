import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Database,
  Loader2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  executedTool?: string;
  toolResult?: any;
  timestamp: string;
}

interface AiAssistantViewProps {
  studentId?: string;
  studentName?: string;
  onNavigateToDatesheet?: () => void;
  onNavigateToRequests?: () => void;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  studentId,
  studentName,
  onNavigateToDatesheet,
  onNavigateToRequests
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `Hello ${studentName || 'there'}! I am your ExamSlot AI Assistant.\n\nI have live access to Virtual University database tools. I can check active exam branches, query slot schedules and real-time seat capacities, verify your assigned courses, and instantly detect any date or time clashes.\n\nWhat would you like to check today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const apiPayload: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }> = [
      ...messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      {
        role: 'user',
        parts: [{ text: queryText }]
      }
    ];

    try {
      const res = await api.sendChatMessage(apiPayload, studentId);
      if (res.executedTool) {
        setActiveTool(res.executedTool);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: res.reply || 'I processed your request using live database tools.',
        executedTool: res.executedTool,
        toolResult: res.toolResult,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `Error connecting to AI service: ${err.message || 'Server error'}. Please verify your Gemini connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: `Conversation cleared. How can I assist you with your exam schedule, branches, or course slots?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setActiveTool(null);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-[#DDE3E8] dark:border-slate-800 shadow-sm overflow-hidden h-[calc(100vh-140px)] min-h-[580px] w-full">
      {/* Top Header - Fits cleanly into the page without fake window framing */}
      <div className="bg-[#08090B] px-5 py-3.5 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#C8F85A]/15 border border-[#C8F85A]/30 rounded-xl text-[#C8F85A] shadow-inner">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm sm:text-base text-white tracking-tight">
              ExamSlot AI Assistant
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            disabled={loading || messages.length <= 1}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-40 cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Main Conversation Area - Seamless screen fitting */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F7F7F3] dark:bg-[#08090B]/60 transition-colors">
        {/* Message Stream */}
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 sm:px-5 py-3 shadow-sm transition-all ${
                    isUser
                      ? 'bg-[#C8F85A] text-[#08090B] font-medium rounded-tr-xs shadow-md shadow-[#C8F85A]/10'
                      : 'bg-white dark:bg-slate-900 text-[#08090B] dark:text-slate-100 border border-[#DDE3E8] dark:border-slate-800 rounded-tl-xs shadow-sm'
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#DDE3E8]/80 dark:border-slate-800 text-xs font-bold text-[#68717D] dark:text-slate-400">
                      <div className="p-1 rounded bg-[#08090B] text-[#C8F85A]">
                        <Bot className="w-3 h-3" />
                      </div>
                      <span>ExamSlot Assistant</span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm font-ui">
                    {m.text}
                  </p>

                  {/* Tool execution indicator */}
                  {m.executedTool && (
                    <div className="mt-3 pt-2 border-t border-[#DDE3E8] dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-mono bg-[#F7F7F3] dark:bg-[#08090B] px-3 py-1.5 rounded-xl">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-[#C8F85A]">
                        <Database className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px]">
                          Live Tool Executed: <strong>{m.executedTool}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Live Data</span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-[#68717D] dark:text-slate-500 px-2">
                  {m.timestamp}
                </span>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-[#68717D] dark:text-slate-300 text-xs bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-[#DDE3E8] dark:border-slate-800 w-fit shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#08090B] dark:text-[#C8F85A]" />
              <span className="font-medium">
                Querying live database records via Gemini...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form Bar - Clean and directly connected */}
      <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-[#DDE3E8] dark:border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="max-w-4xl mx-auto flex items-end gap-2.5"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about exam branches, slot availability, seat capacity, or schedule conflicts..."
              disabled={loading}
              className="w-full resize-none max-h-32 bg-[#F7F7F3] dark:bg-slate-950 text-[#08090B] dark:text-white placeholder-[#68717D] dark:placeholder-slate-400 text-xs sm:text-sm rounded-2xl px-4 py-3 border border-[#DDE3E8] dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C8F85A] focus:border-transparent transition-all disabled:opacity-50 font-ui"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-[#08090B] dark:bg-[#C8F85A] hover:bg-slate-800 dark:hover:bg-[#bbf048] text-white dark:text-[#08090B] font-bold p-3 rounded-2xl disabled:opacity-40 transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
