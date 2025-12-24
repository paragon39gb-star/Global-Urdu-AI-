
import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X, Type, Volume2, Accessibility, MessageCircle, Sparkles, Info, LogOut, User as UserIcon, LogIn, SlidersHorizontal, BookOpen, RefreshCw, CheckCircle2, Award, History } from 'lucide-react';
import { ChatSession, UserSettings } from '../types';
import { ABOUT_TEXT, USAGE_PROCEDURE_TEXT, APP_VERSION, GEMINI_MODEL_VERSION } from '../constants';

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
  onSendFeedback
}) => {
  const [activePopover, setActivePopover] = useState<'about' | 'usage' | 'update' | null>(null);

  const toggleHighContrast = () => setSettings({...settings, highContrast: !settings.highContrast});
  const toggleFontSize = () => setSettings({...settings, fontSize: settings.fontSize === 'normal' ? 'large' : 'normal'});
  const setFont = (fam: 'naskh' | 'nastaleeq' | 'sans') => setSettings({...settings, fontFamily: fam});

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#0c4a6e]/40 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-300" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 w-80 transform transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col p-3`}>
        <div className="flex-1 rounded-[2rem] flex flex-col overflow-hidden shadow-2xl border border-[#0ea5e9]/20 bg-[#0c4a6e] relative">
          
          {/* User Profile Header */}
          <div className="p-5 border-b border-white/10 shrink-0 bg-white/5 flex items-center justify-between">
            {settings.currentUser ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                  <UserIcon size={24} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black text-white urdu-text text-right" dir="rtl">{settings.currentUser.name}</span>
                  <span className="text-[10px] text-sky-300 font-black uppercase tracking-widest">محقق</span>
                </div>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onShowLogin(); }} 
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#0c4a6e] rounded-xl font-black transition-all text-sm urdu-text active:scale-95 shadow-lg shadow-black/20"
              >
                <LogIn size={16} />
                <span>لاگ ان کریں</span>
              </button>
            )}
            <button type="button" onClick={() => setIsOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors text-white active:scale-90">
              <X size={24} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-5 shrink-0">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onNewChat(); if(window.innerWidth < 1024) setIsOpen(false); }} 
              className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black rounded-2xl transition-all active:scale-95 group shadow-xl shadow-black/20 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <Plus size={22} className="text-white" />
                <span className="urdu-text text-lg">نئی تحقیق شروع کریں</span>
              </div>
              <Sparkles size={18} className="text-yellow-300 animate-pulse" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar py-2 overscroll-contain">
            
            {/* History Section */}
            <section className="space-y-2">
              <div className="px-3 mb-2 flex items-center gap-2 opacity-60">
                <History size={14} className="text-white" />
                <span className="text-[12px] font-black text-white uppercase tracking-widest urdu-text">سابقہ گفتگو</span>
              </div>
              
              {sessions.map(session => (
                <button 
                  key={session.id} 
                  type="button"
                  onClick={() => {
                    onSelect(session.id);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`w-full group flex items-center gap-3 px-4 py-4 rounded-2xl transition-all relative select-none border text-right ${activeId === session.id ? 'bg-white/20 border-white/20 text-white shadow-lg' : 'hover:bg-white/5 text-white/70 border-transparent'} active:scale-[0.98]`}
                >
                  <MessageSquare size={16} className="shrink-0 opacity-50" />
                  <div className="flex-1 truncate text-sm urdu-text font-bold" dir="rtl">{session.title}</div>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} 
                    className="opacity-0 group-hover:opacity-100 p-2 text-white/50 hover:text-red-400 transition-all bg-[#0c4a6e] rounded-xl shadow-lg active:scale-90"
                  >
                    <Trash2 size={14} />
                  </button>
                </button>
              ))}
            </section>

            {/* Settings Section */}
            <section className="space-y-4 pt-6 border-t border-white/10">
              <div className="px-3 mb-1 opacity-60">
                <span className="text-[12px] font-black text-white uppercase tracking-widest urdu-text">ترتیبات</span>
              </div>

              <div className="grid grid-cols-2 gap-3 px-1">
                <button type="button" onClick={toggleFontSize} className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${settings.fontSize === 'large' ? 'bg-white/20 border-white/20' : 'bg-transparent border-white/10 text-white/50'} active:scale-95`}>
                  <Type size={18} />
                  <span className="text-[11px] urdu-text font-black">بڑی لکھائی</span>
                </button>
                <button type="button" onClick={toggleHighContrast} className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${settings.highContrast ? 'bg-white/20 border-white/20' : 'bg-transparent border-white/10 text-white/50'} active:scale-95`}>
                  <Accessibility size={18} />
                  <span className="text-[11px] urdu-text font-black">ہائی کنٹراسٹ</span>
                </button>
              </div>

              <div className="space-y-2 px-1">
                <div className="flex gap-2 p-2 bg-black/20 rounded-2xl border border-white/10">
                  <button type="button" onClick={() => setFont('naskh')} className={`flex-1 py-3 rounded-xl text-xs urdu-text font-black transition-all ${settings.fontFamily === 'naskh' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40'}`}>نسخ</button>
                  <button type="button" onClick={() => setFont('nastaleeq')} className={`flex-1 py-3 rounded-xl text-xs urdu-text font-black transition-all ${settings.fontFamily === 'nastaleeq' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40'}`}>نستعلیق</button>
                  <button type="button" onClick={() => setFont('sans')} className={`flex-1 py-3 rounded-xl text-xs urdu-text font-black transition-all ${settings.fontFamily === 'sans' ? 'bg-white/20 text-white shadow-lg' : 'text-white/40'}`}>سادہ</button>
                </div>
              </div>
            </section>
          </div>

          {/* Unified Footer Actions */}
          <div className="p-5 border-t border-white/10 space-y-3 shrink-0 bg-black/20 backdrop-blur-md">
            <button type="button" onClick={onSendFeedback} className="w-full flex items-center gap-3 px-4 py-4 text-sm rounded-2xl transition-all text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/20 active:scale-[0.98] shadow-lg shadow-black/10">
              <MessageCircle size={20} className="text-emerald-400" />
              <span className="urdu-text flex-1 text-right font-black" dir="rtl">رائے دیں (Feedback)</span>
            </button>
            
            <div className="pt-4 flex flex-col items-center gap-1 border-t border-white/10 mt-2">
               <div className="text-[14px] text-white font-black uppercase tracking-widest text-center">
                  Global Research Centre
               </div>
               <div className="text-base text-sky-200 urdu-text font-black text-center">
                  از قاری خالد محمود گولڈ میڈلسٹ
               </div>
               <div className="mt-2 flex gap-4">
                  <button onClick={() => setActivePopover('about')} className="text-[10px] text-white/50 hover:text-white urdu-text font-black">ہمارے بارے میں</button>
                  <button onClick={() => setActivePopover('usage')} className="text-[10px] text-white/50 hover:text-white urdu-text font-black">طریقہ استعمال</button>
               </div>
            </div>
          </div>

          {/* Overlay Popover Panel */}
          {activePopover && (
            <div className="absolute inset-0 z-[60] flex flex-col bg-[#0c4a6e] animate-in slide-in-from-bottom-full duration-300">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <button type="button" onClick={() => setActivePopover(null)} className="p-3 text-white/50 hover:text-white transition-colors bg-white/10 rounded-full active:scale-90">
                  <X size={24} />
                </button>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-black urdu-text text-white">
                    {activePopover === 'usage' ? 'طریقہ استعمال' : 'ہمارے بارے میں'}
                  </span>
                  <span className="text-[10px] text-sky-400 font-bold tracking-widest uppercase">Chat GRC Research</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                <div className="text-lg md:text-xl urdu-text text-white text-right leading-loose whitespace-pre-wrap px-2" dir="rtl">
                  {activePopover === 'usage' ? USAGE_PROCEDURE_TEXT : ABOUT_TEXT}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
