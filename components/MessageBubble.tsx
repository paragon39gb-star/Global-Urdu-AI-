
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Sparkles, User, Copy, Check, Share2, Volume2, Pause, Loader2, Award, ExternalLink, MessageCircle, Download } from 'lucide-react';
import { Message, UserSettings, Contact } from '../types';
import { marked } from 'marked';
import { chatGRC } from '../services/geminiService';

interface MessageBubbleProps {
  message: Message;
  settings: UserSettings;
  contact?: Contact | null;
  onSuggestionClick?: (suggestion: string) => void;
}

type AudioState = 'idle' | 'loading' | 'playing' | 'paused';

let sharedAudioContext: AudioContext | null = null;

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, settings, onSuggestionClick }) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  
  const sources = message.sources || [];
  const suggestions = message.suggestions || [];
  const attachments = message.attachments || [];
  const isUrdu = /[\u0600-\u06FF]/.test(message.content);

  const htmlContent = useMemo(() => {
    try {
      const parsed = marked.parse(message.content || '');
      return typeof parsed === 'string' ? parsed : (parsed as any).toString();
    } catch (e) {
      return message.content || '';
    }
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
    const text = `*Urdu AI Research*\n\n${message.content}\n\n_تحقیق: گلوبل ریسرچ سینٹر - قاری خالد محمود گولڈ میڈلسٹ_`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Urdu AI Research',
          text: message.content,
          url: window.location.href,
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadImage = (data: string, name: string) => {
    const link = document.createElement('a');
    link.href = data;
    link.download = name;
    link.click();
  };

  const getAudioContext = () => {
    if (!sharedAudioContext) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      sharedAudioContext = new AudioContextClass({ sampleRate: 24000 });
    }
    if (sharedAudioContext?.state === 'suspended') sharedAudioContext.resume();
    return sharedAudioContext;
  };

  const handleSpeak = async () => {
    if (audioState === 'playing') {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
        sourceNodeRef.current = null;
      }
      const ctx = getAudioContext();
      if (ctx) {
        const elapsedSinceStart = ctx.currentTime - startTimeRef.current;
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
        const ctx = getAudioContext();
        if (!ctx) throw new Error("AudioContext failed");

        const dataInt16 = new Int16Array(arrayBuffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
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
    const ctx = getAudioContext();
    if (!ctx || !audioBufferRef.current) return;
    
    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = settings.voiceSpeed;
    const gainNode = ctx.createGain();
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const duration = audioBufferRef.current.duration;
    const startPos = Math.max(0, Math.min(offset, duration - 0.01));
    
    source.start(0, startPos);
    sourceNodeRef.current = source;
    startTimeRef.current = ctx.currentTime;
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
    <div className={`w-full flex gap-3 md:gap-6 px-4 md:px-8 py-6 border-b border-slate-50 transition-colors hover:bg-slate-50/30 ${isAssistant ? 'bg-white' : 'bg-slate-50/50 flex-row-reverse'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${isAssistant ? 'bg-[#0c4a6e] text-white border-white/10' : 'bg-white text-[#0c4a6e] border-slate-200'}`}>
        {isAssistant ? <Sparkles size={18} /> : <User size={18} />}
      </div>

      <div className={`flex flex-col space-y-3 flex-1 max-w-[90%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        <div 
          className={`w-full prose prose-slate max-w-none ${isUrdu ? 'urdu-text text-right' : 'text-left'} ${isAssistant ? 'text-slate-800' : 'text-[#0c4a6e] font-bold'}`}
          dir={isUrdu ? 'rtl' : 'ltr'}
          style={{ fontSize: `${settings.fontSize}px`, lineHeight: '2.0' }}
        >
          {attachments.map((att, idx) => (
            att.mimeType.startsWith('image/') && (
              <div key={idx} className="mb-4">
                <div className="relative group inline-block overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50">
                   <img src={att.data} alt={att.name} className="max-w-full h-auto max-h-[400px] object-contain" />
                   <button onClick={() => handleDownloadImage(att.data, att.name)} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Download size={16} /></button>
                </div>
              </div>
            )
          ))}
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>

        {isAssistant && (
          <>
            {sources.length > 0 && (
              <div className="w-full mt-4 space-y-2 border-r-4 border-[#0c4a6e] pr-4 py-1" dir="rtl">
                <p className="text-xs font-black urdu-text text-[#0c4a6e]">مستند حوالہ جات:</p>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, idx) => (
                    <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] bg-slate-100 hover:bg-slate-200 text-[#0c4a6e] transition-all">
                      <span className="font-black urdu-text">{s.title}</span>
                      <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="w-full mt-4 flex flex-wrap gap-2 justify-end" dir="rtl">
                {suggestions.map((s, idx) => (
                  <button key={idx} onClick={() => onSuggestionClick?.(s)} className="px-4 py-2 rounded-full border border-slate-200 bg-white text-[#0c4a6e] hover:border-[#0c4a6e] transition-all urdu-text text-xs font-bold">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-4">
              <button onClick={handleSpeak} disabled={audioState === 'loading'} className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-xs font-black urdu-text border ${audioState !== 'idle' ? 'bg-[#0c4a6e] text-white' : 'bg-slate-100 text-[#0c4a6e] border-transparent'}`}>
                {audioState === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                <span>آواز</span>
              </button>
              <button onClick={handleWhatsAppShare} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-black urdu-text"><MessageCircle size={12} /><span>واٹس ایپ</span></button>
              <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-[#0c4a6e] transition-colors">{copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}</button>
              <button onClick={handleShare} className="p-2 text-slate-400 hover:text-[#0c4a6e] transition-colors"><Share2 size={14} /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
