
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, Mic, Paperclip, ChevronDown, Menu, Newspaper, Zap, Loader2, Calendar, RefreshCcw, BookOpen, Scale, Heart, ShieldCheck } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings } from '../types';
import { SUGGESTIONS, UNIQUENESS_POINTS } from '../constants';

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
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isListeningInput, setIsListeningInput] = useState(false);
  const [currentDateInfo, setCurrentDateInfo] = useState({ day: '', fullDate: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  useEffect(() => {
    const now = new Date();
    const day = now.toLocaleDateString('ur-PK', { weekday: 'long' });
    const fullDate = now.toLocaleDateString('ur-u-nu-latn', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    setCurrentDateInfo({ day, fullDate });

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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="text-sky-400" size={24} />;
      case 'Scale': return <Scale className="text-emerald-400" size={24} />;
      case 'Heart': return <Heart className="text-rose-400" size={24} />;
      default: return <ShieldCheck className="text-sky-400" size={24} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#020617]">
      <div className="flex-1 flex flex-col md:glass-panel md:m-3 md:rounded-[2rem] overflow-hidden shadow-2xl relative border-0 md:border border-white/10">
        
        {/* Header */}
        <header className="h-16 md:h-24 flex items-center justify-between px-2 md:px-10 border-b border-white/10 sticky top-0 z-30 shrink-0 bg-[#0f172a]/95 backdrop-blur-3xl">
          <div className="flex items-center gap-1 md:gap-4">
            <button onClick={onToggleSidebar} className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-colors">
              <Menu className="w-5 h-5 md:w-7 md:h-7" />
            </button>
            <div className="relative">
              <button onClick={() => setShowModelMenu(!showModelMenu)} className="flex items-center gap-1.5 md:gap-4 px-1 hover:bg-white/5 rounded-2xl transition-all py-1">
                <div className="hidden md:block w-4 h-4 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.6)] animate-pulse" />
                <span className="font-black urdu-text text-xl md:text-5xl text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">Chat GRC</span>
                <ChevronDown className={`text-sky-400 transition-transform duration-300 w-4 h-4 md:w-6 md:h-6 ${showModelMenu ? 'rotate-180' : ''}`} />
              </button>
              {showModelMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 glass-panel border-white/10 rounded-2xl shadow-2xl py-3 z-50 bg-[#1e293b]">
                  <button onClick={() => { onModelChange('gemini-3-pro-preview'); setShowModelMenu(false); }} className={`w-full text-right px-5 py-3 hover:bg-sky-500/10 urdu-text text-sm md:text-lg text-white border-r-4 transition-all ${selectedModel.includes('pro') ? 'border-sky-400 bg-sky-500/10' : 'border-transparent'}`}>Chat GRC Pro (Turbo)</button>
                  <button onClick={() => { onModelChange('gemini-3-flash-preview'); setShowModelMenu(false); }} className={`w-full text-right px-5 py-3 hover:bg-sky-500/10 urdu-text text-sm md:text-lg text-white border-r-4 transition-all ${selectedModel.includes('flash') ? 'border-sky-400 bg-sky-500/10' : 'border-transparent'}`}>Chat GRC Lite (Flash)</button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
             <button onClick={onFetchNews} className="flex items-center gap-1 px-2 md:px-4 py-1.5 md:py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 transition-all">
                <Newspaper className="w-4 h-4 md:w-5 md:h-5" />
                <span className="urdu-text text-[10px] md:text-base font-bold">خبریں</span>
             </button>
             <button onClick={onFetchAIUpdates} className="flex items-center gap-1 px-2 md:px-4 py-1.5 md:py-2.5 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 rounded-xl border border-violet-500/20 transition-all">
                <Zap className="w-4 h-4 md:w-5 md:h-5" />
                <span className="urdu-text text-[10px] md:text-base font-bold">AI اپڈیٹس</span>
             </button>
             <button onClick={onStartVoice} className="p-2 md:p-4 bg-sky-600 text-white rounded-xl md:rounded-2xl shadow-lg active:scale-95">
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
             </button>
          </div>
        </header>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-3 md:p-12 space-y-4 md:space-y-12">
          {!session || session.messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center space-y-8 md:space-y-16 py-8 md:py-20 max-w-5xl mx-auto">
              
              {/* Unique Uniqueness Introduction Card */}
              <div className="w-full bg-white/5 border border-white/10 rounded-[2rem] md:rounded-[3rem] p-5 md:p-12 text-center space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-1.5 md:py-2 bg-sky-500/10 rounded-full border border-sky-400/20 urdu-text text-xs md:text-lg text-sky-300 font-bold">
                  <Sparkles size={16} />
                  <span>Chat GRC کیوں منفرد ہے؟</span>
                </div>
                
                <h2 className="text-2xl md:text-6xl font-black urdu-text text-white leading-tight">
                  تحقیق اور تربیت کا <span className="text-sky-400">نیا مرکز</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {UNIQUENESS_POINTS.map((point, i) => (
                    <div key={i} className="bg-black/20 p-5 md:p-7 rounded-[1.5rem] md:rounded-3xl border border-white/5 text-right space-y-2 md:space-y-4 hover:bg-white/5 transition-all group">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 md:mb-4 group-hover:scale-110 transition-transform">
                        {getIcon(point.icon)}
                      </div>
                      <h3 className="urdu-text text-lg md:text-2xl font-bold text-white">{point.title}</h3>
                      <p className="urdu-text text-[11px] md:text-base text-slate-400 leading-relaxed">{point.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 w-full px-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button key={idx} onClick={() => onSendMessage(s.ur, [])} className="p-4 md:p-8 text-right bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl md:rounded-[2.5rem] transition-all group">
                    <div className="font-bold urdu-text text-white text-xs md:text-2xl group-hover:text-sky-300" dir="rtl">{s.ur}</div>
                    <div className="text-[9px] md:text-xs text-sky-400/40 uppercase mt-1.5 md:mt-4 tracking-widest">{s.en}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto space-y-6 md:space-y-12 pb-16 md:pb-24">
              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} />
              ))}
              {isLoading && session.messages[session.messages.length-1]?.role === 'user' && (
                <div className="flex justify-start px-2">
                  <div className="bg-white/5 px-5 md:px-10 py-3 md:py-6 rounded-2xl md:rounded-[2.5rem] border border-white/10">
                    <div className="flex gap-2 items-center">
                      <div className="w-1.5 h-1.5 md:w-3 md:h-3 bg-sky-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 md:w-3 md:h-3 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}} />
                      <div className="w-1.5 h-1.5 md:w-3 md:h-3 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '400ms'}} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4 md:h-12" />
            </div>
          )}
        </div>

        {/* Footer Area - Sleek Floating Capsule Input Box */}
        <footer className="p-3 md:p-10 md:pt-2 bg-transparent sticky bottom-0 z-40">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto relative group">
            <div className="relative flex items-end w-full bg-[#0f172a] md:bg-[#0f172a]/90 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] p-1.5 md:p-3 transition-all shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] border border-white/10 focus-within:border-sky-500/50 focus-within:ring-4 focus-within:ring-sky-500/5">
              
              <div className="flex items-center gap-0.5 md:gap-2 px-1 md:px-4 mb-2 md:mb-4">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 md:p-4 text-slate-400 hover:text-sky-400 hover:bg-white/5 rounded-full transition-all">
                    <Paperclip className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button type="button" onClick={toggleInputListening} className={`p-2.5 md:p-4 rounded-full transition-all ${isListeningInput ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-slate-400 hover:text-sky-400 hover:bg-white/5'}`}>
                    <Mic className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              <input type="file" multiple ref={fileInputRef} className="hidden" />
              
              {/* Sleek Text Container */}
              <div className="flex-1 bg-white rounded-[1.8rem] md:rounded-[2.8rem] p-1 md:p-2 mb-1.5 md:mb-2 shadow-inner">
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
                  placeholder="سوال لکھیں..."
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-900 px-3 md:px-7 py-3 md:py-6 resize-none no-scrollbar urdu-text text-right text-sm md:text-3xl placeholder:text-slate-400 leading-[1.6] md:leading-[1.8] font-bold"
                  dir="auto"
                />
              </div>

              <button 
                type="submit" 
                disabled={(!input.trim() && attachments.length === 0) || isLoading} 
                className={`p-4 md:p-7 rounded-full transition-all ml-1 md:ml-4 mb-2 md:mb-4 flex items-center justify-center ${input.trim() || attachments.length > 0 ? 'bg-sky-600 text-white shadow-xl active:scale-90 hover:bg-sky-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 md:w-8 md:h-8 animate-spin" /> : <ArrowUp className="w-5 h-5 md:w-8 md:h-8" strokeWidth={3} />}
              </button>
            </div>
          </form>
          <div className="mt-2 md:mt-4 text-center">
            <p className="text-[9px] md:text-base text-slate-500 urdu-text font-bold opacity-70">
              Chat GRC - از قاری خالد محمود گولڈ میڈلسٹ
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};
