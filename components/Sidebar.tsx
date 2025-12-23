
import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X, Settings, Terminal, Type, Volume2, Accessibility, RefreshCw, MessageCircle, Sparkles } from 'lucide-react';
import { ChatSession, UserSettings } from '../types';

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
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  isOpen,
  setIsOpen,
  customInstructions,
  setCustomInstructions,
  settings,
  setSettings
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const toggleHighContrast = () => setSettings({...settings, highContrast: !settings.highContrast});
  const toggleFontSize = () => setSettings({...settings, fontSize: settings.fontSize === 'normal' ? 'large' : 'normal'});
  const setFont = (fam: 'nastaleeq' | 'sans') => setSettings({...settings, fontFamily: fam});
  const setVoice = (v: 'Kore' | 'Zephyr' | 'Fenrir' | 'Puck') => setSettings({...settings, voiceName: v});

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col p-4`}>
        <div className="flex-1 glass-panel rounded-[2rem] flex flex-col overflow-hidden shadow-2xl relative">
          
          {/* Header */}
          <div className="p-4 flex items-center justify-between gap-3 shrink-0 border-b border-white/5">
            <button onClick={onNewChat} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-bold rounded-2xl border border-white/10 transition-all active:scale-95 shadow-lg group">
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              <span className="urdu-text">نئی تحقیق</span>
            </button>
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-2.5 hover:bg-white/5 rounded-xl transition-colors text-white">
              <X size={20} />
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1.5 no-scrollbar py-6">
            <div className="px-3 mb-4 flex items-center gap-2">
              <Sparkles size={12} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] urdu-text opacity-80">حالیہ تحقیق</span>
            </div>
            {sessions.length === 0 ? (
              <div className="text-center py-10 opacity-30 text-xs urdu-text italic">کوئی سابقہ ریکارڈ نہیں</div>
            ) : (
              sessions.map(session => (
                <div 
                  key={session.id} 
                  className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all relative ${activeId === session.id ? 'bg-indigo-500/15 border border-indigo-400/20 text-white shadow-[0_4px_20px_rgba(99,102,241,0.1)]' : 'hover:bg-white/5 text-slate-400 border border-transparent'}`} 
                  onClick={() => onSelect(session.id)}
                >
                  <MessageSquare size={16} className={`${activeId === session.id ? 'text-indigo-400' : 'text-slate-600'} shrink-0`} />
                  <div className="flex-1 truncate text-xs urdu-text text-right font-medium" dir="rtl">{session.title}</div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} 
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 transition-opacity bg-slate-800/80 rounded-lg backdrop-blur-sm"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-white/5 space-y-2 shrink-0 bg-white/5">
            <button onClick={() => { setShowInstructions(!showInstructions); setShowSettings(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-xs rounded-xl transition-all ${showInstructions ? 'bg-indigo-500/20 text-white border border-indigo-400/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
              <Terminal size={18} className={showInstructions ? 'text-indigo-400' : ''} />
              <span className="urdu-text flex-1 text-right" dir="rtl">تحقیق کی ہدایات</span>
            </button>
            <button onClick={() => { setShowSettings(!showSettings); setShowInstructions(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-xs rounded-xl transition-all ${showSettings ? 'bg-indigo-500/20 text-white border border-indigo-400/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
              <Settings size={18} className={showSettings ? 'text-indigo-400' : ''} />
              <span className="urdu-text flex-1 text-right" dir="rtl">ترتیبات و رسائی</span>
            </button>
          </div>

          {/* Floating Panels */}
          {showInstructions && (
            <div className="absolute inset-x-4 bottom-32 glass-panel border-indigo-500/30 rounded-3xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <button onClick={() => setShowInstructions(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                <span className="text-xs font-bold urdu-text text-indigo-400 tracking-wider">ریسرچ گائیڈ لائنز</span>
              </div>
              <textarea 
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="مثال: ہمیشہ تحقیقی حوالہ جات کے ساتھ جواب دیں..."
                className="w-full h-36 bg-black/40 border border-white/10 rounded-xl p-3 text-xs urdu-text text-white text-right placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                dir="rtl"
              />
            </div>
          )}

          {showSettings && (
            <div className="absolute inset-x-4 bottom-20 glass-panel border-indigo-500/30 rounded-3xl shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-bottom-4 overflow-y-auto max-h-[75vh] no-scrollbar">
               <div className="space-y-5">
                 <div className="flex items-center justify-between border-b border-white/10 pb-3">
                   <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                   <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] urdu-text">ترتیبات</span>
                 </div>

                 <div className="space-y-3">
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest"><Accessibility size={12}/> Access</div>
                   <button onClick={toggleHighContrast} className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${settings.highContrast ? 'bg-indigo-500/20 border-indigo-400/30' : 'bg-black/20 border border-transparent'}`}>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.highContrast ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.highContrast ? 'right-1' : 'left-1'}`} />
                      </div>
                      <span className="text-xs urdu-text text-slate-300">ہائی کنٹراسٹ</span>
                   </button>
                   <button onClick={toggleFontSize} className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${settings.fontSize === 'large' ? 'bg-indigo-500/20 border-indigo-400/30' : 'bg-black/20 border border-transparent'}`}>
                      <Type size={14} className={settings.fontSize === 'large' ? 'text-indigo-400' : 'text-slate-500'}/>
                      <span className="text-xs urdu-text text-slate-300">بڑی تحریر</span>
                   </button>
                 </div>

                 <div className="space-y-3">
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest"><Type size={12}/> Font</div>
                   <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                      <button onClick={() => setFont('nastaleeq')} className={`flex-1 py-2 rounded-lg text-xs urdu-text transition-all ${settings.fontFamily === 'nastaleeq' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}>نستعلیق</button>
                      <button onClick={() => setFont('sans')} className={`flex-1 py-2 rounded-lg text-xs urdu-text transition-all ${settings.fontFamily === 'sans' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}>سادہ</button>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest"><Volume2 size={12}/> Voice</div>
                   <select 
                      value={settings.voiceName}
                      onChange={(e) => setVoice(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-indigo-300 outline-none focus:ring-1 focus:ring-indigo-500"
                   >
                      <option value="Kore">Kore (Recommended)</option>
                      <option value="Zephyr">Zephyr (Warm)</option>
                      <option value="Fenrir">Fenrir (Deep)</option>
                      <option value="Puck">Puck (Energetic)</option>
                   </select>
                 </div>

                 <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                   <button className="flex items-center justify-between p-2 text-[10px] text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">
                      <RefreshCw size={12} />
                      <span>Check Updates</span>
                   </button>
                   <button className="flex items-center justify-between p-2 text-[10px] text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">
                      <MessageCircle size={12} />
                      <span>Feedback</span>
                   </button>
                 </div>

                 <div className="text-[8px] text-center text-slate-600 font-mono py-2 opacity-50">
                    CHAT GRC v3.5.0 • QARI KHALID MAHMOOD
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
