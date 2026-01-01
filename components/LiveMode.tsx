
import React, { useEffect, useRef, useState } from 'react';
import { Mic, X, Radio, Loader2, ShieldCheck, Volume2, Waves } from 'lucide-react';
import { chatGRC } from '../services/geminiService';
import { UserSettings } from '../types';

interface LiveModeProps {
  onClose: () => void;
  settings: UserSettings;
}

export const LiveMode: React.FC<LiveModeProps> = ({ onClose, settings }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Manual implementation of encode/decode for absolute stability
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  useEffect(() => {
    initLiveSession();
    return () => {
      stopAll();
    };
  }, []);

  const initLiveSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = chatGRC.connectLive({
        voiceName: settings.voiceName,
        callbacks: {
          onOpen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            // Microphone stream to Gemini
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000'
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onAudio: async (base64) => {
            if (!audioContextRef.current) return;
            const buffer = await decodeAudioData(decode(base64), audioContextRef.current);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            
            sourcesRef.current.add(source);
            source.onended = () => sourcesRef.current.delete(source);
          },
          onTranscription: (text, isUser) => {
            setTranscription(text);
            setIsUserSpeaking(isUser);
          },
          onTurnComplete: () => {
            // Keep the last transcription until next turn starts
          },
          onInterrupted: () => {
            sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          },
          onClose: () => onClose()
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error("Live Failed:", err);
      onClose();
    }
  };

  const stopAll = () => {
    sessionPromiseRef.current?.then(s => s.close());
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-sky-950/98 backdrop-blur-2xl p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-10">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors">
          <X size={32} />
        </button>
        
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span className="urdu-text text-xs font-black text-white">جیمینی لائیو کنکشن</span>
          </div>
          <h2 className="text-2xl font-black urdu-text text-white">براہِ راست علمی گفتگو</h2>
        </div>

        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full bg-sky-500/10 border-2 border-sky-400/20 animate-ping duration-[3000ms] ${isActive ? 'block' : 'hidden'}`} />
          <div className={`absolute inset-4 rounded-full bg-sky-500/20 border-2 border-sky-400/30 animate-pulse ${isUserSpeaking ? 'scale-110' : 'scale-100'} transition-all duration-500`} />
          <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center z-10 shadow-2xl ${isUserSpeaking ? 'ring-8 ring-sky-400/30' : ''}`}>
            {isConnecting ? <Loader2 size={40} className="text-white animate-spin" /> : <Mic size={40} className="text-white" />}
          </div>
        </div>

        <div className="w-full text-center px-4 min-h-[100px] flex items-center justify-center">
           {isConnecting ? (
             <p className="urdu-text text-sky-200 text-lg animate-pulse">رابطہ کیا جا رہا ہے...</p>
           ) : (
             <p className="urdu-text text-white font-black text-xl leading-relaxed drop-shadow-md">
                {transcription || (isUserSpeaking ? "میں سن رہا ہوں..." : "کچھ پوچھیے...")}
             </p>
           )}
        </div>

        <div className="flex flex-col items-center gap-2 mt-4">
           <div className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
             <ShieldCheck size={12} className="text-emerald-400" />
             <span className="text-[9px] text-white/50 font-black uppercase tracking-widest">Global Research Center Encrypted</span>
           </div>
           <p className="text-[9px] text-sky-300 urdu-text font-black opacity-30">قاری خالد محمود گولڈ میڈلسٹ</p>
        </div>
      </div>
    </div>
  );
};
