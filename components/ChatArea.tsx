
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, Mic, Paperclip, Menu, Newspaper, Loader2, RefreshCcw, Calendar, Radio, AlertCircle, Cpu, Share2, MessageCircle, Wand2, BookOpen, RotateCcw, Eye } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings } from '../types';
import { MOCK_CONTACTS } from '../constants';
import { chatGRC } from '../services/geminiService';

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
  settings,
  onToggleSidebar,
  onRefreshContext,
  isImageMode,
  setIsImageMode
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [combinedDate, setCombinedDate] = useState('');
  
  const isReadOnly = window.location.search.includes('view=shared');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      let dayName = new Intl.DateTimeFormat('ur-PK', { weekday: 'long' }).format(now);
      if (dayName === 'جمعہ') dayName = 'جمعۃ المبارک';
      const gregDate = new Intl.DateTimeFormat('ur-PK', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
      setCombinedDate(`${dayName}، ${gregDate}`);
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isReadOnly || isLoading || !input.trim()) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
  };

  return (
    <div className={`flex-1 flex flex-col h-full w-full overflow-hidden ${settings.highContrast ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <header className="h-11 flex items-center justify-between px-2 shrink-0 z-30 shadow-sm border-b border-sky-100 bg-gradient-to-r from-[#0369a1] to-[#0c4a6e] text-white">
        <div className="flex items-center gap-1">
          {!isReadOnly && (
            <button onClick={onToggleSidebar} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
              <Menu size={18} />
            </button>
          )}
          {isReadOnly && <span className="urdu-text text-[7px] px-2 py-0.5 bg-white/10 rounded-full font-black">ایپ موڈ</span>}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
           <button onClick={onStartVoice} className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/20 shrink-0">
              <Radio size={10} className="text-emerald-400 animate-pulse" />
              <span className="urdu-text text-[8px] font-black">لائیو</span>
           </button>
           <button onClick={onFetchNews} className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg shrink-0">
              <Newspaper size={10} />
              <span className="urdu-text text-[8px] font-black">خبریں</span>
           </button>
           <button onClick={onFetchAIUpdates} className="flex items-center gap-1 px-2 py-1 bg-sky-500/20 rounded-lg border border-sky-500/20 shrink-0">
              <Cpu size={10} className="text-sky-300" />
              <span className="urdu-text text-[8px] font-black text-white">AI</span>
           </button>
           {!isReadOnly && (
             <button onClick={onRefreshContext} className="p-2 shrink-0"><RefreshCcw size={12} /></button>
           )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth overscroll-contain">
        <div className="w-full max-w-chat mx-auto px-4 flex flex-col min-h-full">
          {!session || session.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-2">
              <div className="text-center space-y-1 w-full max-w-lg">
                
                <div className="relative inline-flex items-center justify-center w-8 h-8 bg-gradient-to-tr from-sky-500 to-sky-800 rounded-lg border border-white shadow-md mb-1">
                  <Sparkles size={16} className="text-white" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                    <BookOpen size={5} className="text-white" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="px-1.5 py-0.5 rounded-full bg-white border border-sky-50 shadow-sm">
                    <span className="urdu-text text-[7px] font-black text-sky-950">{combinedDate}</span>
                  </div>

                  <div className="space-y-0.5">
                    <h2 className="urdu-text text-base font-black text-sky-950">السلام علیکم!</h2>
                    <p className="urdu-text text-[10px] font-bold text-sky-800">میں <span className="text-sky-600 font-black">اردو اے آئی</span> ہوں، آپ کا مستند تحقیقی معاون۔</p>
                    <div className="p-2 bg-white rounded-lg border border-sky-50 shadow-sm max-w-[240px] mx-auto">
                      <p className="urdu-text text-[9px] font-medium text-slate-600 leading-relaxed">
                        قرآن، حدیث اور علومِ اسلامیہ میں علامہ غلام رسول سعیدی کے اسلوب میں سو فیصد مستند رہنمائی حاصل کریں۔
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-28 pt-2">
              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} onSuggestionClick={(s) => isReadOnly ? null : onSendMessage(s, [])} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-1.5 rounded-xl bg-white shadow-sm flex items-center gap-2 border border-sky-50 animate-pulse">
                    <Loader2 size={12} className="text-sky-500 animate-spin" />
                    <span className="urdu-text text-[9px] font-black text-sky-600">تحقیق جاری ہے...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {!isReadOnly && (
        <footer className="w-full shrink-0 bg-white/95 border-t border-slate-100 z-30 pb-safe">
          <div className="max-w-chat mx-auto w-full px-4 py-1.5">
            <form onSubmit={handleSubmit} className="relative w-full">
              <div className="relative flex items-center gap-1 w-full border rounded-xl p-0.5 bg-white shadow-sm border-slate-200">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400"><Paperclip size={16} /></button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="تحقیق کریں..."
                  className="flex-1 bg-transparent border-none focus:ring-0 px-1 py-1.5 urdu-text text-right font-bold text-sky-900 text-sm"
                />
                <button type="submit" disabled={!input.trim() || isLoading} className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-600 text-white shadow-sm active:scale-95 shrink-0 ml-1">
                  <ArrowUp size={18} />
                </button>
              </div>
              <input type="file" multiple ref={fileInputRef} onChange={() => {}} className="hidden" />
            </form>
            <div className="flex justify-center mt-1">
              <p className="text-[8px] text-slate-400 font-bold urdu-text">گلوبل ریسرچ سینٹر - قاری خالد محمود گولڈ میڈلسٹ</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
