
import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X, Type, Volume2, Accessibility, MessageCircle, Sparkles, Info, LogOut, User as UserIcon, LogIn, Download, BookOpen, RefreshCw, CheckCircle2, Award, History } from 'lucide-react';
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
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                  <UserIcon size={20} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white urdu-text" dir="rtl">{settings.currentUser.name}</span>
                  <span className="text-[9px] text-sky-300 font-black uppercase tracking-widest">محقق</span>
                </div>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onShowLogin(); }} 
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#0c4a6e] rounded-xl font-black transition-all text-xs urdu-text active:scale-95 shadow-lg shadow-black/20"
              >
                <LogIn size={14} />
                <span>لاگ ان کریں</span>
              </button>
            )}
            <button type="button" onClick={() => setIsOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors text-white active:scale-90">
              <X size={22} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-3 shrink-0">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onNewChat(); if(window.innerWidth < 1024) setIsOpen(false); }} 
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black rounded-2xl transition-all active:scale-95 group shadow-xl border border-white/10"
            >
              <div className="flex items-center gap-3">
                <Plus size={20} className="text-white" />
                <span className="urdu-text text-base">نئی تحقیق</span>
              </div>
              <Sparkles size={16} className="text-yellow-300" />
            </button>

            {onInstall && (
              <button 
                type="button"
                onClick={onInstall}
                className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-black rounded-2xl transition-all active:scale-95 border border-emerald-500/20"
              >
                <Download size={18} />
                <span className="urdu-text text-sm">ایپ انسٹال کریں</span>
              </button>
            )}
          </div>

          {/* Scrollable History */}
          <div className="flex-1 overflow-y-auto px-4 space-y-4 no-scrollbar py-2 overscroll-contain">
            <div className="px-2 mb-1 flex items-center gap-2 opacity-50">
              <History size={12} className="text-white" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest urdu-text">سابقہ گفتگو</span>
            </div>
            
            {sessions.map(session => (
              <button 
                key={session.id} 
                type="button"
                onClick={() => {
                  onSelect(session.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all relative border text-right ${activeId === session.id ? 'bg-white/20 border-white/20 text-white' : 'hover:bg-white/5 text-white/60 border-transparent'} active:scale-[0.98]`}
              >
                <div className="flex-1 truncate text-xs urdu-text font-bold" dir="rtl">{session.title}</div>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} 
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-white/50 hover:text-red-400 transition-all rounded-lg active:scale-90"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))}
          </div>

          {/* Settings Section */}
          <div className="p-4 border-t border-white/10 space-y-3 bg-black/10">
            <div className="flex gap-2">
              <button type="button" onClick={toggleFontSize} className="flex-1 p-2.5 rounded-xl flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 transition-all border border-white/5 active:scale-95">
                <Type size={16} />
                <span className="text-[10px] urdu-text font-black">فونٹ</span>
              </button>
              <button type="button" onClick={toggleHighContrast} className="flex-1 p-2.5 rounded-xl flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 transition-all border border-white/5 active:scale-95">
                <Accessibility size={16} />
                <span className="text-[10px] urdu-text font-black">موڈ</span>
              </button>
            </div>

            <button type="button" onClick={onSendFeedback} className="w-full flex items-center gap-3 px-4 py-3 text-xs rounded-xl transition-all text-white bg-white/5 hover:bg-white/10 border border-white/5 active:scale-[0.98]">
              <MessageCircle size={16} className="text-emerald-400" />
              <span className="urdu-text flex-1 text-right font-black" dir="rtl">رائے دیں (Feedback)</span>
            </button>
            
            <div className="pt-2 flex flex-col items-center gap-0.5 opacity-60">
               <div className="text-[10px] text-white font-black uppercase tracking-widest">Global Research Centre</div>
               <div className="text-[10px] text-sky-200 urdu-text font-black">از قاری خالد محمود گولڈ میڈلسٹ</div>
            </div>
          </div>

          {/* Overlay Popover Panel */}
          {activePopover && (
            <div className="absolute inset-0 z-[60] flex flex-col bg-[#0c4a6e] animate-in slide-in-from-bottom-full duration-300">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <button type="button" onClick={() => setActivePopover(null)} className="p-2 text-white/50 hover:text-white transition-colors bg-white/10 rounded-full active:scale-90">
                  <X size={24} />
                </button>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-black urdu-text text-white">
                    {activePopover === 'usage' ? 'طریقہ استعمال' : 'ہمارے بارے میں'}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                <div className="text-lg urdu-text text-white text-right leading-loose whitespace-pre-wrap" dir="rtl">
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
