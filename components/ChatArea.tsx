
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, ArrowUp, Image as ImageIcon, Mic, XCircle, Paperclip, X, ChevronDown, Info, Menu, Search, Newspaper, Zap, MicOff, Loader2, Calendar, RefreshCcw } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings } from '../types';
import { SUGGESTIONS } from '../constants';

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
  isImageMode,
  setIsImageMode,
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

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#020617]">
      <div className="flex-1 flex flex-col md:glass-panel md:m-3 md:rounded-[2.5rem] overflow-hidden shadow-2xl relative border-0 md:border border-white/10">
        
        {/* Responsive Header */}
        <header className="h-14 md:h-20 flex items-center justify-between px-3 md:px-10 border-b border-sky-400/20 sticky top-0 z-20 shrink-0 bg-[#020617]/90 backdrop-blur-3xl">
          <div className="flex items-center gap-2 md:gap-5 shrink-0">
            <button onClick={onToggleSidebar} className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer">
              <Menu size={22} />
            </button>
            
            <div className="flex items-center gap-1 md:gap-4">
              <div className="relative shrink-0">
                <button onClick={() => setShowModelMenu(!showModelMenu)} className="flex flex-col items-center px-2 md:px-6 py-1 hover:bg-white/5 rounded-2xl transition-all text-white group shrink-0 cursor-pointer">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-sky-400 shrink-0 animate-pulse shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
                    <span className="font-black urdu-text text-sm md:text-2xl tracking-tighter whitespace-nowrap text-white">Chat GRC</span>
                    <ChevronDown size={14} className={`text-sky-300 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                
                {showModelMenu && (
                  <div className="absolute top-full left-0 mt-4 w-60 md:w-80 glass-panel border-white/20 rounded-[2rem] shadow-2xl py-3 z-50 bg-[#0f172a] animate-in fade-in zoom-in-95">
                    <button onClick={() => { onModelChange('gemini-3-pro-preview'); setShowModelMenu(false); }} className={`w-full text-right px-5 py-4 hover:bg-sky-500/10 flex flex-col items-end border-b border-white/5 cursor-pointer transition-colors ${selectedModel.includes('pro') ? 'bg-sky-500/20' : ''}`}>
                      <span className="text-base md:text-lg font-bold urdu-text text-white">Chat GRC Pro (Turbo)</span>
                      <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase mt-1">Deep Intelligence</span>
                    </button>
                    <button onClick={() => { onModelChange('gemini-3-flash-preview'); setShowModelMenu(false); }} className={`w-full text-right px-5 py-4 hover:bg-sky-500/10 flex flex-col items-end cursor-pointer transition-colors ${selectedModel.includes('flash') ? 'bg-sky-500/20' : ''}`}>
                      <span className="text-base md:text-lg font-bold urdu-text text-white">Chat GRC Lite (Flash)</span>
                      <span className="text-[10px] text-sky-400/60 font-black tracking-widest uppercase mt-1">Instant Results</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-4">
             <button 
                onClick={handleRefresh} 
                className={`p-2 md:p-3 text-sky-400 hover:bg-sky-500/10 rounded-xl transition-all active:scale-90 cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
                title="ریفریش"
             >
                <RefreshCcw size={18} className="md:w-5 md:h-5" />
             </button>

             <button 
                onClick={onFetchNews} 
                disabled={isLoading}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-5 py-1.5 md:py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg md:rounded-xl transition-all active:scale-95 border border-emerald-500/30 disabled:opacity-50 cursor-pointer"
             >
                <span className="urdu-text text-[10px] md:text-base font-bold">خبریں</span>
                <Newspaper size={14} className="md:w-4 md:h-4" />
             </button>
             
             <button 
                onClick={onFetchAIUpdates} 
                disabled={isLoading}
                className="hidden sm:flex items-center gap-2 px-5 py-3 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 rounded-xl transition-all active:scale-95 border border-violet-500/30 disabled:opacity-50 cursor-pointer"
             >
                <span className="urdu-text text-base font-bold">AI اپڈیٹس</span>
                <Zap size={16} />
             </button>

             <button 
                onClick={onStartVoice} 
                className="p-2 md:px-5 md:py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg md:rounded-xl transition-all active:scale-90 shadow-2xl border border-sky-400/20 cursor-pointer"
             >
                <Mic size={18} className="md:w-5 md:h-5" />
             </button>
          </div>
        </header>

        {/* Message View Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-3 md:p-6 bg-black/5">
          {!session || session.messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center space-y-8 md:space-y-12 animate-in fade-in duration-700">
              
              <div className="flex items-center gap-3 px-5 py-2 bg-sky-500/10 rounded-full border border-sky-400/20 backdrop-blur-md">
                <Calendar size={14} className="text-sky-400" />
                <div className="urdu-text text-xs md:text-lg font-bold text-sky-100">
                  <span>{currentDateInfo.day}</span> | <span>{currentDateInfo.fullDate}</span>
                </div>
              </div>

              <div className="text-center space-y-4 md:space-y-8">
                <div className="w-20 h-20 md:w-32 md:h-32 glass-panel rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl border-sky-400/30">
                   <Sparkles size={40} className="text-sky-300 animate-pulse" />
                </div>
                <h2 className="text-3xl md:text-6xl font-black urdu-text text-white tracking-tight">تحقیق شروع کریں</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 w-full max-w-4xl px-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button key={idx} onClick={() => onSendMessage(s.ur, [])} className="glass-card p-5 md:p-8 text-right rounded-2xl md:rounded-[2.5rem] border border-white/5 hover:border-sky-400/40 transition-all hover:bg-sky-500/10 active:scale-[0.98] group flex flex-col items-end shadow-xl cursor-pointer">
                    <div className="font-bold urdu-text text-white text-sm md:text-xl leading-relaxed" dir="rtl">{s.ur}</div>
                    <div className="text-[9px] md:text-[11px] text-sky-400/50 uppercase font-black mt-2 tracking-widest">{s.en}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto space-y-4">
              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} />
              ))}
              {isLoading && session.messages[session.messages.length-1]?.role === 'user' && (
                <div className="flex justify-start px-4 md:px-12 py-4">
                  <div className="glass-panel px-5 py-3 rounded-2xl border-sky-500/20 bg-sky-950/30">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Improved Input Footer */}
        <footer className="p-3 md:p-8 bg-[#020617]/95 backdrop-blur-3xl border-t border-white/10 shrink-0">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end w-full glass-panel rounded-2xl md:rounded-[2.5rem] p-2 md:p-2.5 transition-all border-white/20 focus-within:border-sky-500/50 shadow-2xl bg-black/40">
              <div className="flex items-center gap-0.5 pl-1 md:pl-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 md:p-4 text-sky-400/60 hover:text-sky-300 transition-all active:scale-90 cursor-pointer"><Paperclip size={20} /></button>
                <button type="button" onClick={toggleInputListening} className={`p-2.5 md:p-4 transition-all active:scale-90 cursor-pointer ${isListeningInput ? 'text-red-500 animate-pulse' : 'text-sky-400/60 hover:text-sky-300'}`}><Mic size={20} /></button>
              </div>
              <input type="file" multiple ref={fileInputRef} className="hidden" />
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => { 
                  setInput(e.target.value); 
                  e.target.style.height = 'auto'; 
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`; 
                }}
                onKeyDown={handleKeyDown}
                placeholder="تحقیق شروع کریں..."
                className="w-full bg-transparent border-none focus:ring-0 text-white px-2 md:px-4 py-3 md:py-5 resize-none no-scrollbar urdu-text text-right text-base md:text-2xl placeholder:text-sky-100/10 leading-relaxed font-semibold"
                dir="auto"
              />
              <button 
                type="submit" 
                disabled={(!input.trim() && attachments.length === 0) || isLoading} 
                className={`p-3 md:p-5 rounded-xl md:rounded-2xl transition-all ml-2 flex items-center justify-center shadow-xl cursor-pointer ${input.trim() || attachments.length > 0 ? 'bg-sky-600 text-white' : 'bg-white/5 text-sky-900/40'} disabled:opacity-50 active:scale-90`}
              >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : <ArrowUp size={24} strokeWidth={3} />}
              </button>
            </div>
          </form>
          
          <div className="mt-4 text-center">
             <p className="text-[8px] md:text-[11px] urdu-text text-slate-500 font-bold uppercase tracking-[0.2em]">
               Chat GRC - از <span className="text-yellow-400 font-black">قاری خالد محمود</span> (گولڈ میڈلسٹ)
             </p>
          </div>
        </footer>
      </div>
    </div>
  );
};
