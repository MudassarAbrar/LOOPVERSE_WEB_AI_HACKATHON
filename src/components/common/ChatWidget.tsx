import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Database, Loader2, Minimize2, MessageSquare, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  executedTool?: string;
  timestamp: string;
}

interface ChatWidgetProps {
  studentId?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ studentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: 'Hello! I am your ExamSlot AI Assistant. I query live database records to help you check active campuses, course exam slots, seat capacity, assigned courses, and schedule conflicts. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);
    setActiveTool(null);

    // Format chat trajectory for Google Gen AI SDK
    const apiPayload = [...messages, userMsg].map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `Error connecting to AI service: ${err.message || 'Server error'}. Please ensure GEMINI_API_KEY is configured.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestionChips = [
    'What exam branches are available?',
    'Show available slots for CS101',
    'Check remaining seat capacity for slots',
    'Are my assigned courses complete?',
    'Do I have any schedule conflicts?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-5 py-3.5 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/20"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <span className="hidden sm:inline font-semibold tracking-wide text-sm">ExamSlot AI Assistant</span>
          <Sparkles className="w-4 h-4 text-amber-300 opacity-90 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isOpen && (
        <div className="w-[90vw] sm:w-[420px] h-[580px] max-h-[calc(100vh-3rem)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-slate-900 p-4 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/30 border border-blue-500/40 rounded-xl">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">ExamSlot AI Assistant</h3>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                    Live Tools
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Powered by Google Gen AI SDK</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Minimize Chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none font-medium'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{m.text}</p>

                  {m.executedTool && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-1 rounded">
                      <Database className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Live Tool Executed: <strong>{m.executedTool}</strong></span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-800/60 px-3.5 py-2.5 rounded-2xl border border-slate-700/40 w-fit">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Querying live database tools via Gemini...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                disabled={loading}
                className="whitespace-nowrap text-[11px] bg-slate-800/80 hover:bg-slate-700 text-blue-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700 transition-colors shrink-0 disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about branches, slots, seats, or courses..."
              disabled={loading}
              className="flex-1 bg-slate-800 text-white placeholder-slate-400 text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shadow-md"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
