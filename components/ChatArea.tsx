
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, ArrowUp, Mic, Paperclip, ChevronDown, Menu, Newspaper, Zap, Loader2, RefreshCcw, Award, Calendar, Radio } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings } from '../types';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(new Intl.DateTimeFormat('ur-PK', options).format(now));
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ur-PK';
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
      };
      recognitionRef.current.onend = () => setIsListeningInput(false);
      recognitionRef.current.onerror = () => setIsListeningInput(false);
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshContext();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const toggleInputListening = () => {
    if (!recognitionRef.current) return alert("براؤزر سپورٹ نہیں کرتا۔");
    if (isListeningInput) {
      recognitionRef.current.stop();
    } else {
      try { recognitionRef.current.start(); setIsListeningInput(true); } catch (e) {}
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isListeningInput) recognitionRef.current.stop();
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

  const getLineHeight = () => {
    if (settings.fontFamily === 'nastaleeq') return '2.2';
    if (settings.fontFamily === 'naskh') return '1.8';
    return '1.5';
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${settings.highContrast ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <header className="h-14 flex items-center justify-between px-3 md:px-6 shrink-0 bg-gradient-to-r from-[#0369a1] via-[#075985] to-[#0c4a6e] z-30 shadow-lg border-b border-white/10">
        <div className="flex items-center gap-2 md:gap-4">
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
           <button onClick={onFetchAIUpdates} className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all active:scale-95 group">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="urdu-text text-[9px] md:text-xs font-black text-white">AI</span>
           </button>
           <button onClick={handleRefresh} className="p-1.5 text-white/50 hover:text-white hover:bg-white/20 rounded-lg transition-all" title="ری فریش">
              <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </header>

      <div className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth relative ${settings.highContrast ? 'bg-slate-950' : 'bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]'}`}>
        {!settings.highContrast && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] opacity-10 pointer-events-none"></div>}
        
        <div className="w-full max-w-chat mx-auto px-4 flex flex-col min-h-full relative z-10">
          {!session || session.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-4 animate-bubble space-y-4">
              <div className="text-center space-y-3">
                <div className="relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#0ea5e9] to-[#0c4a6e] rounded-[1rem] border-2 border-white shadow-xl rotate-1">
                  <Sparkles className="text-white w-7 h-7 animate-pulse" />
                  <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 rounded-full p-1 shadow-sm border border-white">
                    <Award className="w-3 h-3 text-sky-900" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className={`text-2xl md:text-3xl font-black urdu-text leading-tight ${settings.highContrast ? 'text-white' : 'text-slate-900'}`}>Urdu AI (اردو اے آئی)</h2>
                  
                  <div className="flex justify-center">
                    <div className={`px-3 py-1 rounded-full border shadow-sm flex items-center gap-2 backdrop-blur-md ${settings.highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white/80 border-[#0ea5e9]/10'}`}>
                      <Calendar className={`w-3 h-3 ${settings.highContrast ? 'text-sky-400' : 'text-[#000080]'}`} />
                      <span className={`urdu-text text-[10px] md:text-xs font-black ${settings.highContrast ? 'text-sky-300' : 'text-[#000080]'}`}>{currentDate}</span>
                    </div>
                  </div>

                  <div className={`max-w-md mx-auto p-4 md:p-6 rounded-[1rem] border-x-2 border-[#0ea5e9] shadow-lg backdrop-blur-md ${settings.highContrast ? 'bg-slate-900/80 border-sky-600' : 'bg-white/90 border-[#0ea5e9]/20'}`}>
                    <p className={`urdu-text text-sm md:text-base font-bold leading-relaxed text-center ${settings.highContrast ? 'text-slate-200' : 'text-[#000080]'}`} dir="rtl">
                      اردو اے آئی ایک جدید تحقیقی انجن ہے جسے قاری خالد محمود گولڈ میڈلسٹ کی زیر نگرانی گلوبل ریسرچ سینٹر نے تیار کیا ہے۔ اپنا تحقیقی سوال نیچے لکھیں۔
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-24 pt-4">
              {session.messages.map((msg) => (
                <div key={msg.id} className="w-full">
                  <MessageBubble message={msg} settings={settings} />
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start px-2">
                  <div className={`px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2.5 border animate-pulse backdrop-blur-sm ${settings.highContrast ? 'bg-slate-900 border-sky-900' : 'bg-white/90 border-[#0ea5e9]/20'}`}>
                    <Loader2 className="w-3.5 h-3.5 text-[#0ea5e9] animate-spin" />
                    <span className="urdu-text text-[10px] font-black text-[#0ea5e9]">تحقیق...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      <footer className={`w-full shrink-0 pt-1 pb-3 px-3 ${settings.highContrast ? 'bg-slate-950/80' : 'bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/95 to-transparent'}`}>
        <div className="max-w-chat mx-auto w-full">
          <form onSubmit={handleSubmit} className="relative w-full">
            <div className={`relative flex flex-col w-full border rounded-[1rem] p-1 transition-all shadow-lg backdrop-blur-md ${settings.highContrast ? 'bg-slate-900 border-slate-700 focus-within:border-sky-500' : 'bg-white border-slate-200 focus-within:border-[#0ea5e9]/30'}`}>
              
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => { 
                  setInput(e.target.value); 
                  e.target.style.height = 'auto'; 
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`; 
                }}
                onKeyDown={handleKeyDown}
                placeholder="سوال لکھیں..."
                className={`w-full bg-transparent border-none focus:ring-0 px-4 py-2 md:py-3 resize-none no-scrollbar urdu-text text-right font-bold transition-all duration-200 ${settings.highContrast ? 'text-white placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`}
                style={{ 
                  fontSize: `15px`, 
                  lineHeight: '1.4',
                  minHeight: `38px`
                }}
                dir="auto"
              />

              <div className="flex items-center justify-between px-2 pb-0.5">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-400 hover:text-[#0ea5e9] transition-all">
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={toggleInputListening} className={`p-1.5 rounded-full transition-all ${isListeningInput ? 'text-white bg-red-500' : 'text-slate-400 hover:text-[#0ea5e9]'}`}>
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="submit" 
                    disabled={(!input.trim() && attachments.length === 0) || isLoading} 
                    className={`w-7 h-7 rounded-full transition-all flex items-center justify-center shadow-md active:scale-90 ${input.trim() || attachments.length > 0 ? 'bg-[#0369a1] text-white' : 'bg-slate-100 text-slate-300'}`}
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUp className="w-3.5 h-3.5" strokeWidth={3} />}
                  </button>
                </div>
              </div>
            </div>
            
            <input type="file" multiple ref={fileInputRef} className="hidden" />
          </form>
        </div>
      </footer>
    </div>
  );
};
