
import React from 'react';
import { Plus, Trash2, X, MessageCircle, Sparkles, Info, LogOut, User as UserIcon, LogIn, History, HelpCircle, ShieldCheck, Lock, Settings, Type } from 'lucide-react';
import { ChatSession, UserSettings } from '../types';
import { ADMIN_EMAIL } from '../constants';

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
  onShowIntro: () => void;
  onShowUsage: () => void;
  onSendFeedback: () => void;
  isAuthorized?: boolean;
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
  onShowIntro,
  onShowUsage,
  onSendFeedback,
  customInstructions,
  setCustomInstructions,
  isAuthorized = true
}) => {
  const isAdmin = settings.currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const fontOptions: { id: UserSettings['fontFamily']; label: string }[] = [
    { id: 'noto-nastaliq', label: 'نوٹو نستعلیق' },
    { id: 'nastaleeq', label: 'جمیل نوری' },
    { id: 'naskh', label: 'نسخ' },
    { id: 'sans', label: 'سینز' },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-30 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 w-80 transform transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col p-3 h-full`}>
        <div className={`flex-1 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl border relative ${settings.highContrast ? 'bg-slate-900 border-slate-700' : 'bg-[#0c4a6e] border-white/10'}`}>
          
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
            {settings.currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-500/20 border border-white/10">
                    <UserIcon size={20} className="text-sky-300" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white urdu-text" dir="rtl">{settings.currentUser.name}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-sky-300">{isAdmin ? 'ایڈمن' : 'محقق'}</span>
                  </div>
                </div>
                <button onClick={onLogout} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={onShowLogin} className="flex items-center gap-2 px-4 py-2 bg-white text-[#0c4a6e] rounded-xl font-black transition-all text-xs urdu-text shadow-lg">
                <LogIn size={14} />
                <span>لاگ ان کریں</span>
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-white">
              <X size={22} />
            </button>
          </div>

          {/* Font Settings Section */}
          <div className="p-4 border-b border-white/10 bg-black/10">
            <div className="flex items-center gap-2 mb-3 px-2">
              <Type size={12} className="text-sky-300" />
              <span className="text-[10px] font-black text-sky-200 uppercase tracking-widest urdu-text">فونٹ تبدیل کریں</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
               {fontOptions.map(font => (
                 <button
                   key={font.id}
                   onClick={() => setSettings({ ...settings, fontFamily: font.id })}
                   className={`px-2 py-2 rounded-xl text-[11px] font-bold urdu-text transition-all border ${settings.fontFamily === font.id ? 'bg-white text-[#0c4a6e] border-white shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                 >
                   {font.label}
                 </button>
               ))}
            </div>
          </div>

          <div className="p-4 space-y-2 shrink-0">
            <button 
              onClick={() => { if(!isAuthorized) { onShowLogin(); return; } onNewChat(); if(window.innerWidth < 1024) setIsOpen(false); }} 
              className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-white font-black rounded-2xl transition-all active:scale-95 group shadow-xl border bg-[#0ea5e9] hover:bg-[#0284c7] border-white/10 ${!isAuthorized ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                {isAuthorized ? <Plus size={20} /> : <Lock size={20} className="text-white/50" />}
                <span className="urdu-text text-base">نئی تحقیق</span>
              </div>
              <Sparkles size={16} className="text-yellow-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-4 no-scrollbar py-2">
            {!isAuthorized ? (
               <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                  <ShieldCheck size={48} className="text-white mb-4" />
                  <p className="urdu-text text-xs text-white">تحقیق شروع کرنے کے لیے لاگ ان کریں</p>
               </div>
            ) : (
              <div className="space-y-2">
                <div className="px-2 mb-2 flex items-center gap-2 opacity-50">
                  <History size={12} className="text-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest urdu-text">تاریخ</span>
                </div>
                {sessions.map(session => (
                  <button 
                    key={session.id} 
                    onClick={() => { onSelect(session.id); if (window.innerWidth < 1024) setIsOpen(false); }}
                    className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all border text-right ${activeId === session.id ? 'bg-white/20 border-white/20 text-white' : 'hover:bg-white/5 text-white/50 border-transparent'}`}
                  >
                    <div className="flex-1 truncate text-xs urdu-text font-bold" dir="rtl">{session.title || "نئی گفتگو"}</div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {isAdmin && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="px-2 flex items-center gap-2 opacity-50">
                   <Settings size={12} className="text-white" />
                   <span className="text-[10px] font-black text-white uppercase urdu-text">ایڈمن سیٹنگز</span>
                </div>
                <textarea 
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="سسٹم ہدایات یہاں لکھیں..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-[10px] text-white urdu-text outline-none focus:border-sky-400"
                  rows={4}
                />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 space-y-3 bg-black/20">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { onShowUsage(); if(window.innerWidth < 1024) setIsOpen(false); }} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 text-white/60 text-[10px] urdu-text font-black">
                <HelpCircle size={14} />
                <span>رہنمائی</span>
              </button>
              <button onClick={() => { onShowIntro(); if(window.innerWidth < 1024) setIsOpen(false); }} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 text-white/60 text-[10px] urdu-text font-black">
                <Info size={14} />
                <span>تعارف</span>
              </button>
            </div>

            <button onClick={onSendFeedback} className="w-full flex items-center gap-3 px-4 py-3 text-xs rounded-xl text-white bg-emerald-500/20 border border-emerald-500/20">
              <MessageCircle size={16} className="text-emerald-500" />
              <span className="urdu-text flex-1 text-right font-black" dir="rtl">رابطہ (WhatsApp)</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
