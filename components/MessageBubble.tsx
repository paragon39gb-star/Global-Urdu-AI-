
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Sparkles, User, Copy, Check, ExternalLink, Share2, Volume2, Play, Pause, Square, Loader2 } from 'lucide-react';
import { Message, UserSettings } from '../types';
import { marked } from 'marked';
import { chatGRC } from '../services/geminiService';

interface MessageBubbleProps {
  message: Message;
  settings: UserSettings;
}

type AudioState = 'idle' | 'loading' | 'playing' | 'paused';

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, settings }) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  
  const sources = message.sources || [];
  const isUrdu = /[\u0600-\u06FF]/.test(message.content);

  const htmlContent = useMemo(() => {
    return marked.parse(message.content || '');
  }, [message.content]);

  useEffect(() => {
    return () => { stopAudio(); };
  }, []);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current = null;
    }
    setAudioState('idle');
    offsetRef.current = 0;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chat GRC Research',
          text: message.content,
          url: window.location.href,
        });
      } catch (err) {}
    } else {
      handleCopy();
    }
  };

  const handleSpeak = async () => {
    if (audioState === 'playing') {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
        sourceNodeRef.current = null;
      }
      if (audioContextRef.current) {
        const elapsedSinceStart = audioContextRef.current.currentTime - startTimeRef.current;
        offsetRef.current += elapsedSinceStart * settings.voiceSpeed;
      }
      setAudioState('paused');
      return;
    }

    if (audioState === 'paused' && audioBufferRef.current) {
      playFromOffset(offsetRef.current);
      return;
    }

    setAudioState('loading');
    const base64Audio = await chatGRC.textToSpeech(message.content, settings.voiceName);
    
    if (base64Audio) {
      try {
        const audioData = atob(base64Audio);
        const arrayBuffer = new Uint8Array(audioData.length).map((_, i) => audioData.charCodeAt(i)).buffer;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioCtx;
        const dataInt16 = new Int16Array(arrayBuffer);
        const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        audioBufferRef.current = buffer;
        playFromOffset(0);
      } catch (err) {
        setAudioState('idle');
      }
    } else {
      setAudioState('idle');
    }
  };

  const playFromOffset = (offset: number) => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = settings.voiceSpeed;
    const gainNode = audioContextRef.current.createGain();
    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    const duration = audioBufferRef.current.duration;
    const startPos = Math.max(0, Math.min(offset, duration - 0.01));
    source.start(0, startPos);
    sourceNodeRef.current = source;
    startTimeRef.current = audioContextRef.current.currentTime;
    setAudioState('playing');
    source.onended = () => {
      if (sourceNodeRef.current === source) {
        setAudioState('idle');
        offsetRef.current = 0;
        sourceNodeRef.current = null;
      }
    };
  };

  return (
    <div className={`w-full py-5 md:py-12 px-4 md:px-14 flex flex-col md:flex-row gap-4 md:gap-12 animate-bubble border border-white/5 shadow-xl ${isAssistant ? 'bg-white/5 rounded-[1.8rem] md:rounded-[4rem]' : 'bg-sky-500/10 rounded-[1.8rem] md:rounded-[4rem] border-sky-400/20'}`}>
      
      <div className="flex shrink-0 gap-3 items-start md:mt-2">
         <div className={`w-10 h-10 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${isAssistant ? 'bg-sky-600 border-sky-400' : 'bg-slate-700 border-slate-600'}`}>
            {isAssistant ? <Sparkles size={20} className="text-white md:w-8 md:h-8" /> : <User size={20} className="text-white md:w-8 md:h-8" />}
          </div>
          <div className="md:hidden flex flex-col justify-center">
             <div className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">
                {isAssistant ? 'Chat GRC' : 'صارف'}
             </div>
          </div>
      </div>

      <div className="flex-1 space-y-4 md:space-y-8 overflow-hidden">
        <div 
          className={`prose max-w-none break-words leading-[1.8] md:leading-[2.2] ${isUrdu ? 'urdu-text text-right' : 'text-left'} prose-invert text-slate-200`}
          style={{ 
            fontSize: settings.fontSize === 'large' 
              ? (window.innerWidth < 768 ? (isUrdu ? '1.25rem' : '1.15rem') : (isUrdu ? '1.8rem' : '1.5rem'))
              : (window.innerWidth < 768 ? (isUrdu ? '1.05rem' : '0.95rem') : (isUrdu ? '1.4rem' : '1.2rem'))
          }}
          dir={isUrdu ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {sources.length > 0 && (
          <div className="mt-4 p-5 md:p-10 bg-black/40 rounded-2xl md:rounded-3xl border border-white/10 shadow-inner">
            <h4 className="text-[11px] md:text-lg font-bold text-sky-400 urdu-text mb-3 md:mb-5 border-r-2 border-sky-400 pr-3">تحقیق کے مستند مآخذ:</h4>
            <div className="flex flex-wrap gap-2 md:gap-4">
              {sources.map((s, idx) => (
                <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 md:px-5 md:py-3 bg-white/5 hover:bg-sky-500/10 rounded-xl text-[10px] md:text-sm text-sky-200 border border-white/10 truncate max-w-[140px] md:max-w-[300px] transition-all font-medium">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {isAssistant && message.content && (
          <div className="pt-3 flex flex-wrap items-center gap-3 md:gap-5 border-t border-white/5">
            <button onClick={handleCopy} className="p-2.5 md:p-3.5 text-slate-400 hover:text-sky-400 hover:bg-white/5 rounded-xl transition-all active:scale-90" title="کاپی">
              {copied ? <Check size={18} md:size={22} className="text-emerald-500" /> : <Copy size={18} md:size={22} />}
            </button>
            
            <div className="flex items-center bg-white/5 rounded-xl md:rounded-2xl p-0.5 md:p-1 border border-white/10">
              <button 
                onClick={handleSpeak} 
                disabled={audioState === 'loading'} 
                className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl transition-all text-[11px] md:text-lg font-bold urdu-text ${audioState !== 'idle' ? 'text-sky-400 bg-white/10' : 'text-slate-400'}`}
              >
                {audioState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : 
                 audioState === 'playing' ? <Pause size={14} md:size={18} /> : <Volume2 size={14} md:size={18} />}
                <span>{audioState === 'loading' ? 'لوڈنگ...' : audioState === 'playing' ? 'روکیں' : 'سنیں'}</span>
              </button>
              
              {audioState !== 'idle' && (
                <button onClick={stopAudio} className="p-2 md:p-3 text-red-400 hover:bg-white/10 rounded-lg ml-1">
                  <Square size={12} md:size={16} fill="currentColor" />
                </button>
              )}
            </div>

            <button onClick={handleShare} className="p-2.5 md:p-3.5 text-slate-400 hover:text-sky-400 hover:bg-white/5 rounded-xl transition-all" title="شیئر">
              <Share2 size={18} md:size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
