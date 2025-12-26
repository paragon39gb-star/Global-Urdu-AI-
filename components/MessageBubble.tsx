
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Sparkles, User, Copy, Check, Share2, Volume2, Pause, Loader2, Award, ExternalLink, MessageCircle } from 'lucide-react';
import { Message, UserSettings, Contact } from '../types';
import { marked } from 'marked';
import { chatGRC } from '../services/geminiService';

interface MessageBubbleProps {
  message: Message;
  settings: UserSettings;
  contact?: Contact | null;
}

type AudioState = 'idle' | 'loading' | 'playing' | 'paused';

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, settings, contact }) => {
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

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`*Urdu AI Research*\n\n${message.content}\n\n_GRC - قاری خالد محمود گولڈ میڈلسٹ_`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Urdu AI Research',
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

  const getLineHeight = () => {
    if (!isUrdu) return '1.6';
    if (settings.fontFamily === 'nastaleeq') return '2.2';
    return '1.8';
  };

  return (
    <div className={`w-full flex gap-3 md:gap-5 px-1 py-5 animate-bubble ${isAssistant ? 'justify-start' : 'flex-row-reverse'}`}>
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 transition-transform duration-300 hover:scale-110 ${isAssistant ? (contact ? 'bg-transparent border-transparent' : 'bg-gradient-to-br from-[#0369a1] to-[#075985] border-white/20') : 'bg-white border-slate-200'}`}>
        {isAssistant ? (
          contact ? (
            <img src={contact.avatar} alt={contact.name} className="w-full h-full rounded-2xl border-2 border-emerald-500/20" />
          ) : (
            <Sparkles className="text-white w-6 h-6" />
          )
        ) : (
          <User className="text-[#0369a1] w-6 h-6" />
        )}
      </div>

      <div className={`flex flex-col space-y-2.5 max-w-[88%] md:max-w-[82%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        {isAssistant && (
          <div className="flex items-center gap-2 mb-0.5 px-1 opacity-80">
             <span className="text-[10px] md:text-[12px] font-black urdu-text text-[#075985] uppercase tracking-wider">{contact ? contact.name : 'تحقیقی جواب'}</span>
             {contact ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> : <Award className="w-3.5 h-3.5 text-yellow-600" />}
          </div>
        )}
        
        <div 
          className={`relative overflow-hidden rounded-3xl transition-all duration-300 ${isUrdu ? 'urdu-text text-right' : 'text-left'} ${
            isAssistant 
              ? `bg-white ${settings.highContrast ? 'bg-slate-900 border-slate-700' : 'border-slate-100 shadow-xl shadow-slate-200/50'} border rounded-tl-none` 
              : 'bg-gradient-to-br from-[#0c4a6e] to-[#0369a1] text-white border border-white/10 rounded-tr-none shadow-[#0369a1]/20 shadow-lg font-bold'
          }`}
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          <div 
            className={`prose prose-sm md:prose-base max-w-none px-5 md:px-7 py-5 md:py-6 ${isAssistant ? (settings.highContrast ? 'prose-invert' : 'text-slate-900 prose-headings:text-[#0c4a6e]') : 'text-white prose-headings:text-white'}`}
            style={{ 
              fontSize: `${settings.fontSize}px`,
              lineHeight: getLineHeight()
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {sources.length > 0 && (
          <div className={`w-full mt-4 rounded-3xl p-5 shadow-inner border animate-in fade-in duration-500 ${settings.highContrast ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100/50 border-slate-200'}`} dir="rtl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#0369a1] animate-pulse"></div>
              <p className={`text-[12px] md:text-[14px] font-black urdu-text ${settings.highContrast ? 'text-sky-400' : 'text-[#0c4a6e]'}`}>مستند حوالہ جات:</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {sources.map((s, idx) => (
                <a 
                  key={idx} 
                  href={s.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] md:text-[13px] border transition-all group ${settings.highContrast ? 'bg-slate-800 border-slate-700 text-sky-300 hover:bg-slate-700' : 'bg-white hover:bg-white hover:shadow-md hover:border-[#0369a1]/30 text-[#0369a1] border-slate-200 shadow-sm'}`}
                >
                  <span className="truncate flex-1 text-right font-black ml-3">{s.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}

        {isAssistant && message.content && (
          <div className="flex items-center gap-2 md:gap-3 pt-2.5 px-1 flex-wrap">
            <button 
              onClick={handleSpeak} 
              disabled={audioState === 'loading'} 
              className={`flex items-center gap-2.5 px-5 py-2 rounded-full transition-all text-[11px] md:text-[13px] font-black urdu-text shadow-md active:scale-95 border ${audioState !== 'idle' ? 'bg-[#0369a1] text-white border-[#0369a1]' : (settings.highContrast ? 'bg-slate-800 text-sky-300 border-slate-700 hover:border-sky-500' : 'bg-white text-[#0369a1] border-slate-200 hover:border-[#0369a1] shadow-sm')}`}
            >
              {audioState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
               audioState === 'playing' ? <Pause className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
              <span>{audioState === 'playing' ? 'روکیں' : 'آواز'}</span>
            </button>

            <button 
              onClick={handleWhatsAppShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white shadow-lg active:scale-95 transition-all text-[11px] md:text-[13px] font-black urdu-text"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>واٹس ایپ</span>
            </button>

            <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md rounded-full p-1.5 border border-slate-100 shadow-sm">
              <button onClick={handleCopy} className={`p-2.5 rounded-full transition-all active:scale-90 ${settings.highContrast ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-[#0369a1] hover:bg-slate-100'}`} title="کاپی">
                {copied ? <Check className="w-4.5 h-4.5 text-emerald-500" /> : <Copy className="w-4.5 h-4.5" />}
              </button>
              <button onClick={handleShare} className={`p-2.5 rounded-full transition-all active:scale-90 ${settings.highContrast ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-[#0369a1] hover:bg-slate-100'}`} title="شیئر">
                <Share2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
