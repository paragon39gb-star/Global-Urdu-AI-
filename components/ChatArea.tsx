
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
        
        {/* Optimized Header for Mobile */}
        <header className="h-14 md:h-20 flex items-center justify-between px-2 md:px-10 border-b border-sky-400/20 sticky top-0 z-20 shrink-0 bg-[#020617]/90 backdrop-blur-3xl">
          <div className="flex items-center gap-1.5 md:gap-5 shrink-0">
            <button onClick={onToggleSidebar} className="lg:hidden p-1.5 text-white hover:bg-white/10 rounded-xl transition-all">
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-1 md:gap-4">
              <div className="relative shrink-0">
                <button onClick={() => setShowModelMenu(!showModelMenu)} className="flex items-center gap-1 px-1.5 md:px-4 py-1 hover:bg-white/5 rounded-xl transition-all text-white group shrink-0">
                  <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-sky-400 shrink-0 animate-pulse shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                  <span className="font-bold urdu-text text-xs md:text-2xl tracking-tighter whitespace-nowrap">Chat GRC</span>
                  <ChevronDown size={12} className={`text-sky-300 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showModelMenu && (
                  <div className="absolute top-full left-0 mt-3 w-56 md:w-80 glass-panel border-white/20 rounded-2xl shadow-2xl py-2 z-50 bg-[#0f172a] animate-in fade-in zoom-in-95">
                    <button onClick={() => { onModelChange('gemini-3-pro-preview'); setShowModelMenu(false); }} className={`w-full text-right px-4 py-3 hover:bg-sky-500/10 flex flex-col items-end border-b border-white/5 transition-colors ${selectedModel.includes('pro') ? 'bg-sky-500/20' : ''}`}>
                      <span className="text-sm md:text-lg font-bold urdu-text text-white">Chat GRC Pro (Turbo)</span>
                    </button>
                    <button onClick={() => { onModelChange('gemini-3-flash-preview'); setShowModelMenu(false); }} className={`w-full text-right px-4 py-3 hover:bg-sky-500/10 flex flex-col items-end transition-colors ${selectedModel.includes('flash') ? 'bg-sky-500/20' : ''}`}>
                      <span className="text-sm md:text-lg font-bold urdu-text text-white">Chat GRC Lite (Flash)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
             <button 
                onClick={handleRefresh} 
                className={`p-1.5 md:p-3 text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all active:scale-90 ${isRefreshing ? 'animate-spin' : ''}`}
                title="ریفریش"
             >
                <RefreshCcw size={16} className="md:w-5 md:h-5" />
             </button>

             <button 
                onClick={onFetchNews} 
                disabled={isLoading}
                className="flex items-center gap-1 px-1.5 md:px-4 py-1.5 md:py-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 rounded-lg md:rounded-xl transition-all border border-emerald-500/20 disabled:opacity-50"
             >
                <span className="urdu-text text-[9px] md:text-sm font-bold">خبریں</span>
                <Newspaper size={12} className="md:w-4 md:h-4" />
             </button>
             
             <button 
                onClick={onFetchAIUpdates} 
                disabled={isLoading}
                className="flex items-center gap-1 px-1.5 md:px-4 py-1.5 md:py-2.5 bg-violet-600/15 hover:bg-violet-600/25 text-violet-300 rounded-lg md:rounded-xl transition-all border border-violet-500/20 disabled:opacity-50"
             >
                <span className="urdu-text text-[9px] md:text-sm font-bold">AI خبریں</span>
                <Zap size={12} className="md:w-4 md:h-4" />
             </button>

             <button 
                onClick={onStartVoice} 
                className="p-1.5 md:px-4 md:py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg md:rounded-xl transition-all active:scale-90 shadow-xl"
             >
                <Mic size={16} className="md:w-5 md:h-5" />
             </button>
          </div>
        </header>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-3 md:p-6 bg-black/5">
          {!session || session.messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center space-y-6 md:space-y-12 animate-in fade-in duration-700">
              
              <div className="flex items-center gap-2 px-4 py-1.5 bg-sky-500/10 rounded-full border border-sky-400/20">
                <Calendar size={12} className="text-sky-400" />
                <div className="urdu-text text-[10px] md:text-lg font-bold text-sky-100">
                  <span>{currentDateInfo.day}</span> | <span>{currentDateInfo.fullDate}</span>
                </div>
              </div>

              <div className="text-center space-y-3 md:space-y-8">
                <div className="w-16 h-16 md:w-32 md:h-32 glass-panel rounded-2xl md:rounded-[3rem] flex items-center justify-center mx-auto border-sky-400/20">
                   <Sparkles size={30} className="text-sky-300 animate-pulse md:w-12 md:h-12" />
                </div>
                <h2 className="text-2xl md:text-6xl font-black urdu-text text-white">تحقیق شروع کریں</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 w-full max-w-4xl px-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button key={idx} onClick={() => onSendMessage(s.ur, [])} className="glass-card p-4 md:p-8 text-right rounded-xl md:rounded-[2.5rem] border border-white/5 hover:border-sky-400/40 transition-all hover:bg-sky-500/10 active:scale-[0.98] flex flex-col items-end shadow-xl">
                    <div className="font-bold urdu-text text-white text-xs md:text-xl leading-relaxed" dir="rtl">{s.ur}</div>
                    <div className="text-[8px] md:text-[11px] text-sky-400/50 uppercase font-black mt-1 tracking-widest">{s.en}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto space-y-3">
              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} />
              ))}
              {isLoading && session.messages[session.messages.length-1]?.role === 'user' && (
                <div className="flex justify-start px-4 md:px-12 py-3">
                  <div className="glass-panel px-4 py-2 rounded-xl border-sky-500/10 bg-sky-950/20">
                    <div className="flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                      <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                      <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Improved Mobile Input */}
        <footer className="p-2 md:p-8 bg-[#020617]/95 backdrop-blur-3xl border-t border-white/10 shrink-0">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end w-full glass-panel rounded-xl md:rounded-[2.5rem] p-1.5 md:p-2.5 transition-all border-white/20 focus-within:border-sky-500/50 shadow-2xl bg-black/40">
              <div className="flex items-center gap-0.5 pl-1 md:pl-3">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 md:p-4 text-sky-400/60 hover:text-sky-300 transition-all"><Paperclip size={18} /></button>
                <button type="button" onClick={toggleInputListening} className={`p-2 md:p-4 transition-all ${isListeningInput ? 'text-red-500 animate-pulse' : 'text-sky-400/60 hover:text-sky-300'}`}><Mic size={18} /></button>
              </div>
              <input type="file" multiple ref={fileInputRef} className="hidden" />
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => { 
                  setInput(e.target.value); 
                  e.target.style.height = 'auto'; 
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`; 
                }}
                onKeyDown={handleKeyDown}
                placeholder="تحقیق کریں..."
                className="w-full bg-transparent border-none focus:ring-0 text-white px-2 md:px-4 py-2 md:py-5 resize-none no-scrollbar urdu-text text-right text-sm md:text-2xl placeholder:text-sky-100/10 leading-relaxed"
                dir="auto"
              />
              <button 
                type="submit" 
                disabled={(!input.trim() && attachments.length === 0) || isLoading} 
                className={`p-2.5 md:p-5 rounded-lg md:rounded-2xl transition-all ml-1 flex items-center justify-center ${input.trim() || attachments.length > 0 ? 'bg-sky-600 text-white' : 'bg-white/5 text-sky-900/20'} disabled:opacity-50 active:scale-95`}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={3} />}
              </button>
            </div>
          </form>
          
          <div className="mt-2 text-center">
             <p className="text-[7px] md:text-[11px] urdu-text text-slate-500 font-bold uppercase tracking-wider">
               Chat GRC - از <span className="text-yellow-400 font-black">قاری خالد محمود</span>
             </p>
          </div>
        </footer>
      </div>
    </div>
  );
};
