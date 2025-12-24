
import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X, Type, Volume2, Accessibility, MessageCircle, Sparkles, Info, LogOut, User as UserIcon, LogIn, Download, BookOpen, RefreshCw, CheckCircle2, Award, History, RotateCcw, HelpCircle, Minus } from 'lucide-react';
import { ChatSession, UserSettings } from '../types';
import { ABOUT_TEXT, USAGE_PROCEDURE_TEXT, APP_VERSION } from '../constants';

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [activePopover, setActivePopover] = useState<'about' | 'usage' | null>(null);

  const toggleHighContrast = () => setSettings({...settings, highContrast: !settings.highContrast});
  
  const increaseFontSize = () => {
    setSettings({...settings, fontSize: Math.min(settings.fontSize + 2, 40)});
  };

  const decreaseFontSize = () => {
    setSettings({...settings, fontSize: Math.max(settings.fontSize - 2, 12)});
  };

  const resetFontSize = () => {
    setSettings({...settings, fontSize: 18});
  };

  const setFont = (fam: 'naskh' | 'nastaleeq' | 'sans') => setSettings({...settings, fontFamily: fam});

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // 2. Delete all caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      // 3. Force hard reload with timestamp to bypass server-side caching
      setTimeout(() => {
        window.location.replace(window.location.origin + window.location.pathname + '?v=' + Date.now());
      }, 500);
    } catch (e) {
      console.error("Update failed:", e);
      window.location.reload();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
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
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${settings.highContrast ? 'bg-sky-500/20 border-sky-500/30' : 'bg-sky-500/20 border-white/10'}`}>
                  <UserIcon size={20} className="text-sky-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white urdu-text" dir="rtl">{settings.currentUser.name}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${settings.highContrast ? 'text-sky-400' : 'text-sky-300'}`}>Urdu AI User</span>
                </div>
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

            {onInstall && (
              <button 
                onClick={onInstall}
                className={`w-full flex items-center gap-3 px-4 py-3 font-black rounded-2xl transition-all active:scale-95 border ${settings.highContrast ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20'}`}
              >
                <Download size={18} />
                <span className="urdu-text text-sm">ایپ انسٹال کریں</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 no-scrollbar py-2 overscroll-contain">
            <div className="px-2 mb-2 flex items-center gap-2 opacity-50">
              <History size={12} className="text-white" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest urdu-text">سابقہ تحقیق</span>
            </div>
            
            {sessions.length === 0 ? (
              <div className="py-8 text-center opacity-30">
                <p className="urdu-text text-xs text-white">کوئی گفتگو موجود نہیں</p>
              </div>
            ) : (
              sessions.map(session => (
                <button 
                  key={session.id} 
                  onClick={() => { onSelect(session.id); if (window.innerWidth < 1024) setIsOpen(false); }}
                  className={`w-full group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all border text-right ${activeId === session.id ? 'bg-white/20 border-white/20 text-white shadow-xl translate-x-1' : 'hover:bg-white/5 text-white/50 border-transparent'} active:scale-[0.98]`}
                >
                  <div className="flex-1 truncate text-xs urdu-text font-bold" dir="rtl">{session.title || "نئی گفتگو"}</div>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-red-400 rounded-lg transition-all">
                    <Trash2 size={12} />
                  </button>
                </button>
              ))
            )}
          </div>

          <div className={`p-4 border-t space-y-3 ${settings.highContrast ? 'border-slate-800 bg-black/40' : 'border-white/10 bg-black/20'}`}>
            <div className="flex flex-col gap-2">
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
              <button onClick={toggleHighContrast} className={`w-full p-2.5 rounded-xl flex items-center justify-center gap-2 transition-all border active:scale-95 ${settings.highContrast ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-white/70 border-white/10'}`}>
                <Accessibility size={16} />
                <span className="text-[10px] urdu-text font-black">ڈارک موڈ</span>
              </button>
            </div>

            <div className="flex gap-1.5">
               <button onClick={() => setFont('nastaleeq')} className={`flex-1 py-2 px-1 rounded-lg text-[10px] urdu-text font-black border transition-all ${settings.fontFamily === 'nastaleeq' ? 'bg-white/20 border-white text-white shadow-lg' : 'border-white/5 text-white/40 hover:bg-white/5'}`}>نستعلیق</button>
               <button onClick={() => setFont('naskh')} className={`flex-1 py-2 px-1 rounded-lg text-[10px] urdu-text font-black border transition-all ${settings.fontFamily === 'naskh' ? 'bg-white/20 border-white text-white shadow-lg' : 'border-white/5 text-white/40 hover:bg-white/5'}`}>نسخ</button>
               <button onClick={() => setFont('sans')} className={`flex-1 py-2 px-1 rounded-lg text-[10px] urdu-text font-black border transition-all ${settings.fontFamily === 'sans' ? 'bg-white/20 border-white text-white shadow-lg' : 'border-white/5 text-white/40 hover:bg-white/5'}`}>سادہ</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleUpdate} 
                disabled={isUpdating}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all active:scale-95 overflow-hidden border ${settings.highContrast ? 'bg-sky-600/10 hover:bg-sky-600/20 text-sky-300 border-sky-600/20' : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/10'} ${isUpdating ? 'opacity-50' : ''}`}
              >
                <RotateCcw size={14} className={`${isUpdating ? 'animate-spin' : ''}`} />
                <span className="text-[10px] urdu-text font-black">{isUpdating ? 'جاری ہے...' : 'اپڈیٹ'}</span>
              </button>
              <button onClick={() => setActivePopover('usage')} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 border border-white/5 transition-all active:scale-95">
                <HelpCircle size={14} />
                <span className="text-[10px] urdu-text font-black">رہنمائی</span>
              </button>
            </div>

            <button onClick={() => setActivePopover('about')} className="w-full flex items-center gap-3 px-4 py-3 text-xs rounded-xl transition-all text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.98]">
              <Info size={16} className="text-sky-300" />
              <span className="urdu-text flex-1 text-right font-black" dir="rtl">تعارف (About)</span>
            </button>

            <button onClick={onSendFeedback} className="w-full flex items-center gap-3 px-4 py-3 text-xs rounded-xl transition-all text-white bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/20 active:scale-[0.98]">
              <MessageCircle size={16} className="text-[#25D366]" />
              <span className="urdu-text flex-1 text-right font-black" dir="rtl">رائے دیں (WhatsApp)</span>
            </button>
            
            <div className="pt-1 flex flex-col items-center gap-0.5 opacity-30">
               <div className="text-[8px] text-white font-black uppercase tracking-widest">Urdu AI • Version {APP_VERSION}</div>
               <div className="text-[8px] text-white/60 urdu-text">گلوبل ریسرچ سینٹر</div>
            </div>
          </div>

          {activePopover && (
            <div className={`absolute inset-0 z-50 animate-in slide-in-from-bottom-full duration-500 flex flex-col shadow-2xl ${settings.highContrast ? 'bg-slate-900' : 'bg-[#0c4a6e]'}`}>
              <div className={`p-5 border-b flex items-center justify-between ${settings.highContrast ? 'border-slate-800' : 'border-white/10'}`}>
                <button onClick={() => setActivePopover(null)} className="p-2 hover:bg-white/10 rounded-full text-white transition-all active:scale-90">
                  <X size={24} />
                </button>
                <h3 className="text-lg font-black urdu-text text-white">
                  {activePopover === 'usage' ? 'طریقہ استعمال' : 'Urdu AI کا تعارف'}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
                <div className="urdu-text text-base md:text-lg leading-[2] text-right text-sky-100 whitespace-pre-wrap" dir="rtl">
                  {activePopover === 'usage' ? USAGE_PROCEDURE_TEXT : ABOUT_TEXT}
                </div>
              </div>
              <div className="p-6 border-t border-white/10 flex justify-center">
                <button onClick={() => setActivePopover(null)} className="px-8 py-3 bg-white text-[#0c4a6e] font-black rounded-xl urdu-text transition-all active:scale-95 shadow-xl">سمجھ گیا</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
