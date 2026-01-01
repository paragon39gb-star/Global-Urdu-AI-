import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowUp, Mic, Paperclip, Menu, Newspaper, Loader2, RefreshCcw, Calendar, Radio, AlertCircle, Cpu, Share2, MessageCircle, Wand2, BookOpen, RotateCcw, Eye } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatSession, Attachment, UserSettings } from '../types';
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
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isReadOnly = window.location.search.includes('view=shared');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contact = session?.contactId ? MOCK_CONTACTS.find(c => c.id === session.contactId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (session?.messages.length && session.messages.length > 0) {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2000);
    }
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
    if (isReadOnly) return;
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
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?view=shared`;

    const shareData = {
      title: 'Urdu AI - لائیو ریسرچ',
      text: `اردو اے آئی پر میری تازہ ترین تحقیق دیکھیں: ${session?.title || 'علمی مکالمہ'}\n\nیہ ایک لائیو لنک ہے، تمام نئی تبدیلیاں خود بخود سنک ہوں گی۔`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('لائیو چیٹ لنک کاپی کر لیا گیا ہے۔');
    }
  };

  const handleShareChatWhatsApp = () => {
    if (!session || session.messages.length === 0) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?view=shared`;
    const chatHistory = session.messages.map(m => `*${m.role === 'user' ? 'سوال' : 'جواب'}*: ${m.content}`).join('\n\n---\n\n');
    const text = encodeURIComponent(`*Urdu AI Live Research*\n\n${chatHistory}\n\n🔗 *لائیو اپڈیٹس کے لیے لنک:* ${shareUrl}\n\n_Powered by Global Research Center_`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || isReadOnly) return;
    
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
    <div className={`flex-1 flex flex-col h-full w-full overflow-hidden ${settings.highContrast ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <header className={`h-14 flex items-center justify-between px-2 md:px-4 shrink-0 z-30 shadow-md border-b border-white/10 transition-colors ${contact ? 'bg-[#075e54] text-white' : 'bg-gradient-to-r from-[#0369a1] via-[#075985] to-[#0c4a6e]'}`}>
        <div className="flex items-center gap-1 shrink-0">
          {!isReadOnly && (
            <button onClick={onToggleSidebar} className="p-2 hover:bg-white/10 rounded-lg text-white transition-all shrink-0">
              <Menu className="w-5 h-5" />
            </button>
          )}
          {isReadOnly && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-lg border border-white/20">
               <Eye size={14} className="text-white" />
               <span className="urdu-text text-[9px] font-black text-white">ایپ موڈ</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
           <button onClick={onStartVoice} className="flex items-center gap-1 px-2 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg border border-emerald-500/20 shrink-0">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span className="urdu-text text-[9px] font-black text-white">لائیو</span>
           </button>
           
           <button onClick={onFetchNews} className="flex items-center gap-1 px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 shrink-0">
              <Newspaper className="w-3.5 h-3.5 text-white" />
              <span className="urdu-text text-[9px] font-black text-white">خبریں</span>
           </button>

           <button onClick={onFetchAIUpdates} className="flex items-center gap-1 px-2 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 rounded-lg border border-sky-500/10 shrink-0">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span className="urdu-text text-[9px] font-black text-white">AI</span>
           </button>

           {!isReadOnly && (
             <button onClick={onRefreshContext} className="p-2 text-white/70 hover:text-white rounded-lg transition-all shrink-0">
                <RefreshCcw className="w-4 h-4" />
             </button>
           )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative overscroll-contain">
        <div className="w-full max-w-chat mx-auto px-4 flex flex-col min-h-full relative z-10">
          {!session || session.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-2 animate-bubble">
              <div className="text-center space-y-2 w-full max-w-lg px-4">
                
                {/* Minimal Logo for Zero Scroll */}
                <div className="relative inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-[#0ea5e9] to-[#0c4a6e] rounded-xl border-2 border-white shadow-md mb-1">
                  <Sparkles size={24} className="text-white fill-sky-200/20" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg border-2 border-[#f8fafc] flex items-center justify-center shadow-sm">
                    <BookOpen size={8} className="text-white" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-white border border-sky-100 shadow-sm flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-sky-600" />
                    <span className="urdu-text text-[9px] font-black text-sky-950">{combinedDate}</span>
                  </div>

                  <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <h2 className="urdu-text text-lg font-black text-sky-950">السلام علیکم!</h2>
                    <p className="urdu-text text-xs font-bold text-sky-800">
                      میں <span className="text-[#0369a1] font-black underline decoration-sky-300 underline-offset-2">اردو اے آئی</span> ہوں، مستند تحقیقی معاون۔
                    </p>
                    <div className="p-2.5 bg-white rounded-xl border border-sky-100 shadow-sm">
                      <p className="urdu-text text-[11px] font-medium text-slate-600 leading-relaxed">
                        میں قرآن، حدیث اور علومِ اسلامیہ میں علامہ غلام رسول سعیدی کے اسلوب میں آپ کی مکمل رہنمائی کر سکتا ہوں۔
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-32 pt-4">
              {session.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} settings={settings} onSuggestionClick={(s) => isReadOnly ? null : onSendMessage(s, [])} />
              ))}
              
              {!isLoading && !isGeneratingImage && session.messages.length > 0 && !isReadOnly && (
                <div className="flex justify-center py-4">
                  <button 
                    onClick={handleShareChatWhatsApp}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white shadow-md hover:bg-[#128C7E] transition-all urdu-text font-black text-[11px]"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>واٹس ایپ پر سنک کریں</span>
                  </button>
                </div>
              )}

              {(isLoading || isGeneratingImage) && (
                <div className="flex justify-start px-2">
                  <div className="px-3 py-1.5 rounded-xl bg-white shadow-md flex items-center gap-2 border border-sky-100 animate-pulse">
                    <Loader2 className="w-3 h-3 text-sky-500 animate-spin" />
                    <span className="urdu-text text-[10px] font-black text-sky-600">تحقیق جاری ہے...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {!isReadOnly && (
        <footer className="w-full shrink-0 bg-white/90 backdrop-blur-md border-t border-slate-100 z-30 pb-safe">
          <div className="max-w-chat mx-auto w-full px-4 py-2">
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
                {attachments.map((att, i) => (
                  <div key={i} className="relative shrink-0">
                    <div className="w-10 h-10 rounded-lg border bg-slate-50 overflow-hidden">
                      {att.previewUrl && <img src={att.previewUrl} className="w-full h-full object-cover" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="relative w-full">
              <div className="relative flex items-end gap-1.5 w-full border rounded-2xl p-1 bg-white shadow-lg border-slate-200">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 shrink-0"><Paperclip className="w-4 h-4" /></button>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="تحقیق کریں..."
                  className="flex-1 bg-transparent border-none focus:ring-0 px-1 py-2.5 resize-none urdu-text text-right font-bold text-sky-900 min-h-[40px] max-h-24"
                  style={{ fontSize: '15px' }}
                />
                <button type="submit" disabled={!input.trim() || isLoading} className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-600 text-white shadow-md active:scale-95 shrink-0">
                  <ArrowUp size={20} />
                </button>
              </div>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </form>
            <div className="flex flex-col items-center mt-2 pb-1">
              <p className="text-[9px] text-slate-400 font-bold urdu-text">گلوبل ریسرچ سینٹر - قاری خالد محمود گولڈ میڈلسٹ</p>
            </div>
          </div>
        </footer>
      )}
      {isReadOnly && (
        <div className="w-full bg-sky-950 text-white p-3 text-center urdu-text text-[10px] font-black border-t border-white/10 pb-safe">
          گلوبل ریسرچ سینٹر - مستند علمی پلیٹ فارم
        </div>
      )}
    </div>
  );
};