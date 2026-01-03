
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowUp, Mic, Loader2, Plus, X, MicOff, Sparkles, Menu, Home, Calendar } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings } from '../types';

interface ChatAreaProps {
  session: ChatSession | null;
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onFetchNews: () => void;
  onFetchAIUpdates: () => void;
  onFetchIntro: () => void;
  onShowIntroModal: () => void;
  isLoading: boolean;
  settings: UserSettings;
  onToggleSidebar: () => void;
  onRefreshContext: () => void;
  isAuthorized?: boolean;
  onAuthorize?: () => void;
  onGoHome: () => void;
  onRetry?: (msgId: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  onSendMessage,
  onFetchNews,
  onFetchAIUpdates,
  onFetchIntro,
  onShowIntroModal,
  isLoading,
  settings,
  onToggleSidebar,
  onGoHome,
  onRetry
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const urduDate = useMemo(() => {
    const now = new Date();
    return new Intl.DateTimeFormat('ur-PK', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(now);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (session?.messages && session.messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ur-PK';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files) as File[]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAttachments(prev => [...prev, {
          name: file.name,
          mimeType: file.type,
          data: base64,
          previewUrl: file.type.startsWith('image/') ? base64 : undefined
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full w-full overflow-hidden ${settings.highContrast ? 'bg-slate-950' : 'bg-white'}`}>
      
      <header className="h-16 md:h-18 flex items-center justify-between px-4 md:px-6 shrink-0 z-30 bg-[#0c4a6e] text-white shadow-md relative">
        <div className="flex items-center gap-2">
          <button onClick={onToggleSidebar} className="p-2 hover:bg-white/10 rounded-xl transition-all"><Menu size={24} /></button>
          <button onClick={onGoHome} className="p-2 hover:bg-white/10 rounded-xl transition-all hidden md:flex items-center gap-2">
            <Home size={20} /><span className="text-xs urdu-text font-black">ہوم</span>
          </button>
        </div>

        <div className="flex items-center gap-1 md:gap-4 overflow-x-auto no-scrollbar py-2">
          <button onClick={onFetchIntro} className="text-[10px] md:text-sm font-black urdu-text px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all whitespace-nowrap">تعارف</button>
          <button onClick={onFetchNews} className="text-[10px] md:text-sm font-black urdu-text px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all whitespace-nowrap">نیوز اپ ڈیٹ</button>
          <button onClick={onFetchAIUpdates} className="text-[10px] md:text-sm font-black urdu-text px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all whitespace-nowrap">اے آئی خبریں</button>
        </div>

        <div className="w-8 md:w-12 shrink-0"></div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative bg-white">
        <div className="w-full max-w-3xl mx-auto space-y-4 py-8 px-4 md:px-0">
          
          {(!session || session.messages.length === 0) && (
            <div className="text-center space-y-6 pb-12 pt-4">
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="text-yellow-500 w-16 h-16 md:w-24 md:h-24 mb-2 drop-shadow-xl animate-pulse" />
                <div className="flex items-baseline gap-1" dir="ltr">
                  <span className="text-5xl md:text-8xl font-black tracking-tight text-[#0c4a6e]">Urdu</span>
                  <span className="text-5xl md:text-8xl font-black tracking-tight text-yellow-500">AI</span>
                </div>
                <h1 className="text-2xl md:text-4xl font-black urdu-text text-sky-900 mt-2">اُردو اے آئی تحقیقی انجن</h1>
                
                {/* Beautiful Colorized Date Display */}
                <div className="mt-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-50 via-white to-sky-50 border border-sky-100 shadow-sm inline-flex items-center gap-3">
                  <Calendar size={18} className="text-sky-600 animate-bounce" />
                  <span className="urdu-text text-xs md:text-lg font-black bg-gradient-to-l from-sky-800 via-indigo-700 to-sky-800 bg-clip-text text-transparent">
                    {urduDate}
                  </span>
                </div>
              </div>

              {/* Short & Concise Intro Section */}
              <div className="mx-4 md:mx-auto max-w-xl">
                <p className="urdu-text text-base md:text-lg text-slate-600 leading-[1.8] font-bold text-center">
                  اُردو اے آئی گلوبل ریسرچ سینٹر کا ایک جدید تحقیقی منصوبہ ہے جو قاری خالد محمود گولڈ میڈلسٹ کی نگرانی میں مستند علمی معلومات کی فراہم کے لیے وقف ہے۔
                </p>
              </div>
            </div>
          )}

          <div className="space-y-0">
            {session?.messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                settings={settings} 
                onSuggestionClick={(s) => onSendMessage(s, [])} 
                onRetry={() => onRetry?.(msg.id)}
              />
            ))}
          </div>

          {isLoading && (
              <div className="flex justify-start px-6 py-4">
                <div className="flex items-center gap-3 bg-sky-50 px-4 py-2 rounded-xl border border-sky-100">
                  <Loader2 size={16} className="animate-spin text-sky-600" />
                  <span className="urdu-text text-sm font-black text-sky-800">تحقیق جاری ہے...</span>
                </div>
              </div>
          )}
          <div ref={messagesEndRef} className="h-10" />
        </div>
      </div>

      <footer className="w-full shrink-0 bg-white border-t border-slate-100 p-3 md:p-6 pb-safe z-30">
        <div className="max-w-3xl mx-auto">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative group">
                  {att.previewUrl ? (
                    <img src={att.previewUrl} className="w-12 h-12 rounded-lg object-cover border border-white shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center text-sky-600">
                      <Plus size={20} />
                    </div>
                  )}
                  <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md"><X size={10} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex flex-col bg-slate-50 border-2 border-slate-200 rounded-[2rem] focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-500/5 transition-all shadow-sm">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*"/>
              <div className="flex items-end gap-2 p-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-sky-600 shrink-0 mb-1"><Plus size={24} /></button>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اردو میں سوال لکھیں..."
                  className="flex-1 bg-transparent border-none focus:ring-0 urdu-text text-right py-3 text-base md:text-xl font-bold text-sky-950 placeholder:text-slate-300 resize-none min-h-[52px] max-h-[200px] no-scrollbar"
                />
                <div className="flex items-center gap-1 shrink-0 px-1 mb-1">
                  <button onClick={toggleListening} className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'text-slate-400 hover:text-sky-600'}`}>{isListening ? <MicOff size={22} /> : <Mic size={22} />}</button>
                  <button onClick={() => handleSubmit()} disabled={(!input.trim() && attachments.length === 0) || isLoading} className="p-3.5 bg-[#0c4a6e] text-white rounded-full disabled:opacity-20 shadow-xl flex items-center justify-center group active:scale-95"><ArrowUp size={24} strokeWidth={3} className="group-hover:-translate-y-1 transition-transform" /></button>
                </div>
              </div>
          </div>
          <div className="mt-2 text-center">
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest urdu-text">تمام حقوق بحق گلوبل ریسرچ سینٹر محفوظ ہیں</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
