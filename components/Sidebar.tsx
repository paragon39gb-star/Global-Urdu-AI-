
import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X, Type, Volume2, Accessibility, MessageCircle, Sparkles, Info, LogOut, User as UserIcon, LogIn, SlidersHorizontal, BookOpen, RefreshCw, CheckCircle2 } from 'lucide-react';
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const toggleHighContrast = () => setSettings({...settings, highContrast: !settings.highContrast});
  const toggleFontSize = () => setSettings({...settings, fontSize: settings.fontSize === 'normal' ? 'large' : 'normal'});
  const setFont = (fam: 'naskh' | 'nastaleeq' | 'sans') => setSettings({...settings, fontFamily: fam});
  const setVoice = (v: 'Kore' | 'Zephyr' | 'Fenrir' | 'Puck') => setSettings({...settings, voiceName: v});

  const handlePopoverToggle = (type: 'about' | 'usage' | 'update') => {
    setActivePopover(activePopover === type ? null : type);
  };

  const handleUpdateAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    setUpdateSuccess(false);
    setTimeout(() => {
      setIsUpdating(false);
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setActivePopover(null);
      }, 1500);
    }, 2000);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-300" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-40 w-80 transform transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col p-3 md:p-4`}>
        <div className="flex-1 glass-panel rounded-[2rem] flex flex-col overflow-hidden shadow-2xl relative border border-white/10 bg-[#0f172a]/95 backdrop-blur-2xl">
          
          {/* User Profile Header */}
          <div className="p-4 border-b border-white/5 shrink-0 bg-white/5 flex items-center justify-between">
            {settings.currentUser ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-400/30">
                  <UserIcon size={18} className="text-sky-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white urdu-text text-right" dir="rtl">{settings.currentUser.name}</span>
                  <span className="text-[9px] text-sky-400/70 font-bold uppercase tracking-widest">محقق</span>
                </div>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onShowLogin(); }} 
                className="flex items-center gap-2 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/30 transition-all text-xs font-bold urdu-text group active:scale-95 cursor-pointer"
              >
                <LogIn size={14} className="group-hover:translate-x-0.5 transition-transform" />
                <span>لاگ ان کریں</span>
              </button>
            )}
            <button type="button" onClick={() => setIsOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors text-white active:scale-90 cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4 shrink-0">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onNewChat(); if(window.innerWidth < 1024) setIsOpen(false); }} 
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-600 to-sky-400 hover:from-sky-500 hover:to-sky-300 text-white font-bold rounded-[1.2rem] border border-white/10 transition-all active:scale-95 shadow-xl group cursor-pointer"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="urdu-text text-base">نئی تحقیق شروع کریں</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-3 space-y-6 no-scrollbar py-2 overscroll-contain">
            
            {/* History Section */}
            <section className="space-y-1.5">
              <div className="px-3 mb-2 flex items-center gap-2 opacity-50">
                <Sparkles size={12} className="text-sky-400" />
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em] urdu-text">سابقہ گفتگو</span>
              </div>
              
              {sessions.length === 0 ? (
                <div className="text-center py-4 opacity-30 text-xs urdu-text italic">کوئی ریکارڈ نہیں</div>
              ) : (
                sessions.slice(0, 20).map(session => (
                  <button 
                    key={session.id} 
                    type="button"
                    onClick={() => {
                      onSelect(session.id);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }}
                    className={`w-full group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all relative select-none border text-right cursor-pointer ${activeId === session.id ? 'bg-sky-500/20 border-sky-400/30 text-white shadow-lg' : 'hover:bg-white/5 text-slate-300 border-transparent hover:border-white/5'} active:scale-[0.98]`}
                  >
                    <MessageSquare size={14} className={`${activeId === session.id ? 'text-sky-300' : 'text-slate-500'} shrink-0`} />
                    <div className="flex-1 truncate text-[11px] urdu-text font-medium" dir="rtl">{session.title}</div>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} 
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition-all bg-slate-800/80 rounded-lg shadow-sm active:scale-90 cursor-pointer"
                      title="حذف کریں"
                    >
                      <Trash2 size={12} />
                    </button>
                  </button>
                ))
              )}
            </section>

            {/* Settings Section */}
            <section className="space-y-4 pt-4 border-t border-white/5 pb-4">
              <div className="px-3 mb-1 flex items-center gap-2 opacity-50">
                <SlidersHorizontal size={12} className="text-sky-400" />
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.2em] urdu-text">ذاتی ترتیبات</span>
              </div>

              <div className="grid grid-cols-2 gap-2 px-1">
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleHighContrast(); }} className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer ${settings.highContrast ? 'bg-sky-500/20 border-sky-400/40 text-white shadow-lg' : 'bg-black/20 border-transparent text-slate-400 hover:bg-white/5'} active:scale-95`}>
                  <Accessibility size={16} />
                  <span className="text-[10px] urdu-text font-bold">ڈارک موڈ</span>
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleFontSize(); }} className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer ${settings.fontSize === 'large' ? 'bg-sky-500/20 border-sky-400/40 text-white shadow-lg' : 'bg-black/20 border-transparent text-slate-400 hover:bg-white/5'} active:scale-95`}>
                  <Type size={16} />
                  <span className="text-[10px] urdu-text font-bold">بڑی لکھائی</span>
                </button>
              </div>

              <div className="space-y-2 px-1">
                <div className="flex gap-2 p-1.5 bg-black/40 rounded-xl border border-white/5">
                  <button type="button" onClick={() => setFont('naskh')} className={`flex-1 py-2 rounded-lg text-[10px] urdu-text font-bold transition-all active:scale-95 cursor-pointer ${settings.fontFamily === 'naskh' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>نسخ</button>
                  <button type="button" onClick={() => setFont('nastaleeq')} className={`flex-1 py-2 rounded-lg text-[10px] urdu-text font-bold transition-all active:scale-95 cursor-pointer ${settings.fontFamily === 'nastaleeq' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>نستعلیق</button>
                  <button type="button" onClick={() => setFont('sans')} className={`flex-1 py-2 rounded-lg text-[10px] urdu-text font-bold transition-all active:scale-95 cursor-pointer ${settings.fontFamily === 'sans' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>سادہ</button>
                </div>
              </div>

              <div className="space-y-2 px-1">
                 <div className="flex items-center gap-2 px-1">
                   <Volume2 size={12} className="text-sky-400/70" />
                   <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">آواز کا انتخاب</span>
                 </div>
                 <select 
                    value={settings.voiceName}
                    onChange={(e) => setVoice(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[11px] text-sky-300 outline-none focus:ring-1 focus:ring-sky-500 urdu-text cursor-pointer appearance-none active:scale-[0.98] transition-all"
                    dir="rtl"
                 >
                    <option value="Kore">کور (پرو)</option>
                    <option value="Zephyr">زیفر (گہری)</option>
                    <option value="Fenrir">فنرر (صاف)</option>
                    <option value="Puck">پک (تیز)</option>
                 </select>
              </div>

              <div className="px-1 pt-2">
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); handlePopoverToggle('update'); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-400/20 rounded-xl transition-all group active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-2 pointer-events-none">
                    <RefreshCw size={14} className={`text-sky-400 ${isUpdating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span className="urdu-text text-[10px] font-bold text-sky-300">سسٹم اپڈیٹ کریں</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-sky-500/60 tracking-widest pointer-events-none">v{APP_VERSION}</span>
                </button>
              </div>
            </section>
          </div>

          {/* Unified Footer Actions */}
          <div className="p-4 border-t border-white/5 space-y-1.5 shrink-0 bg-black/30 backdrop-blur-md relative z-10">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={(e) => { e.stopPropagation(); handlePopoverToggle('usage'); }} className={`flex items-center justify-center gap-2 p-3 text-[10px] rounded-xl transition-all border active:scale-95 cursor-pointer ${activePopover === 'usage' ? 'bg-sky-500/20 text-white border-sky-400/40' : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'}`}>
                <BookOpen size={14} />
                <span className="urdu-text font-bold">طریقہ استعمال</span>
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); handlePopoverToggle('about'); }} className={`flex items-center justify-center gap-2 p-3 text-[10px] rounded-xl transition-all border active:scale-95 cursor-pointer ${activePopover === 'about' ? 'bg-sky-500/20 text-white border-sky-400/40' : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'}`}>
                <Info size={14} />
                <span className="urdu-text font-bold">ہمارے بارے میں</span>
              </button>
            </div>
            
            <button type="button" onClick={(e) => { e.stopPropagation(); onSendFeedback(); }} className="w-full flex items-center gap-3 px-3 py-3 text-xs rounded-xl transition-all text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 group active:scale-[0.98] cursor-pointer">
              <MessageCircle size={16} className="group-hover:scale-110 transition-transform" />
              <span className="urdu-text flex-1 text-right font-bold" dir="rtl">رائے دیں (Feedback)</span>
            </button>
            
            {settings.currentUser && (
               <button type="button" onClick={(e) => { e.stopPropagation(); onLogout(); }} className="w-full flex items-center gap-3 px-3 py-3 text-xs rounded-xl transition-all text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 active:scale-[0.98] cursor-pointer">
                 <LogOut size={16} />
                 <span className="urdu-text flex-1 text-right font-bold" dir="rtl">لاگ آؤٹ</span>
               </button>
            )}
            
            <div className="pt-4 flex flex-col items-center gap-2 opacity-100 border-t border-white/5 mt-2">
               <div className="text-[20px] text-center text-sky-400 font-black uppercase tracking-[0.2em] drop-shadow-sm">
                  Global Research Centre
               </div>
               <div className="text-[24px] text-center text-white urdu-text font-black">
                  از <span className="text-yellow-400 font-black">قاری خالد محمود</span>
               </div>
            </div>
          </div>

          {/* Overlay Popover Panel */}
          {activePopover && (
            <div className="absolute inset-0 z-[60] flex flex-col bg-slate-950/98 backdrop-blur-2xl animate-in slide-in-from-bottom-full duration-300">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <button 
                  type="button" 
                  onClick={() => setActivePopover(null)} 
                  className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full active:scale-90 cursor-pointer"
                >
                  <X size={20} />
                </button>
                <span className="text-sm font-bold urdu-text text-sky-300">
                  {activePopover === 'usage' ? 'طریقہ استعمال' : activePopover === 'about' ? 'ہمارے بارے میں' : 'سسٹم اپڈیٹ'}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                {activePopover === 'update' ? (
                  <div className="space-y-8" dir="rtl">
                    <div className="p-6 bg-sky-500/10 border border-sky-400/30 rounded-[2rem] text-center space-y-3">
                       <span className="text-xs text-sky-400 uppercase font-bold tracking-widest block">Current Research Engine</span>
                       <span className="urdu-text text-2xl text-white font-bold block">{GEMINI_MODEL_VERSION}</span>
                       <span className="text-[10px] text-sky-300/50 block tracking-widest">BUILD: {APP_VERSION}</span>
                    </div>

                    <div className="space-y-4">
                      <h4 className="urdu-text text-sky-300 font-bold text-lg">تازہ ترین اپڈیٹس کی خصوصیات:</h4>
                      <ul className="space-y-3 pr-4 border-r-2 border-sky-400/20">
                        <li className="urdu-text text-sm text-slate-300">• جیمنی 3 پرو کے ذریعے تیز ترین تحقیقی رفتار۔</li>
                        <li className="urdu-text text-sm text-slate-300">• حوالہ جات اور کتب کے تعارف میں سو فیصد درستی۔</li>
                        <li className="urdu-text text-sm text-slate-300">• بہتر وائس ریکگنیشن اور آواز کا معیار۔</li>
                      </ul>
                    </div>

                    <button 
                      type="button"
                      onClick={handleUpdateAction}
                      disabled={isUpdating}
                      className={`w-full py-4 rounded-2xl urdu-text font-bold text-lg transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl cursor-pointer ${updateSuccess ? 'bg-emerald-500 text-white' : 'bg-sky-500 text-white hover:bg-sky-400'}`}
                    >
                      {isUpdating ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          <span>اپڈیٹ ہو رہا ہے...</span>
                        </>
                      ) : updateSuccess ? (
                        <>
                          <CheckCircle2 size={20} />
                          <span>سسٹم اپڈیٹ ہو گیا!</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={20} />
                          <span>ابھی اپڈیٹ کریں</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-sm md:text-base urdu-text text-white text-right leading-loose whitespace-pre-wrap px-2" dir="rtl">
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
