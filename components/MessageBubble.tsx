
import React, { useMemo, useState, useRef, useEffect } from 'react';
/* Added Loader2 to imports to fix the error on line 181 */
import { Sparkles, User, Copy, Check, ExternalLink, FileText, Share2, Download, Volume2, VolumeX, Play, Pause, Square, Loader2 } from 'lucide-react';
import { Message, UserSettings } from '../types';
import { marked } from 'marked';
import { urduAI } from '../services/geminiService';

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
      alert("متن کاپی کر لیا گیا ہے۔");
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
    const base64Audio = await urduAI.textToSpeech(message.content, settings.voiceName);
    
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
    <div className={`w-full py-4 md:py-8 px-3 md:px-12 flex flex-col md:flex-row gap-3 md:gap-8 animate-bubble ${isAssistant ? 'bg-sky-500/[0.03] rounded-3xl md:rounded-[2.5rem] border border-sky-400/10' : ''}`}>
      
      <div className="flex shrink-0 gap-3 items-start md:mt-1">
         <div className={`w-9 h-9 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 border transition-all ${isAssistant ? 'bg-gradient-to-br from-sky-600 to-sky-400 border-sky-300/30' : 'bg-slate-800 border-white/10 shadow-xl'}`}>
            {isAssistant ? <Sparkles size={16} className="text-white md:w-8 md:h-8" /> : <User size={16} className="text-white md:w-8 md:h-8" />}
          </div>
          <div className="md:hidden flex flex-col justify-center">
             <div className="font-bold text-[9px] text-sky-400 uppercase tracking-widest">
                {isAssistant ? 'Chat GRC' : 'Authorized User'}
             </div>
          </div>
      </div>

      <div className="flex-1 space-y-3 md:space-y-6 overflow-hidden">
        <div 
          className={`prose prose-invert max-w-none break-words leading-relaxed md:leading-relaxed ${isUrdu ? 'urdu-text text-right' : 'text-left'} prose-headings:text-white prose-strong:text-sky-300 prose-code:bg-black/40 prose-code:px-2 prose-code:rounded prose-pre:bg-black/60 prose-pre:rounded-2xl text-slate-100`}
          style={{ 
            fontSize: settings.fontSize === 'large' ? (isUrdu ? '1.3rem' : '1.2rem') : (isUrdu ? '1.1rem' : '1.0rem')
          }}
          dir={isUrdu ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {sources.length > 0 && (
          <div className="mt-4 p-4 md:p-8 glass-panel rounded-2xl border-sky-400/20 bg-sky-500/5 shadow-inner">
            <h4 className="text-[10px] md:text-sm font-bold text-sky-300 urdu-text mb-3 md:mb-5">تصدیق شدہ مآخذ (Sources):</h4>
            <div className="flex flex-wrap gap-2 md:gap-4">
              {sources.map((s, idx) => (
                <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-black/50 hover:bg-black/70 rounded-lg text-[9px] md:text-xs text-sky-200 border border-white/5 transition-all truncate max-w-[150px] md:max-w-[300px]">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {isAssistant && message.content && (
          <div className="pt-3 flex flex-wrap items-center gap-2 md:gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button onClick={handleCopy} className="p-2.5 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 active:scale-90" title="کاپی">
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
            
            <div className="flex items-center bg-sky-600/10 rounded-xl border border-sky-500/20 p-1">
              <button 
                onClick={handleSpeak} 
                disabled={audioState === 'loading'} 
                className={`flex items-center gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-lg transition-all text-[10px] md:text-sm font-bold urdu-text ${audioState !== 'idle' ? 'text-sky-300 bg-sky-500/20' : 'text-sky-100 hover:text-white hover:bg-white/5'}`}
              >
                {audioState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : 
                 audioState === 'playing' ? <Pause size={14} /> : 
                 audioState === 'paused' ? <Play size={14} /> : <Volume2 size={14} />}
                <span>{audioState === 'loading' ? 'تیار...' : audioState === 'playing' ? 'روکیں' : 'آڈیو'}</span>
              </button>
              
              {audioState !== 'idle' && (
                <button onClick={stopAudio} className="p-2 text-red-400 hover:text-red-300 transition-colors">
                  <Square size={12} fill="currentColor" />
                </button>
              )}
            </div>

            <button onClick={handleShare} className="p-2.5 md:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 active:scale-90" title="شیئر">
              <Share2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
