
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, Mic, Paperclip, ChevronDown, Menu, Newspaper, Zap, Loader2, RefreshCcw, Award, Calendar, Radio } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings } from '../types';
import { UNIQUENESS_POINTS, SUGGESTIONS_POOL } from '../constants';

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
  const [activeSuggestions, setActiveSuggestions] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Helper to get random suggestions
  const refreshSuggestions = () => {
    const shuffled = [...SUGGESTIONS_POOL].sort(() => 0.5 - Math.random());
    setActiveSuggestions(shuffled.slice(0, 4));
  };

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
    refreshSuggestions(); // Initial suggestions
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
    refreshSuggestions(); // Change bubbles on refresh
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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 250)}px`;
        }
      }, 0);
    }
  };

  const getLineHeight = () => {
    if (settings.fontFamily === 'nastaleeq') return '2.2';
    if (settings.fontFamily === 'naskh') return '1.8';
    return '1.5';
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${settings.highContrast ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <header className="h-16 flex items-center justify-between px-3 md:px-6 shrink-0 bg-gradient-to-r from-[#0369a1] via-[#075985] to-[#0c4a6e] z-30 shadow-xl border-b border-white/10">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onToggleSidebar} className="lg:hidden p-2 hover:bg-white/20 rounded-xl text-white transition-all active:scale-90">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl md:text-2xl urdu-text text-white drop-shadow-md tracking-tight">Urdu AI</span>
              <Award className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-3">
           <button onClick={onStartVoice} className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl border border-emerald-500/20 transition-all active:scale-95 group shadow-lg">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="urdu-text text-[10px] md:text-sm font-black text-white">لائیو</span>
           </button>
           <button onClick={onFetchNews} className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all active:scale-95">
              <Newspaper className="w-4 h-4 text-white" />
              <span className="urdu-text text-[10px] md:text-sm font-black text-white">خبریں</span>
           </button>
           <button onClick={onFetchAIUpdates} className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all active:scale-95">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="urdu-text text-[10px] md:text-sm font-black text-white">AI</span>
           </button>
           <button onClick={handleRefresh} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all active:rotate-180 duration-500">
              <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </header>

      <div className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth relative ${settings.highContrast ? 'bg-slate-950' : 'bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]'}`}>
        {!settings.highContrast && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] opacity-30 pointer-events-none"></div>}
        
        <div className="w-full max-w-chat mx-auto px-4 py-2 md:py-4 flex flex-col min-h-full relative z-10">
          {!session || session.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-bubble">
              <div className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-[#0ea5e9]/20 to-white rounded-3xl border-2 border-[#0ea5e9]/30 shadow-2xl rotate-3">
                  <Sparkles className="text-[#0ea5e9] w-10 h-10 animate-pulse" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1.5 shadow-lg">
                    <Award className="w-4 h-4 text-sky-900" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className={`text-3xl md:text-4xl font-black urdu-text leading-tight drop-shadow-sm ${settings.highContrast ? 'text-white' : 'text-slate-900'}`}>Urdu AI (اردو اے آئی)</h2>
                  <p className={`text-lg md:text-xl font-bold urdu-text opacity-90 ${settings.highContrast ? 'text-sky-400' : 'text-[#000080]'}`}>آپ کا مستند تحقیقی ساتھی</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                  {UNIQUENESS_POINTS.map((p, i) => (
                    <div key={i} className={`p-3 rounded-2xl text-right border-b-4 border-[#0ea5e9] shadow-lg hover:translate-y-[-2px] transition-all duration-300 backdrop-blur-sm ${settings.highContrast ? 'bg-slate-900/50 border-sky-600' : 'bg-white/70'}`}>
                      <h3 className={`urdu-text font-black text-sm mb-1 ${settings.highContrast ? 'text-sky-300' : 'text-[#000080]'}`}>{p.title}</h3>
                      <p className={`urdu-text text-[10px] leading-relaxed font-bold ${settings.highContrast ? 'text-slate-300' : 'text-slate-700'}`}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-32">
              <div className="flex justify-center mb-6">
                <div className={`px-5 py-2 rounded-2xl border shadow-md flex items-center gap-2 group hover:border-[#0ea5e9]/50 transition-all backdrop-blur-md ${settings.highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white/80 border-[#0ea5e9]/20'}`}>
                  <Calendar className={`w-4 h-4 group-hover:scale-110 transition-transform ${settings.highContrast ? 'text-sky-400' : 'text-[#000080]'}`} />
                  <span className={`urdu-text text-xs md:text-sm font-black ${settings.highContrast ? 'text-sky-300' : 'text-[#000080]'}`}>{currentDate}</span>
                </div>
              </div>

              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} />
              ))}
              {isLoading && session.messages[session.messages.length-1]?.role === 'user' && (
                <div className="flex justify-start px-2">
                  <div className={`px-4 py-2 rounded-2xl shadow-lg flex items-center gap-3 border animate-pulse backdrop-blur-sm ${settings.highContrast ? 'bg-slate-900 border-sky-900' : 'bg-white/90 border-[#0ea5e9]/30'}`}>
                    <Loader2 className="w-4 h-4 text-[#0ea5e9] animate-spin" />
                    <span className="urdu-text text-xs font-black text-[#0ea5e9]">تحقیق جاری ہے...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      <footer className={`w-full shrink-0 pt-2 pb-4 md:pb-8 px-4 ${settings.highContrast ? 'bg-slate-950/80' : 'bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent'}`}>
        <form onSubmit={handleSubmit} className="max-w-chat mx-auto relative">
          
          {/* Quick Suggestions - Dynamic Selection */}
          {input.length === 0 && !isLoading && (
            <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-1 px-1" dir="rtl">
              {activeSuggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestionClick(s.ur)}
                  className={`shrink-0 px-4 py-2 rounded-full border text-[11px] md:text-[13px] urdu-text font-black transition-all active:scale-95 hover:shadow-md ${settings.highContrast ? 'bg-slate-900 border-slate-700 text-sky-400 hover:border-sky-500' : 'bg-white border-[#0ea5e9]/20 text-[#0369a1] hover:border-[#0ea5e9]/50'}`}
                >
                  {s.ur}
                </button>
              ))}
            </div>
          )}

          <div className={`relative flex flex-col w-full border-2 rounded-[1.8rem] md:rounded-[2.4rem] p-1.5 transition-all shadow-2xl backdrop-blur-sm ${settings.highContrast ? 'bg-slate-900 border-slate-700 focus-within:border-sky-500' : 'bg-white/95 border-[#0ea5e9]/30 focus-within:border-[#0ea5e9]'}`}>
            
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => { 
                setInput(e.target.value); 
                e.target.style.height = 'auto'; 
                e.target.style.height = `${Math.min(e.target.scrollHeight, 250)}px`; 
              }}
              onKeyDown={handleKeyDown}
              placeholder="کچھ پوچھیں..."
              className={`w-full bg-transparent border-none focus:ring-0 px-5 md:px-7 py-4 md:py-5 resize-none no-scrollbar urdu-text text-right font-bold transition-all duration-200 ${settings.highContrast ? 'text-white placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`}
              style={{ 
                fontSize: `${settings.fontSize}px`, 
                lineHeight: getLineHeight(),
                minHeight: `${Math.max(40, settings.fontSize * 1.8)}px`
              }}
              dir="auto"
            />

            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/10 rounded-full transition-all active:scale-90">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button type="button" onClick={toggleInputListening} className={`p-2.5 rounded-full transition-all active:scale-90 ${isListeningInput ? 'text-white bg-red-500 shadow-lg animate-pulse' : 'text-slate-400 hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/10'}`}>
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {input.length > 0 && (
                   <span className="text-[11px] font-black opacity-30 px-2 py-1 bg-slate-100 rounded-lg hidden md:inline">{input.length}</span>
                )}
                <button 
                  type="submit" 
                  disabled={(!input.trim() && attachments.length === 0) || isLoading} 
                  className={`w-11 h-11 md:w-13 md:h-13 rounded-full transition-all flex items-center justify-center shadow-xl active:scale-90 ${input.trim() || attachments.length > 0 ? 'bg-[#0369a1] text-white hover:bg-[#075985]' : 'bg-slate-100 text-slate-300'}`}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-6 h-6" strokeWidth={3} />}
                </button>
              </div>
            </div>
          </div>
          
          <input type="file" multiple ref={fileInputRef} className="hidden" />
          
          <div className="mt-2 flex flex-col items-center gap-0.5 opacity-80">
            <p className={`text-[12px] md:text-[14px] font-black uppercase tracking-[0.2em] urdu-text text-center ${settings.highContrast ? 'text-sky-400' : 'text-[#000080]'}`}>
              Global Research Centre
            </p>
            <p className={`text-[10px] md:text-[12px] urdu-text font-black ${settings.highContrast ? 'text-slate-400' : 'text-slate-500'}`}>
              از قاری خالد محمود گولڈ میڈلسٹ
            </p>
          </div>
        </form>
      </footer>
    </div>
  );
};
