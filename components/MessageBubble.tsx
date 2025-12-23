
import React, { useMemo } from 'react';
import { Sparkles, User, Copy, Check, ExternalLink, FileText } from 'lucide-react';
import { Message, UserSettings } from '../types';
import { marked } from 'marked';

interface MessageBubbleProps {
  message: Message;
  settings: UserSettings;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, settings }) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = React.useState(false);
  const sources = message.sources || [];

  const isUrdu = /[\u0600-\u06FF]/.test(message.content);

  const htmlContent = useMemo(() => {
    return marked.parse(message.content || '');
  }, [message.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full group py-8 md:py-12 px-4 md:px-12 flex flex-col md:flex-row gap-6 ${isAssistant ? 'relative' : ''}`}>
      
      {/* Visual background for assistant response */}
      {isAssistant && (
        <div className="absolute inset-x-4 md:inset-x-8 inset-y-2 glass-panel rounded-[2.5rem] border-white/5 bg-gradient-to-br from-indigo-900/5 to-transparent -z-0" />
      )}

      <div className="flex shrink-0 gap-4 relative z-10 items-start">
         <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${isAssistant ? 'bg-gradient-to-br from-indigo-600 to-violet-600 border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-slate-800 border-white/10 shadow-xl'}`}>
            {isAssistant ? <Sparkles size={20} className="text-white md:w-6 md:h-6" /> : <User size={20} className="text-white md:w-6 md:h-6" />}
          </div>
          <div className="md:hidden flex-1">
             <div className="font-bold text-[10px] text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                {isAssistant ? 'Chat GRC' : 'User'}
                {isAssistant && <span className="text-[7px] px-1.5 py-0.5 bg-indigo-500/20 rounded border border-indigo-400/30">RESEARCH AI</span>}
             </div>
          </div>
      </div>

      <div className="flex-1 space-y-4 overflow-hidden relative z-10">
        <div className="hidden md:flex font-bold text-[10px] text-indigo-400 uppercase tracking-[0.2em] items-center gap-3 opacity-60">
          {isAssistant ? (
            <>
              <span>Chat GRC Research Node</span>
              <div className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-[8px] px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-400/20">VERIFIED</span>
            </>
          ) : 'Authorized User Access'}
        </div>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {message.attachments.map((att, i) => (
              <div key={i} className="max-w-[180px] md:max-w-[240px] border border-white/10 rounded-2xl overflow-hidden glass-card shadow-2xl ring-1 ring-white/5">
                {att.previewUrl ? (
                  <img src={att.previewUrl} className="w-full max-h-48 md:max-h-60 object-contain bg-black/40" />
                ) : (
                  <div className="p-4 flex items-center gap-3">
                    <FileText size={18} className="text-indigo-400" />
                    <span className="text-xs text-slate-300 truncate font-mono">{att.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div 
          className={`prose prose-invert max-w-none break-words leading-relaxed ${isUrdu ? 'urdu-text text-right' : 'text-left'} prose-headings:text-white prose-strong:text-indigo-400 prose-code:bg-black/60 prose-code:p-1.5 prose-code:rounded-lg prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl`}
          style={{ fontSize: settings.fontSize === 'large' ? (isUrdu ? '1.4rem' : '1.2rem') : (isUrdu ? '1.2rem' : '1.05rem') }}
          dir={isUrdu ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {sources.length > 0 && (
          <div className="mt-6 p-5 glass-panel rounded-[1.5rem] border-indigo-500/20 bg-indigo-500/5">
            <div className="flex items-center gap-2 mb-3">
               <ExternalLink size={12} className="text-indigo-400" />
               <h4 className="text-[10px] font-bold text-indigo-400 urdu-text uppercase tracking-widest">تحقیق کے ذرائع (Sources):</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((s, idx) => (
                <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-black/30 hover:bg-black/60 rounded-xl text-[10px] text-slate-300 transition-all border border-white/5 hover:border-indigo-500/30 hover:scale-105 active:scale-95 shadow-sm">
                  <span className="truncate max-w-[120px] md:max-w-[200px]">{s.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {isAssistant && message.content && (
          <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button onClick={handleCopy} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all flex items-center gap-2 text-[10px]">
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              <span className="urdu-text tracking-wider">نقل کریں</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
