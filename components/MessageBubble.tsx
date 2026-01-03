
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Sparkles, User, Copy, Check, Share2, Volume2, Pause, Loader2, Download, MessageCircle, Square, RefreshCcw, AlertTriangle, ExternalLink, Library } from 'lucide-react';
import { Message, UserSettings, Contact } from '../types';
import { marked } from 'marked';
import { chatGRC } from '../services/geminiService';
import { PresentationCard } from './PresentationCard';

interface MessageBubbleProps {
  message: Message;
  settings: UserSettings;
  contact?: Contact | null;
  onSuggestionClick?: (suggestion: string) => void;
  onRetry?: () => void;
}

type AudioState = 'idle' | 'loading' | 'playing' | 'paused';

let sharedAudioContext: AudioContext | null = null;

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, settings, onSuggestionClick, onRetry }) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  
  const suggestions = message.suggestions || [];
  const attachments = message.attachments || [];
  const sources = message.sources || [];
  const isUrdu = /[\u0600-\u06FF]/.test(message.content);

  const presentationData = message.presentation;

  const htmlContent = useMemo(() => {
    try {
      const contentToParse = presentationData ? "آپ کی پریزنٹیشن تیار ہے!" : (message.content || '');
      const parsed = marked.parse(contentToParse);
      return typeof parsed === 'string' ? parsed : (parsed as any).toString();
    } catch (e) {
      return message.content || '';
    }
  }, [message.content, presentationData]);

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
    const cleanContent = message.content.replace(/<div class="urdu-signature">|<\/div>/g, '');
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const cleanContent = message.content.replace(/<div class="urdu-signature">|<\/div>/g, '');
    const text = presentationData 
      ? `*Urdu AI Research Presentation: ${presentationData.title}*\n\n${presentationData.theme}\n\nطالب دعا: قاری خالد محمود بانی اردو اے آئی`
      : `*Urdu AI Research*\n\n${cleanContent}\n\nطالب دعا: قاری خالد محمود بانی اردو اے آئی`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    const cleanContent = message.content.replace(/<div class="urdu-signature">|<\/div>/g, '');
    if (navigator.share) {
      try {
        await navigator.share({
          title: presentationData ? presentationData.title : 'Urdu AI Research',
          text: cleanContent + "\n\nطالب دعا: قاری خالد محمود بانی اردو اے آئی",
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
    const cleanContent = message.content.replace(/<div class="urdu-signature">|<\/div>/g, '');
    const speakText = presentationData 
       ? `${presentationData.title}۔ ${presentationData.theme}۔ ${presentationData.conclusion}`
       : cleanContent;
    const base64Audio = await chatGRC.textToSpeech(speakText, settings.voiceName);
    
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
    <div className={`w-full flex gap-3 md:gap-4 px-4 md:px-6 py-4 transition-colors ${isAssistant ? 'bg-transparent' : 'flex-row-reverse bg-transparent'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${isAssistant ? (message.isError ? 'bg-red-500 text-white' : 'bg-[#0c4a6e] text-white border-white/10') : 'bg-white text-[#0c4a6e] border-slate-200'}`}>
        {isAssistant ? (message.isError ? <AlertTriangle size={18} /> : <Sparkles size={18} />) : <User size={18} />}
      </div>

      <div className={`flex flex-col space-y-3 flex-1 min-w-0 ${isAssistant ? 'items-start' : 'items-end'}`}>
        {presentationData ? (
           <PresentationCard data={presentationData} />
        ) : (
          <div 
            className={`w-full prose prose-slate max-w-none ${isUrdu ? 'urdu-text text-right' : 'text-left'} ${isAssistant ? (message.isError ? 'text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100' : 'text-slate-800') : 'text-[#0c4a6e] font-bold'}`}
            dir={isUrdu ? 'rtl' : 'ltr'}
            style={{ fontSize: `14px`, lineHeight: '1.45' }}
          >
            {/* User Attachments */}
            {attachments.map((att, idx) => (
              att.mimeType.startsWith('image/') && (
                <div key={idx} className="mb-4">
                  <div className="relative group inline-block overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50 max-w-full">
                     <img src={att.data} alt={att.name} className="max-w-full h-auto max-h-[400px] object-contain" />
                     <button onClick={() => handleDownloadImage(att.data, att.name)} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Download size={16} /></button>
                  </div>
                </div>
              )
            ))}

            <div className="break-words overflow-hidden" dangerouslySetInnerHTML={{ __html: htmlContent }} />

            {/* Research Sources / Grounding */}
            {isAssistant && sources.length > 0 && (
              <div className="mt-8 pt-4 border-t border-slate-100 space-y-3">
                 <div className="flex items-center gap-2 text-[#0c4a6e] font-black text-sm mb-2">
                    <Library size={16} />
                    <span>تحقیق کے مآخذ:</span>
                 </div>
                 <div className="flex flex-col gap-2">
                    {sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-sky-50 transition-all text-xs text-sky-800 font-bold decoration-none no-underline"
                      >
                         <span className="truncate flex-1 text-right">{source.title || source.uri}</span>
                         <ExternalLink size={12} className="shrink-0 ml-3" />
                      </a>
                    ))}
                 </div>
              </div>
            )}
          </div>
        )}

        {isAssistant && (
          <div className="flex flex-col w-full">
            {message.isError && onRetry && (
               <button 
                 onClick={onRetry}
                 className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-black urdu-text hover:bg-red-700 transition-all shadow-md active:scale-95 mt-2 self-start"
               >
                 <RefreshCcw size={14} />
                 <span>پھر سے کوشش کریں</span>
               </button>
            )}

            {!message.isError && suggestions.length > 0 && (
              <div className="w-full mt-4 flex flex-wrap gap-2 justify-end" dir="rtl">
                {suggestions.map((s, idx) => (
                  <button key={idx} onClick={() => onSuggestionClick?.(s)} className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-[#0c4a6e] hover:border-[#0c4a6e] transition-all urdu-text text-xs font-bold shadow-sm">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {!message.isError && (
              <div className="flex flex-wrap items-center gap-2 pt-4">
                <div className="flex items-center bg-slate-100/50 rounded-full p-0.5 border border-slate-200 shadow-sm">
                  <button 
                    onClick={handleSpeak} 
                    disabled={audioState === 'loading'} 
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-[15px] whitespace-nowrap font-black urdu-text ${audioState === 'playing' ? 'bg-[#0c4a6e] text-white shadow-inner' : 'bg-white text-[#0c4a6e] border border-slate-100'}`}
                  >
                    {audioState === 'loading' ? <Loader2 size={14} className="animate-spin" /> : audioState === 'playing' ? <Pause size={14} /> : <Volume2 size={14} />}
                    <span>{audioState === 'playing' ? 'توقف' : 'سنائیں'}</span>
                  </button>
                  
                  {(audioState === 'playing' || audioState === 'paused') && (
                    <button 
                      onClick={stopAudio} 
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors mx-1"
                      title="بند کریں"
                    >
                      <Square size={12} fill="currentColor" />
                    </button>
                  )}
                </div>

                <button onClick={handleWhatsAppShare} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#25D366] text-white text-[15px] whitespace-nowrap font-black urdu-text hover:bg-[#128C7E] transition-colors shadow-sm">
                  <MessageCircle size={14} />
                  <span>واٹس ایپ</span>
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={handleCopy} title="کاپی کریں" className="p-2 text-slate-400 hover:text-[#0c4a6e] transition-colors">
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                  <button onClick={handleShare} title="شیئر کریں" className="p-2 text-slate-400 hover:text-[#0c4a6e] transition-colors">
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
