
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, ArrowUp, Mic, Paperclip, ChevronDown, Menu, Newspaper, Zap, Loader2, RefreshCcw, Award, Calendar, Radio, Moon, Phone, MoreVertical, ExternalLink, AlertCircle, Cpu } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings } from '../types';
import { MOCK_CONTACTS } from '../constants';

interface ChatAreaProps {
  session: ChatSession | null;
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onFetchNews: () => void;
  onFetchAIUpdates: () => void;
  isImageMode: boolean;
  setIsImageMode: (val: boolean) => void;
  onStartVoice: () => void;
  isLoading: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  settings: UserSettings;
  onToggleSidebar: () => void;
  onRefreshContext: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  onSendMessage,
  onFetchNews,
  onFetchAIUpdates,
  onStartVoice,
  isLoading,
  selectedModel,
  onModelChange,
  settings,
  onToggleSidebar,
  onRefreshContext
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListeningInput, setIsListeningInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [combinedDate, setCombinedDate] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const contact = session?.contactId ? MOCK_CONTACTS.find(c => c.id === session.contactId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      let dayName = new Intl.DateTimeFormat('ur-PK', { weekday: 'long' }).format(now);
      if (dayName === 'جمعہ') dayName = 'جمعۃ المبارک';
      
      const gregDate = new Intl.DateTimeFormat('ur-PK', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).format(now);
      
      setCombinedDate(`${dayName}، ${gregDate}`);
    };
    
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (isListeningInput && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Speech recognition stop failed", err);
      }
    }
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${settings.highContrast ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <header className={`h-16 flex items-center justify-between px-3 md:px-6 shrink-0 z-30 shadow-lg border-b border-white/10 transition-colors ${contact ? 'bg-[#075e54] text-white' : 'bg-gradient-to-r from-[#0369a1] via-[#075985] to-[#0c4a6e]'}`}>
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <button onClick={onToggleSidebar} className="lg:hidden p-2 hover:bg-white/20 rounded-xl text-white transition-all active:scale-90">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-black text-lg md:text-xl urdu-text text-white drop-shadow-md">Urdu AI</span>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
           <button onClick={onStartVoice} className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg border border-emerald-500/10 transition-all active:scale-95 group">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="urdu-text text-[9px] md:text-xs font-black text-white">لائیو</span>
           </button>
           <button onClick={onFetchNews} className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all active:scale-95 group">
              <Newspaper className="w-3 h-3 text-white" />
              <span className="urdu-text text-[9px] md:text-xs font-black text-white">خبریں</span>
           </button>
           <button onClick={onFetchAIUpdates} className="flex items-center gap-1 px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 rounded-lg border border-sky-500/10 transition-all active:scale-95 group">
              <Cpu className="w-3 h-3 text-sky-400" />
              <span className="urdu-text text-[9px] md:text-xs font-black text-white">AI خبریں</span>
           </button>
           <button onClick={onRefreshContext} className="p-1.5 text-white/50 hover:text-white hover:bg-white/20 rounded-lg transition-all">
              <RefreshCcw className="w-3.5 h-3.5" />
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative">
        <div className="w-full max-w-chat mx-auto px-4 flex flex-col min-h-full relative z-10">
          {!session || session.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4 animate-bubble space-y-4">
              <div className="text-center space-y-3 w-full max-w-lg">
                <div className="relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#0ea5e9] to-[#0c4a6e] rounded-[1rem] border-2 border-white shadow-xl rotate-1">
                  <Sparkles className="text-white w-7 h-7 animate-pulse" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl md:text-3xl font-black urdu-text text-slate-900">Urdu AI (اردو اے آئی)</h2>
                  <div className="flex justify-center">
                    <div className="px-4 py-2 rounded-2xl bg-white/80 border border-sky-100 shadow-sm flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span className="urdu-text text-sm font-black text-sky-900">{combinedDate}</span>
                    </div>
                  </div>
                  <div className="max-w-md mx-auto p-4 md:p-6 rounded-2xl border-x-2 border-sky-500 shadow-lg bg-white/90">
                    <p className="urdu-text text-sm md:text-base font-bold text-sky-900 text-center" dir="rtl">
                      اردو اے آئی ایک جدید تحقیقی انجن ہے۔ اپنا تحقیقی سوال نیچے لکھیں۔
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-24 pt-4">
              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} onSuggestionClick={(s) => onSendMessage(s, [])} />
              ))}
              {isLoading && (
                <div className="flex justify-start px-2">
                  <div className="px-3 py-1.5 rounded-xl bg-white shadow-sm flex items-center gap-2 border border-sky-100 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin" />
                    <span className="urdu-text text-xs font-black text-sky-600">تحقیق جاری ہے...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center p-4">
                  <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 border border-red-100 urdu-text font-bold text-sm">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      <footer className="w-full shrink-0 pt-2 pb-4 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-chat mx-auto w-full space-y-3">
          <form onSubmit={handleSubmit} className="relative w-full">
            <div className="relative flex items-end gap-1.5 w-full border border-slate-200 rounded-[1.8rem] p-1.5 bg-white shadow-2xl focus-within:border-sky-400 transition-all">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-sky-600"><Paperclip className="w-5 h-5" /></button>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="تحقیق شروع کریں..."
                className="flex-1 bg-transparent border-none focus:ring-0 px-2 py-2.5 resize-none urdu-text text-right font-bold text-sky-900"
                style={{ fontSize: '16px' }}
                dir="auto"
              />
              <div className="flex items-center gap-1.5 pr-1">
                <button type="button" className="p-2.5 text-slate-400 hover:text-sky-600"><Mic className="w-5 h-5" /></button>
                <button type="submit" disabled={!input.trim() || isLoading} className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center disabled:opacity-50"><ArrowUp size={24} /></button>
              </div>
            </div>
            <input type="file" multiple ref={fileInputRef} className="hidden" />
          </form>
        </div>
      </footer>
    </div>
  );
};
