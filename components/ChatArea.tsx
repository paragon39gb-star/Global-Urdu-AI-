import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, Mic, Paperclip, Menu, Newspaper, Loader2, RefreshCcw, Calendar, Radio, AlertCircle, Cpu, Share2, MessageCircle, Image as ImageIcon, Wand2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings, Message } from '../types';
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
  const [error, setError] = useState<string | null>(null);
  const [combinedDate, setCombinedDate] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contact = session?.contactId ? MOCK_CONTACTS.find(c => c.id === session.contactId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, isGeneratingImage]);

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
    setError(null);
    if (!input.trim() && attachments.length === 0) return;
    if (isLoading || isGeneratingImage) return;

    if (isImageMode) {
      await handleImageGeneration(input);
      return;
    }

    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleImageGeneration = async (prompt: string) => {
    setIsGeneratingImage(true);
    setInput('');
    setIsImageMode(false);
    
    try {
      const imageData = await chatGRC.generateImage(prompt);
      if (imageData) {
        const imageAttachment: Attachment = {
          data: imageData,
          mimeType: 'image/png',
          name: 'generated_image.png',
          previewUrl: imageData
        };
        onSendMessage(`آپ کی فرمائش پر تصویر تیار ہے: "${prompt}"`, [imageAttachment]);
      }
    } catch (err) {
      setError("تصویر بنانے میں دشواری پیش آئی۔ براہ کرم دوبارہ کوشش کریں۔");
    } finally {
      setIsGeneratingImage(false);
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

  // Fixed handleFileChange by explicitly typing the 'file' parameter to resolve 'unknown' type errors.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        setAttachments(prev => [...prev, {
          data,
          mimeType: file.type,
          name: file.name,
          previewUrl: file.type.startsWith('image/') ? data : undefined
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${settings.highContrast ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <header className={`h-16 flex items-center justify-between px-2 md:px-6 shrink-0 z-30 shadow-lg border-b border-white/10 transition-colors ${contact ? 'bg-[#075e54] text-white' : 'bg-gradient-to-r from-[#0369a1] via-[#075985] to-[#0c4a6e]'}`}>
        <div className="flex items-center gap-1 md:gap-2 overflow-hidden">
          <button onClick={onToggleSidebar} className="p-2 hover:bg-white/20 rounded-xl text-white transition-all active:scale-90 shrink-0">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2.5 overflow-x-auto no-scrollbar py-1">
           <button onClick={onStartVoice} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl border border-emerald-500/20 transition-all active:scale-95 group shadow-sm shrink-0">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="urdu-text text-[10px] md:text-xs font-black text-white">لائیو</span>
           </button>
           
           <button onClick={onFetchNews} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all active:scale-95 group shadow-sm shrink-0">
              <Newspaper className="w-5 h-5 text-white" />
              <span className="urdu-text text-[10px] md:text-xs font-black text-white">خبریں</span>
           </button>

           <button onClick={onFetchAIUpdates} className="flex items-center gap-2 px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 rounded-xl border border-sky-500/10 transition-all active:scale-95 group shadow-sm shrink-0">
              <Cpu className="w-5 h-5 text-sky-400" />
              <span className="urdu-text text-[10px] md:text-xs font-black text-white">AI</span>
           </button>

           <button onClick={handleShareApp} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 shrink-0" title="شیئر ایپ">
              <Share2 className="w-5.5 h-5.5" />
           </button>

           <button onClick={onRefreshContext} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 shrink-0" title="ری فریش">
              <RefreshCcw className="w-5.5 h-5.5" />
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative">
        <div className="w-full max-w-chat mx-auto px-4 flex flex-col min-h-full relative z-10">
          {!session || session.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 animate-bubble">
              <div className="text-center space-y-4 w-full">
                <div className="relative inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-[#0ea5e9] to-[#0c4a6e] rounded-xl border border-white shadow-xl mb-4">
                  <span className="text-white text-xl font-bold">U</span>
                </div>
                <div className="flex justify-center mb-2">
                  <div className="px-4 py-1.5 rounded-full bg-white/80 border border-sky-100 shadow-sm flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span className="urdu-text text-[11px] font-black text-sky-900">{combinedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-28 pt-6">
              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} onSuggestionClick={(s) => onSendMessage(s, [])} />
              ))}
              
              {!isLoading && !isGeneratingImage && session.messages.length > 0 && (
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

              {(isLoading || isGeneratingImage) && (
                <div className="flex justify-start px-2">
                  <div className="px-4 py-2 rounded-2xl bg-white shadow-xl flex items-center gap-3 border border-sky-100 animate-pulse">
                    <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                    <span className="urdu-text text-sm font-black text-sky-600">
                      {isGeneratingImage ? "تصویر بنائی جا رہی ہے..." : "تحقیق جاری ہے..."}
                    </span>
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
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto py-2 no-scrollbar">
              {attachments.map((att, i) => (
                <div key={i} className="relative group shrink-0">
                  <div className="w-14 h-14 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                    {att.previewUrl ? <img src={att.previewUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 p-1 break-all">{att.name}</div>}
                  </div>
                  <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors">
                    <AlertCircle size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative w-full">
            <div className={`relative flex items-end gap-2 w-full border rounded-[2rem] p-2 bg-white shadow-2xl transition-all duration-300 ${isImageMode ? 'ring-2 ring-purple-500 border-purple-400' : 'border-slate-200 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-400'}`}>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-sky-600 transition-colors"><Paperclip className="w-5 h-5" /></button>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isImageMode ? "تصویر کی تفصیل لکھیں..." : "تحقیق شروع کریں..."}
                className="flex-1 bg-transparent border-none focus:ring-0 px-2 py-3 resize-none urdu-text text-right font-bold text-sky-900 min-h-[48px] max-h-32"
                style={{ fontSize: '16px' }}
                dir="auto"
              />
              <div className="flex items-center gap-2 pr-1">
                <button 
                  type="button" 
                  onClick={() => setIsImageMode(!isImageMode)} 
                  className={`p-3 transition-colors rounded-full ${isImageMode ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:text-purple-600'}`}
                  title="تصویر بنوائیں"
                >
                  <Wand2 className="w-5 h-5" />
                </button>
                <button type="button" onClick={onStartVoice} className="p-3 text-slate-400 hover:text-emerald-600 transition-colors hidden md:block"><Mic className="w-5 h-5" /></button>
                <button type="submit" disabled={!input.trim() && attachments.length === 0 || isLoading || isGeneratingImage} className={`w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 shadow-lg transition-all active:scale-95 ${isImageMode ? 'bg-purple-600 text-white shadow-purple-600/20' : 'bg-sky-600 text-white shadow-sky-600/20 hover:bg-sky-700'}`}>
                  <ArrowUp size={24} />
                </button>
              </div>
            </div>
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </form>
          <div className="flex flex-col items-center mt-3 gap-0.5">
            <span className="font-black text-xl urdu-text text-sky-700 drop-shadow-sm">Urdu AI</span>
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest urdu-text">گلوبل ریسرچ سینٹر - قاری خالد محمود گولڈ میڈلسٹ</p>
          </div>
        </div>
      </footer>
    </div>
  );
};