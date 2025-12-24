
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Sparkles, User, Copy, Check, Share2, Volume2, Pause, Loader2, Award, ExternalLink } from 'lucide-react';
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
    <div className={`w-full flex gap-3 md:gap-4 px-1 py-2 animate-bubble ${isAssistant ? 'justify-start' : 'flex-row-reverse'}`}>
      {/* Icon Wrapper */}
      <div className={`w-9 h-9 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 transition-transform duration-300 hover:scale-105 ${isAssistant ? 'bg-gradient-to-br from-[#0369a1] to-[#075985] border-white/20' : 'bg-white border-slate-200'}`}>
        {isAssistant ? <Sparkles className="text-white w-5 h-5" /> : <User className="text-[#0369a1] w-5 h-5" />}
      </div>

      <div className={`flex flex-col space-y-2 max-w-[88%] md:max-w-[82%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        {/* Label Row */}
        {isAssistant && (
          <div className="flex items-center gap-2 mb-1 px-1">
             <span className="text-[11px] md:text-[13px] font-black urdu-text text-[#075985] uppercase tracking-wide">تحقیقی رپورٹ • Chat GRC</span>
             <Award className="w-3.5 h-3.5 text-yellow-600" />
          </div>
        )}
        
        {/* Main Content Bubble */}
        <div 
          className={`break-words overflow-hidden rounded-2xl shadow-xl transition-all duration-300 ${isUrdu ? 'urdu-text text-right font-medium' : 'text-left'} ${
            isAssistant 
              ? 'bg-white text-black border border-slate-200 rounded-tl-none ring-1 ring-slate-100' 
              : 'bg-gradient-to-br from-[#0c4a6e] to-[#0369a1] text-white border border-white/10 rounded-tr-none shadow-[#0369a1]/10 font-bold'
          }`}
          style={{ 
            fontSize: settings.fontSize === 'large' ? '1.2rem' : '1.05rem',
            lineHeight: isUrdu ? '1.8' : '1.6'
          }}
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          <div 
            className={`prose prose-slate prose-sm md:prose-base max-w-none px-4 md:px-6 py-3.5 md:py-4 ${isAssistant ? 'prose-headings:text-[#0c4a6e] prose-headings:font-black' : 'prose-headings:text-white text-white'}`}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {/* Sources Section */}
        {sources.length > 0 && (
          <div className="w-full mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner" dir="rtl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0369a1]"></div>
              <p className="text-[11px] md:text-[13px] font-black text-[#0c4a6e] urdu-text">مستند مآخذ و مراجِع:</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sources.map((s, idx) => (
                <a 
                  key={idx} 
                  href={s.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-100 rounded-lg text-[10px] md:text-[12px] text-[#0369a1] border border-slate-200 transition-all group"
                >
                  <span className="truncate flex-1 text-right font-bold ml-2">{s.title}</span>
                  <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Assistant Action Buttons */}
        {isAssistant && message.content && (
          <div className="flex items-center gap-3 pt-2 px-1">
            <button 
              onClick={handleSpeak} 
              disabled={audioState === 'loading'} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-[11px] md:text-[13px] font-black urdu-text shadow-sm active:scale-95 ${audioState !== 'idle' ? 'bg-[#0369a1] text-white' : 'bg-white text-[#0369a1] border border-slate-200 hover:border-[#0369a1] hover:bg-slate-50'}`}
            >
              {audioState === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 
               audioState === 'playing' ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{audioState === 'playing' ? 'روکیں' : 'آواز'}</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

            <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-[#0369a1] hover:bg-slate-100 rounded-xl transition-all active:scale-90" title="کاپی">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            
            <button onClick={handleShare} className="p-2 text-slate-400 hover:text-[#0369a1] hover:bg-slate-100 rounded-xl transition-all active:scale-90" title="شیئر">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
