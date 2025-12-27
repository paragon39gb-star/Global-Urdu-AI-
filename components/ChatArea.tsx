import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, Mic, Paperclip, Menu, Newspaper, Loader2, RefreshCcw, Calendar, Radio, AlertCircle, Cpu, Share2, MessageCircle } from 'lucide-react';
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
  settings,
  onToggleSidebar,
  onRefreshContext
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [combinedDate, setCombinedDate] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Urdu AI - اردو اے آئی',
          text: 'قاری خالد محمود گولڈ میڈلسٹ کا مستند تحقیقی اسسٹنٹ۔ قرآن، حدیث اور علوم اسلامیہ پر تفصیلی تحقیق کے لیے ابھی جوائن کریں۔',
          url: window.location.origin,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('ایپ کا لنک کاپی کر لیا گیا ہے۔');
    }
  };

  const handleShareChatWhatsApp = () => {
    if (!session || session.messages.length === 0) return;
    const chatHistory = session.messages.map(m => `*${m.role === 'user' ? 'سوال' : 'جواب'}*: ${m.content}`).join('\n\n---\n\n');
    const text = encodeURIComponent(`*Urdu AI Full Research Chat*\n\n${chatHistory}\n\n_Powered by Global Research Center_`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${settings.highContrast ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <header className={`h-16 flex items-center justify-between px-2 md:px-6 shrink-0 z-30 shadow-lg border-b border-white/10 transition-colors ${contact ? 'bg-[#075e54] text-white' : 'bg-gradient-to-r from-[#0369a1] via-[#075985] to-[#0c4a6e]'}`}>
        <div className="flex items-center gap-1 md:gap-2 overflow-hidden">
          <button onClick={onToggleSidebar} className="p-2 hover:bg-white/20 rounded-xl text-white transition-all active:scale-90 shrink-0">
            <Menu className="w-6 h-6" />
          </button>
          {/* Urdu AI text removed from header */}
        </div>

        <div className="flex items-center gap-1.5 md:gap-2.5 overflow-x-auto no-scrollbar py-1">
           {/* لائیو بٹن */}
           <button onClick={onStartVoice} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl border border-emerald-500/20 transition-all active:scale-95 group shadow-sm shrink-0">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="urdu-text text-[10px] md:text-xs font-black text-white">لائیو</span>
           </button>
           
           {/* خبریں بٹن */}
           <button onClick={onFetchNews} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all active:scale-95 group shadow-sm shrink-0">
              <Newspaper className="w-5 h-5 text-white" />
              <span className="urdu-text text-[10px] md:text-xs font-black text-white">خبریں</span>
           </button>

           {/* AI بٹن */}
           <button onClick={onFetchAIUpdates} className="flex items-center gap-2 px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 rounded-xl border border-sky-500/10 transition-all active:scale-95 group shadow-sm shrink-0">
              <Cpu className="w-5 h-5 text-sky-400" />
              <span className="urdu-text text-[10px] md:text-xs font-black text-white">AI</span>
           </button>

           {/* شیئر ایپ بٹن */}
           <button onClick={handleShareApp} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 shrink-0" title="شیئر ایپ">
              <Share2 className="w-5.5 h-5.5" />
           </button>

           {/* ری فریش بٹن */}
           <button onClick={onRefreshContext} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 shrink-0" title="ری فریش">
              <RefreshCcw className="w-5.5 h-5.5" />
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative">
        <div className="w-full max-w-chat mx-auto px-4 flex flex-col min-h-full relative z-10">
          {!session || session.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 animate-bubble space-y-6">
              <div className="text-center space-y-4 w-full max-w-lg">
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-[#0ea5e9] to-[#0c4a6e] rounded-[1.2rem] border-2 border-white shadow-2xl rotate-2">
                  <span className="text-white text-3xl font-bold animate-pulse">U</span>
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-black urdu-text text-slate-900 tracking-tight">Urdu AI (اردو اے آئی)</h2>
                  <div className="flex justify-center">
                    <div className="px-5 py-2.5 rounded-2xl bg-white/90 border border-sky-100 shadow-xl flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span className="urdu-text text-sm font-black text-sky-900">{combinedDate}</span>
                    </div>
                  </div>
                  <div className="max-w-md mx-auto p-6 md:p-8 rounded-3xl border-x-4 border-sky-500 shadow-2xl bg-white/95 backdrop-blur-sm">
                    <p className="urdu-text text-base md:text-lg font-bold text-sky-900 text-center leading-relaxed" dir="rtl">
                      اردو اے آئی ایک جدید تحقیقی انجن ہے۔ اپنا تحقیقی سوال نیچے لکھیں یا لائیو بٹن دبا کر گفتگو کریں۔
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-28 pt-6">
              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} onSuggestionClick={(s) => onSendMessage(s, [])} />
              ))}
              
              {!isLoading && session.messages.length > 0 && (
                <div className="flex justify-center py-6 animate-in fade-in zoom-in duration-500">
                  <button 
                    onClick={handleShareChatWhatsApp}
                    className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#25D366] text-white shadow-xl hover:bg-[#128C7E] active:scale-95 transition-all urdu-text font-black text-sm"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>پوری گفتگو واٹس ایپ پر بھیجیں</span>
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start px-2">
                  <div className="px-4 py-2 rounded-2xl bg-white shadow-xl flex items-center gap-3 border border-sky-100 animate-pulse">
                    <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                    <span className="urdu-text text-sm font-black text-sky-600">تحقیق جاری ہے...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center p-4">
                  <div className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl flex items-center gap-3 border border-red-100 urdu-text font-bold text-sm shadow-lg">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      <footer className="w-full shrink-0 pt-2 pb-6 px-4 bg-white/60 backdrop-blur-md border-t border-slate-100">
        <div className="max-w-chat mx-auto w-full">
          <form onSubmit={handleSubmit} className="relative w-full">
            <div className="relative flex items-end gap-2 w-full border border-slate-200 rounded-[2rem] p-2 bg-white shadow-2xl focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-400 transition-all duration-300">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-sky-600 transition-colors"><Paperclip className="w-5 h-5" /></button>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="تحقیق شروع کریں..."
                className="flex-1 bg-transparent border-none focus:ring-0 px-2 py-3 resize-none urdu-text text-right font-bold text-sky-900 min-h-[48px] max-h-32"
                style={{ fontSize: '16px' }}
                dir="auto"
              />
              <div className="flex items-center gap-2 pr-1">
                <button type="button" onClick={onStartVoice} className="p-3 text-slate-400 hover:text-emerald-600 transition-colors"><Mic className="w-5 h-5" /></button>
                <button type="submit" disabled={!input.trim() || isLoading} className="w-11 h-11 rounded-full bg-sky-600 text-white flex items-center justify-center disabled:opacity-50 shadow-lg shadow-sky-600/20 hover:bg-sky-700 active:scale-95 transition-all"><ArrowUp size={24} /></button>
              </div>
            </div>
            <input type="file" multiple ref={fileInputRef} className="hidden" />
          </form>
          {/* Urdu AI text added to footer here */}
          <div className="flex flex-col items-center mt-3 gap-0.5">
            <span className="font-black text-xl urdu-text text-sky-700 drop-shadow-sm">Urdu AI</span>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest urdu-text">گلوبل ریسرچ سینٹر - قاری خالد محمود</p>
          </div>
        </div>
      </footer>
    </div>
  );
};