import React, { useState } from 'react';
import { Plus, Trash2, X, Type, MessageCircle, Sparkles, Info, LogOut, User as UserIcon, LogIn, History, HelpCircle, Minus, ExternalLink, Key, Share2, Volume2 } from 'lucide-react';
import { ChatSession, UserSettings, Contact } from '../types';
import { ABOUT_TEXT, USAGE_PROCEDURE_TEXT, WHATSAPP_LINK, OFFICIAL_WHATSAPP_NUMBER } from '../constants';

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onSelectContact: (contact: Contact) => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  customInstructions: string;
  setCustomInstructions: (val: string) => void;
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
  onLogout: () => void;
  onShowLogin: () => void;
  onSendFeedback: () => void;
  onInstall?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  isOpen,
  setIsOpen,
  settings,
  setSettings,
  onLogout,
  onShowLogin,
  onSendFeedback,
  onInstall
}) => {
  const [activePopover, setActivePopover] = useState<'about' | 'usage' | 'whatsapp' | null>(null);

  const increaseFontSize = () => setSettings({...settings, fontSize: Math.min(settings.fontSize + 2, 40)});
  const decreaseFontSize = () => setSettings({...settings, fontSize: Math.max(settings.fontSize - 2, 12)});
  const resetFontSize = () => setSettings({...settings, fontSize: 18});
  const setFont = (fam: 'naskh' | 'nastaleeq' | 'sans') => setSettings({...settings, fontFamily: fam});
  const setVoice = (voice: any) => setSettings({...settings, voiceName: voice});

  const handleOpenKeyDialog = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
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

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-30 lg:hidden animate-in fade-in duration-300" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 w-80 transform transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col p-3 h-full`}>
        <div className={`flex-1 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl border relative ${settings.highContrast ? 'bg-slate-900 border-slate-700' : 'bg-[#0c4a6e] border-white/10'}`}>
          
          <div className={`p-5 border-b shrink-0 flex items-center justify-between ${settings.highContrast ? 'border-slate-800 bg-slate-800/30' : 'border-white/10 bg-white/5'}`}>
            {settings.currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${settings.highContrast ? 'bg-sky-500/20 border-sky-500/30' : 'bg-sky-500/20 border-white/10'}`}>
                    <UserIcon size={20} className="text-sky-300" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white urdu-text" dir="rtl">{settings.currentUser.name}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${settings.highContrast ? 'text-sky-400' : 'text-sky-300'}`}>Urdu AI User</span>
                  </div>
                </div>
                <button onClick={onLogout} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={onShowLogin} className="flex items-center gap-2 px-4 py-2 bg-white text-[#0c4a6e] rounded-xl font-black transition-all text-xs urdu-text active:scale-95 shadow-lg">
                <LogIn size={14} />
                <span>لاگ ان کریں</span>
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors text-white active:scale-90">
              <X size={22} />
            </button>
          </div>

          <div className="p-4 space-y-2 shrink-0">
            <button 
              onClick={() => { onNewChat(); if(window.innerWidth < 1024) setIsOpen(false); }} 
              className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-white font-black rounded-2xl transition-all active:scale-95 group shadow-xl border ${settings.highContrast ? 'bg-sky-600 hover:bg-sky-500 border-sky-400' : 'bg-[#0ea5e9] hover:bg-[#0284c7] border-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <Plus size={20} className="text-white" />
                <span className="urdu-text text-base">نئی تحقیق</span>
              </div>
              <Sparkles size={16} className="text-yellow-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar py-2 overscroll-contain">
            <div className="space-y-2">
              <div className="px-2 mb-2 flex items-center gap-2 opacity-50">
                <History size={12} className="text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest urdu-text">سابقہ تحقیق</span>
              </div>
              
              {sessions.length === 0 ? (
                <div className="py-4 text-center opacity-30">
                  <p className="urdu-text text-xs text-white">کوئی گفتگو موجود نہیں</p>
                </div>
              ) : (
                sessions.filter(s => !s.contactId).map(session => (
                  <button 
                    key={session.id} 
                    onClick={() => { onSelect(session.id); if (window.innerWidth < 1024) setIsOpen(false); }}
                    className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all border text-right ${activeId === session.id ? 'bg-white/20 border-white/20 text-white shadow-xl translate-x-1' : 'hover:bg-white/5 text-white/50 border-transparent'} active:scale-[0.98]`}
                  >
                    <div className="flex-1 truncate text-xs urdu-text font-bold" dir="rtl">{session.title || "نئی گفتگو"}</div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-red-400 rounded-lg transition-all">
                      <Trash2 size={12} />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={`p-4 border-t space-y-3 ${settings.highContrast ? 'border-slate-800 bg-black/40' : 'border-white/10 bg-black/20'}`}>
            <div className="space-y-1.5">
               <div className="flex items-center gap-2 px-1 mb-1 opacity-50">
                 <Volume2 size={12} className="text-white" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest urdu-text">آواز کا انتخاب</span>
               </div>
               <div className="flex gap-1">
                 {['Kore', 'Zephyr', 'Fenrir', 'Puck'].map((v) => (
                   <button 
                     key={v}
                     onClick={() => setVoice(v)}
                     className={`flex-1 py-1.5 px-0.5 rounded-lg text-[9px] font-black border transition-all ${settings.voiceName === v ? 'bg-white/20 border-white text-white shadow-md scale-105' : 'border-white/5 text-white/30 hover:bg-white/5'}`}
                   >
                     {v === 'Kore' ? 'کورے' : v === 'Zephyr' ? 'زیفر' : v === 'Fenrir' ? 'فینرر' : 'پک'}
                   </button>
                 ))}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleOpenKeyDialog}
                className="flex items-center gap-3 px-4 py-3 text-xs rounded-xl transition-all text-white bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/20 active:scale-[0.98]"
              >
                <Key size={14} className="text-sky-400" />
                <span className="urdu-text flex-1 text-right font-black" dir="rtl">Key</span>
              </button>
              <button 
                onClick={handleShareApp}
                className="flex items-center gap-3 px-4 py-3 text-xs rounded-xl transition-all text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/20 active:scale-[0.98]"
              >
                <Share2 size={14} className="text-indigo-400" />
                <span className="urdu-text flex-1 text-right font-black" dir="rtl">شیئر</span>
              </button>
            </div>

            <div className="flex bg-white/5 rounded-xl border border-white/10 overflow-hidden items-center">
              <button onClick={decreaseFontSize} className="p-3 flex items-center justify-center text-white/70 hover:bg-white/10 transition-all active:scale-90 border-r border-white/10" title="کم کریں">
                <Minus size={16} />
              </button>
              <button onClick={resetFontSize} className="flex-1 flex flex-col items-center justify-center p-1 hover:bg-white/5 transition-colors" title="ری سیٹ">
                <Type size={14} className="text-sky-300" />
                <span className="text-[10px] font-black text-white">{settings.fontSize}px</span>
              </button>
              <button onClick={increaseFontSize} className="p-3 flex items-center justify-center text-white/70 hover:bg-white/10 transition-all active:scale-90 border-l border-white/10" title="زیادہ کریں">
                <Plus size={16} />
              </button>
            </div>

            <div className="flex gap-1.5">
               <button onClick={() => setFont('nastaleeq')} className={`flex-1 py-2 px-1 rounded-lg text-[10px] urdu-text font-black border transition-all ${settings.fontFamily === 'nastaleeq' ? 'bg-white/20 border-white text-white shadow-lg' : 'border-white/5 text-white/40 hover:bg-white/5'}`}>نستعلیق</button>
               <button onClick={() => setFont('naskh')} className={`flex-1 py-2 px-1 rounded-lg text-[10px] urdu-text font-black border transition-all ${settings.fontFamily === 'naskh' ? 'bg-white/20 border-white text-white shadow-lg' : 'border-white/5 text-white/40 hover:bg-white/5'}`}>نسخ</button>
               <button onClick={() => setFont('sans')} className={`flex-1 py-2 px-1 rounded-lg text-[10px] urdu-text font-black border transition-all ${settings.fontFamily === 'sans' ? 'bg-white/20 border-white text-white shadow-lg' : 'border-white/5 text-white/40 hover:bg-white/5'}`}>سادہ</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setActivePopover('usage')} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 border border-white/5 transition-all active:scale-95">
                <HelpCircle size={14} />
                <span className="text-[10px] urdu-text font-black">رہنمائی</span>
              </button>
              <button onClick={() => setActivePopover('about')} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 border border-white/5 transition-all active:scale-95">
                <Info size={14} />
                <span className="text-[10px] urdu-text font-black">تعارف</span>
              </button>
            </div>

            <button onClick={onSendFeedback} className="w-full flex items-center gap-3 px-4 py-3 text-xs rounded-xl transition-all text-white bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/20 active:scale-[0.98]">
              <MessageCircle size={16} className="text-[#25D366]" />
              <span className="urdu-text flex-1 text-right font-black" dir="rtl">رائے دیں (WhatsApp)</span>
            </button>
            
            {onInstall && (
              <button onClick={onInstall} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10 transition-all active:scale-95 text-xs">
                <Sparkles size={14} />
                <span className="urdu-text">ایپ انسٹال کریں</span>
              </button>
            )}
          </div>

          {activePopover && (
            <div className={`absolute inset-0 z-50 animate-in slide-in-from-bottom-full duration-500 flex flex-col shadow-2xl ${settings.highContrast ? 'bg-slate-900' : 'bg-[#0c4a6e]'}`}>
              <div className={`p-5 border-b flex items-center justify-between ${settings.highContrast ? 'border-slate-800' : 'border-white/10'}`}>
                <button onClick={() => setActivePopover(null)} className="p-2 hover:bg-white/10 rounded-full text-white transition-all active:scale-90">
                  <X size={24} />
                </button>
                <h3 className="text-lg font-black urdu-text text-white">
                  {activePopover === 'usage' ? 'طریقہ استعمال' : activePopover === 'whatsapp' ? 'واٹس ایپ سروس' : 'Urdu AI کا تعارف'}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
                {activePopover === 'whatsapp' ? (
                  <div className="flex flex-col items-center justify-center space-y-8 text-center" dir="rtl">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                      <MessageCircle size={56} className="text-white fill-current" />
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-2xl font-black text-white urdu-text">واٹس ایپ پر تحقیق کریں</h4>
                      <p className="text-sky-100 urdu-text leading-loose">
                        آپ اردو اے آئی کی تحقیقی خدمات براہ راست واٹس ایپ پر بھی حاصل کر سکتے ہیں۔ بس نیچے دیے گئے بٹن پر کلک کریں اور اپنا سوال واٹس ایپ پر بھیجیں۔
                      </p>
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                        <p className="text-xs text-sky-300 font-mono mb-1">آفیشل نمبر</p>
                        <p className="text-xl font-black text-white">{OFFICIAL_WHATSAPP_NUMBER}</p>
                      </div>
                      <a 
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black urdu-text text-xl shadow-2xl transition-all active:scale-95"
                      >
                        <MessageCircle size={24} />
                        <span>واٹس ایپ اوپن کریں</span>
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="urdu-text text-base md:text-lg leading-[2] text-right text-sky-100 whitespace-pre-wrap" dir="rtl">
                    {activePopover === 'usage' ? USAGE_PROCEDURE_TEXT : ABOUT_TEXT}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
