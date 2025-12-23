
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, Image as ImageIcon, Mic, XCircle, Paperclip, X, ChevronDown, Info, Menu, Search } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings } from '../types';
import { SUGGESTIONS } from '../constants';

interface ChatAreaProps {
  session: ChatSession | null;
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isImageMode: boolean;
  setIsImageMode: (val: boolean) => void;
  onStartVoice: () => void;
  isLoading: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  settings: UserSettings;
  onToggleSidebar: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  onSendMessage,
  isImageMode,
  setIsImageMode,
  onStartVoice,
  isLoading,
  selectedModel,
  onModelChange,
  settings,
  onToggleSidebar
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const promise = new Promise<Attachment>((resolve) => {
        reader.onload = (event) => {
          resolve({
            data: event.target?.result as string,
            mimeType: file.type,
            name: file.name,
            previewUrl: file.type.startsWith('image/') ? (event.target?.result as string) : undefined
          });
        };
      });
      reader.readAsDataURL(file);
      newAttachments.push(await promise);
    }
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
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

  return (
    <div className="flex-1 flex flex-col h-full relative p-2 md:p-4 overflow-hidden">
      <div className="flex-1 flex flex-col glass-panel rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/5 to-transparent pointer-events-none" />

        <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={onToggleSidebar} className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-all">
              <Menu size={18} />
            </button>
            <div className="relative">
              <button onClick={() => setShowModelMenu(!showModelMenu)} className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 hover:bg-white/10 rounded-2xl transition-all text-white group">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="font-bold urdu-text text-xs md:text-base tracking-wide">Chat GRC</span>
                <ChevronDown size={12} className={`text-indigo-400 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} />
              </button>
              {showModelMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 md:w-64 glass-panel border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <button onClick={() => { onModelChange('gemini-3-pro-preview'); setShowModelMenu(false); }} className={`w-full text-right px-4 py-3 hover:bg-white/5 flex flex-col items-end group ${selectedModel.includes('pro') ? 'bg-indigo-500/10' : ''}`}>
                    <span className="text-xs md:text-sm font-bold urdu-text text-white">تحقیق پرو (Pro-3)</span>
                    <span className="text-[9px] text-slate-500">پیچیدہ کام کے لیے</span>
                  </button>
                  <button onClick={() => { onModelChange('gemini-3-flash-preview'); setShowModelMenu(false); }} className={`w-full text-right px-4 py-3 hover:bg-white/5 flex flex-col items-end group ${selectedModel.includes('flash') ? 'bg-indigo-500/10' : ''}`}>
                    <span className="text-xs md:text-sm font-bold urdu-text text-white">فلیش (Flash-3)</span>
                    <span className="text-[9px] text-slate-500">تیز جوابات کے لیے</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="hidden sm:flex flex-col items-end border-r border-white/10 pr-3">
               <span className="text-[7px] md:text-[8px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Global Research Centre</span>
               <span className="text-[8px] md:text-[9px] text-slate-300 font-bold urdu-text">قاری خالد محمود</span>
             </div>
             <button onClick={onStartVoice} className="flex items-center gap-1.5 px-3 py-1.5 md:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all active:scale-95 shadow-xl border border-indigo-400/20">
                <span className="hidden xs:inline urdu-text text-xs md:text-sm font-bold">براہِ راست گفتگو</span>
                <Mic size={14} className="md:w-[18px]" />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          {!session || session.messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-start pt-6 md:pt-12 pb-4 px-4 max-w-4xl mx-auto space-y-6 md:space-y-10">
              {/* Top Launch Identity Section */}
              <div className="text-center space-y-4 md:space-y-6 shrink-0 w-full animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="relative group inline-block">
                  <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 md:w-24 md:h-24 glass-panel rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border-indigo-500/20 relative z-10">
                     <Sparkles size={28} className="text-indigo-400 md:w-12 md:h-12 animate-pulse" />
                  </div>
                </div>
                
                <h2 className="text-4xl md:text-7xl font-bold urdu-text bg-clip-text text-transparent bg-gradient-to-b from-white to-indigo-400 leading-tight">آپ کی کیا تحقیق کروں؟</h2>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/5 rounded-full border border-indigo-500/10 backdrop-blur-sm">
                    <Search size={14} className="text-indigo-400"/>
                    <span className="text-[9px] md:text-xs text-slate-300 font-bold tracking-[0.25em] uppercase">Global Research Centre</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-indigo-400 urdu-text font-bold text-lg md:text-3xl px-6 py-2 rounded-2xl bg-white/5 border border-white/5">
                    <Info size={16} className="md:w-6 md:h-6 text-indigo-500 shrink-0" />
                    <span>قاری خالد محمود گولڈ میڈلسٹ</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Suggestions - Compact for Screen Fit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 w-full px-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                {SUGGESTIONS.map((s, idx) => (
                  <button key={idx} onClick={() => onSendMessage(s.ur, [])} className="glass-card p-4 md:p-7 text-right rounded-[1.5rem] md:rounded-[2.5rem] group relative overflow-hidden flex flex-col justify-center border border-white/5 hover:border-indigo-500/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={`font-bold urdu-text text-white leading-snug transition-all group-hover:text-indigo-400 group-hover:translate-x-1 ${settings.fontSize === 'large' ? 'text-lg md:text-2xl' : 'text-base md:text-xl'}`} dir="rtl">{s.ur}</div>
                    <div className="flex text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-40 items-center justify-end gap-1 mt-2 group-hover:opacity-100">
                       {s.en} <ArrowUp size={10} className="rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto py-6">
              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-3 md:p-6 pt-1 shrink-0 bg-gradient-to-t from-slate-900/80 to-transparent">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden glass-panel border-white/10 group/att shadow-xl">
                    {att.previewUrl ? <img src={att.previewUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] text-indigo-400 font-bold">DOC</div>}
                    <button onClick={() => removeAttachment(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"><X size={8} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className={`relative flex items-end w-full glass-panel rounded-2xl md:rounded-[2.5rem] p-2 md:p-3.5 transition-all duration-300 shadow-2xl border-white/10 ${isImageMode ? 'ring-2 ring-indigo-500/50 bg-indigo-900/30' : 'ring-1 ring-white/5 focus-within:ring-indigo-500/40 focus-within:bg-white/5'}`}>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <div className="flex items-center px-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 md:p-3 text-slate-400 hover:text-indigo-400 transition-all active:scale-90" title="منسلک کریں"><Paperclip size={20} className="md:w-6 md:h-6" /></button>
                <button type="button" onClick={() => setIsImageMode(!isImageMode)} className={`p-2 md:p-3 transition-all active:scale-90 ${isImageMode ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`} title="تصویر تیار کریں">{isImageMode ? <XCircle size={20} className="md:w-6 md:h-6" /> : <ImageIcon size={20} className="md:w-6 md:h-6" />}</button>
              </div>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => { setInput(e.target.value); if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`; } }}
                onKeyDown={handleKeyDown}
                placeholder={isImageMode ? "جس کی تصویر چاہیے اس کا نام لکھیں..." : "تحقیق کے لیے یہاں لکھیں..."}
                className={`w-full bg-transparent border-none focus:ring-0 text-white px-3 py-2 md:py-3.5 resize-none no-scrollbar urdu-text text-right placeholder:text-slate-500 leading-relaxed ${settings.fontSize === 'large' ? 'text-lg md:text-2xl' : 'text-base md:text-xl'}`}
                dir="auto"
              />
              <button type="submit" disabled={(!input.trim() && attachments.length === 0) || isLoading} className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all mb-0.5 ml-1 md:ml-3 flex items-center justify-center ${input.trim() || attachments.length > 0 ? (isImageMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-white text-slate-900 shadow-xl') : 'text-slate-700'} active:scale-90`}>
                <ArrowUp size={20} className="md:w-6 md:h-6" strokeWidth={3} />
              </button>
            </div>
            <div className="mt-3 flex flex-col items-center gap-0.5 opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none">
              <p className="text-[7px] md:text-[10px] text-center text-indigo-400 font-bold uppercase tracking-[0.4em]">Global Research Centre • Qari Khalid Mahmood Gold medalist</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
