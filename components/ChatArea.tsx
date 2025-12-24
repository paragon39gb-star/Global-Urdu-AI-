
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, Mic, Paperclip, ChevronDown, Menu, Newspaper, Zap, Loader2, RefreshCcw, Award, Calendar, Radio } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings } from '../types';
import { UNIQUENESS_POINTS } from '../constants';

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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden text-[#000000]">
      {/* Premium Header */}
      <header className="h-16 flex items-center justify-between px-3 md:px-6 shrink-0 bg-gradient-to-r from-[#0369a1] via-[#075985] to-[#0c4a6e] z-30 shadow-xl border-b border-white/10">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onToggleSidebar} className="lg:hidden p-2 hover:bg-white/20 rounded-xl text-white transition-all active:scale-90">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl md:text-2xl urdu-text text-white drop-shadow-md tracking-tight">Chat GRC</span>
              <Award className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-3">
           {/* Added Live Chat Button */}
           <button onClick={onStartVoice} className="flex items-center gap-2 px-3 py-1.5 md:py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl border border-emerald-500/20 transition-all active:scale-95 group shadow-lg">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="urdu-text text-xs md:text-sm font-black text-white">لائیو چیٹ</span>
           </button>
           <button onClick={onFetchNews} className="flex items-center gap-2 px-3 py-1.5 md:py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all active:scale-95">
              <Newspaper className="w-4 h-4 text-white" />
              <span className="urdu-text text-xs md:text-sm font-black text-white">خبریں</span>
           </button>
           <button onClick={onFetchAIUpdates} className="flex items-center gap-2 px-3 py-1.5 md:py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all active:scale-95">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="urdu-text text-xs md:text-sm font-black text-white">AI نیوز</span>
           </button>
           <button onClick={handleRefresh} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-all active:rotate-180 duration-500">
              <RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </header>

      {/* Main Chat Area with very soft gradient background */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] opacity-100 relative">
        {/* Subtle background overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] opacity-30 pointer-events-none"></div>
        
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
                  <h2 className="text-3xl md:text-4xl font-black urdu-text text-[#000000] leading-tight drop-shadow-sm">گلوبل ریسرچ سینٹر</h2>
                  <p className="text-lg md:text-xl font-bold urdu-text text-[#000080] opacity-90">آپ کا مستند تحقیقی ساتھی</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                  {UNIQUENESS_POINTS.map((p, i) => (
                    <div key={i} className="bg-white/70 backdrop-blur-sm p-3 rounded-2xl text-right border-b-4 border-[#0ea5e9] shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                      <h3 className="urdu-text font-black text-[#000080] text-sm mb-1">{p.title}</h3>
                      <p className="urdu-text text-[10px] text-slate-700 leading-relaxed font-bold">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-32">
              <div className="flex justify-center mb-6">
                <div className="bg-white/80 backdrop-blur-md px-5 py-2 rounded-2xl border border-[#0ea5e9]/20 shadow-md flex items-center gap-2 group hover:border-[#0ea5e9]/50 transition-all">
                  <Calendar className="w-4 h-4 text-[#000080] group-hover:scale-110 transition-transform" />
                  <span className="urdu-text text-xs md:text-sm font-black text-[#000080]">{currentDate}</span>
                </div>
              </div>

              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} />
              ))}
              {isLoading && session.messages[session.messages.length-1]?.role === 'user' && (
                <div className="flex justify-start px-2">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg flex items-center gap-3 border border-[#0ea5e9]/30 animate-pulse">
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

      {/* Elegant Footer Area */}
      <footer className="w-full shrink-0 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent pt-2 pb-4 md:pb-8 px-4">
        <form onSubmit={handleSubmit} className="max-w-chat mx-auto relative">
          <div className="relative flex flex-col w-full bg-white/95 backdrop-blur-sm border-2 border-[#0ea5e9]/30 rounded-[1.5rem] md:rounded-[2.2rem] p-1.5 focus-within:border-[#0ea5e9] focus-within:shadow-[0_0_25px_rgba(14,165,233,0.15)] transition-all shadow-2xl">
            
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
              placeholder="قرآن، حدیث، تاریخ یا جنرل نالج پر تحقیق کریں..."
              className="w-full bg-transparent border-none focus:ring-0 text-[#000000] px-4 md:px-6 py-3 resize-none no-scrollbar urdu-text text-right text-base md:text-xl placeholder:text-slate-400 font-bold"
              dir="auto"
            />

            <div className="flex items-center justify-between px-2 pb-1.5">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/10 rounded-full transition-all active:scale-90">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button type="button" onClick={toggleInputListening} className={`p-2 rounded-full transition-all active:scale-90 ${isListeningInput ? 'text-white bg-red-500 shadow-lg animate-pulse' : 'text-slate-400 hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/10'}`}>
                  <Mic className="w-5 h-5" />
                </button>
              </div>

              <button 
                type="submit" 
                disabled={(!input.trim() && attachments.length === 0) || isLoading} 
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full transition-all flex items-center justify-center shadow-xl active:scale-90 ${input.trim() || attachments.length > 0 ? 'bg-[#0369a1] text-white hover:bg-[#075985]' : 'bg-slate-100 text-slate-300'}`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" strokeWidth={3} />}
              </button>
            </div>
          </div>
          
          <input type="file" multiple ref={fileInputRef} className="hidden" />
          
          <div className="mt-2 flex flex-col items-center gap-0.5 opacity-80">
            <p className="text-[12px] md:text-[14px] text-[#000080] font-black uppercase tracking-[0.2em] urdu-text text-center">
              Global Research Centre
            </p>
            <p className="text-[10px] md:text-[12px] text-slate-500 urdu-text font-black">
              از قاری خالد محمود گولڈ میڈلسٹ
            </p>
          </div>
        </form>
      </footer>
    </div>
  );
};
