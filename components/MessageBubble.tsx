import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Sparkles, User, Copy, Check, Share2, Volume2, Pause, Loader2, Award, ExternalLink, MessageCircle, ChevronRight, Download } from 'lucide-react';
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

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, settings, contact, onSuggestionClick }) => {
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

      <div className={`flex flex-col space-y-2.5 max-w-[85%] md:max-w-[80%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        {isAssistant && (
          <div className="flex items-center gap-2 mb-0.5 px-1 opacity-80">
             <span className="text-[10px] md:text-[12px] font-black urdu-text text-[#075985] uppercase tracking-wider">{contact ? contact.name : 'تحقیقی جواب'}</span>
             {contact ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> : <Award className="w-3.5 h-3.5 text-yellow-600" />}
          </div>
        )}
        
        <div 
          className={`relative w-full overflow-hidden rounded-3xl transition-all duration-300 shadow-xl border ${isUrdu ? 'urdu-text text-right' : 'text-left'} ${
            isAssistant 
              ? `bg-white ${settings.highContrast ? 'bg-slate-900 border-slate-700' : 'border-slate-100 shadow-slate-200/50'} border rounded-tl-none` 
              : 'bg-gradient-to-br from-[#0c4a6e] to-[#0369a1] text-white border-white/10 rounded-tr-none shadow-[#0369a1]/20 font-bold'
          }`}
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          {attachments.map((att, idx) => (
            att.mimeType.startsWith('image/') && (
              <div key={idx} className="p-2">
                <div className="relative group overflow-hidden rounded-2xl border border-black/5 bg-slate-50">
                   <img src={att.data} alt={att.name} className="w-full h-auto max-h-[400px] object-contain" />
                   <div className="absolute top-2 right-2 flex gap-2">
                      <button 
                        onClick={() => handleDownloadImage(att.data, att.name)}
                        className="p-2.5 bg-black/60 backdrop-blur-md text-white rounded-xl active:scale-90"
                      >
                        <Download size={18} />
                      </button>
                   </div>
                </div>
              </div>
            )
          ))}

          <div 
            className={`prose prose-sm md:prose-base max-w-none px-4 md:px-7 py-4 md:py-6 overflow-x-hidden ${isAssistant ? (settings.highContrast ? 'prose-invert' : 'text-slate-900 prose-headings:text-[#0c4a6e]') : 'text-white prose-headings:text-white'}`}
            style={{ 
              fontSize: `${settings.fontSize}px`,
              lineHeight: getLineHeight()
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {isAssistant && sources.length > 0 && (
          <div className="w-full mt-4 rounded-3xl p-4 shadow-inner border bg-slate-100/50 border-slate-200" dir="rtl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#0369a1] animate-pulse"></div>
              <p className="text-[12px] md:text-[14px] font-black urdu-text text-[#0c4a6e]">مستند حوالہ جات:</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {sources.map((s, idx) => (
                <a 
                  key={idx} 
                  href={s.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] md:text-[13px] bg-white hover:shadow-md text-[#0369a1] border border-slate-200 transition-all"
                >
                  <span className="truncate flex-1 text-right font-black ml-3">{s.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-40 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {isAssistant && suggestions.length > 0 && (
          <div className="w-full mt-4 space-y-2" dir="rtl">
            {suggestions.map((s, idx) => (
              <button 
                key={idx}
                onClick={() => onSuggestionClick?.(s)}
                className="w-full text-right px-4 py-3 rounded-2xl border bg-white border-slate-200 text-[#0369a1] hover:border-[#0369a1] active:scale-[0.98] urdu-text text-sm font-bold shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {isAssistant && message.content && (
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <button 
              onClick={handleSpeak} 
              disabled={audioState === 'loading'} 
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[11px] font-black urdu-text shadow-md border ${audioState !== 'idle' ? 'bg-[#0369a1] text-white border-[#0369a1]' : 'bg-white text-[#0369a1] border-slate-200 shadow-sm'}`}
            >
              {audioState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
               audioState === 'playing' ? <Pause className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
              <span>{audioState === 'playing' ? 'روکیں' : 'آواز'}</span>
            </button>

            <button 
              onClick={handleWhatsAppShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white shadow-lg text-[11px] font-black urdu-text"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>واٹس ایپ</span>
            </button>

            <div className="flex items-center gap-1 bg-white/60 backdrop-blur-md rounded-full p-1 border border-slate-100">
              <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-[#0369a1]">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={handleShare} className="p-2 text-slate-400 hover:text-[#0369a1]">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};